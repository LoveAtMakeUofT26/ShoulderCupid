import { useCallback, useEffect, useRef, useState } from 'react'
import { logger } from '../utils/logger'

export type CheckId = 'camera' | 'microphone' | 'speaker' | 'backend' | 'stt' | 'gemini'
export type CheckState = 'idle' | 'checking' | 'passed' | 'failed'

export interface CheckResult {
  state: CheckState
  error?: string
}

interface UsePreflightChecksOptions {
  cameraSource: 'webcam' | 'esp32'
}

export function usePreflightChecks({ cameraSource }: UsePreflightChecksOptions) {
  const [checks, setChecks] = useState<Record<CheckId, CheckResult>>({
    camera: { state: 'idle' },
    microphone: { state: 'idle' },
    speaker: { state: 'idle' },
    backend: { state: 'idle' },
    stt: { state: 'idle' },
    gemini: { state: 'idle' },
  })

  const cameraStreamRef = useRef<MediaStream | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const updateCheck = useCallback((id: CheckId, result: CheckResult) => {
    setChecks(prev => ({ ...prev, [id]: result }))
  }, [])

  const checkCamera = useCallback(async () => {
    updateCheck('camera', { state: 'checking' })
    try {
      if (cameraSource === 'webcam') {
        // Stop any existing camera stream
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach(t => t.stop())
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        })
        cameraStreamRef.current = stream
        logger.log('Preflight: camera passed (webcam)')
        updateCheck('camera', { state: 'passed' })
      } else {
        // ESP32 camera — just verify backend is reachable (ESP32 streams through backend)
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 5000)
        try {
          const res = await fetch('/api/health', { signal: ctrl.signal })
          clearTimeout(timer)
          if (res.ok) {
            logger.log('Preflight: camera passed (ESP32 backend reachable)')
            updateCheck('camera', { state: 'passed' })
          } else {
            logger.warn('Preflight: camera failed — ESP32 backend unreachable')
            updateCheck('camera', { state: 'failed', error: 'ESP32 backend unreachable' })
          }
        } catch {
          clearTimeout(timer)
          logger.warn('Preflight: camera failed — cannot reach ESP32 backend')
          updateCheck('camera', { state: 'failed', error: 'Cannot reach ESP32 backend' })
        }
      }
    } catch (err) {
      const msg = err instanceof Error
        ? err.name === 'NotAllowedError' ? 'Camera permission denied'
        : err.name === 'NotFoundError' ? 'No camera found'
        : err.message
        : 'Camera check failed'
      logger.warn('Preflight: camera failed —', msg)
      updateCheck('camera', { state: 'failed', error: msg })
    }
  }, [cameraSource, updateCheck])

  const checkMicrophone = useCallback(async () => {
    updateCheck('microphone', { state: 'checking' })
    try {
      // Stop any existing mic stream
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop())
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream

      // Create analyser for volume meter
      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      logger.log('Preflight: microphone passed')
      updateCheck('microphone', { state: 'passed' })
    } catch (err) {
      const msg = err instanceof Error
        ? err.name === 'NotAllowedError' ? 'Microphone permission denied'
        : err.name === 'NotFoundError' ? 'No microphone found'
        : err.message
        : 'Microphone check failed'
      logger.warn('Preflight: microphone failed —', msg)
      updateCheck('microphone', { state: 'failed', error: msg })
    }
  }, [updateCheck])

  const checkSpeaker = useCallback(async () => {
    updateCheck('speaker', { state: 'checking' })
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const outputs = devices.filter(d => d.kind === 'audiooutput')
      // Some browsers don't enumerate output devices — treat as passed
      if (outputs.length > 0 || !('setSinkId' in HTMLAudioElement.prototype)) {
        updateCheck('speaker', { state: 'passed' })
      } else {
        updateCheck('speaker', { state: 'failed', error: 'No audio output device found' })
      }
    } catch {
      // enumerateDevices not supported — assume speaker exists
      updateCheck('speaker', { state: 'passed' })
    }
  }, [updateCheck])

  const checkBackend = useCallback(async (signal?: AbortSignal) => {
    updateCheck('backend', { state: 'checking' })
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 5000)
      const effectiveSignal = signal || ctrl.signal
      const res = await fetch('/api/health', { signal: effectiveSignal })
      clearTimeout(timer)
      if (res.ok) {
        logger.log('Preflight: backend passed')
        updateCheck('backend', { state: 'passed' })
      } else if (res.status === 502 || res.status === 503) {
        updateCheck('backend', { state: 'failed', error: 'Server is restarting — try again in a few seconds' })
      } else if (res.status === 404) {
        updateCheck('backend', { state: 'failed', error: 'Server is outdated — health endpoint not found' })
      } else {
        updateCheck('backend', { state: 'failed', error: `Server error (${res.status}) — try again` })
      }
    } catch {
      updateCheck('backend', { state: 'failed', error: 'Cannot reach server — is the backend running?' })
    }
  }, [updateCheck])

  const checkSTT = useCallback(async (signal?: AbortSignal) => {
    updateCheck('stt', { state: 'checking' })
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 10000)
      const effectiveSignal = signal || ctrl.signal
      const res = await fetch('/api/stt/health', { signal: effectiveSignal })
      clearTimeout(timer)
      if (res.ok) {
        logger.log('Preflight: stt passed')
        updateCheck('stt', { state: 'passed' })
      } else if (res.status === 502 || res.status === 503) {
        updateCheck('stt', { state: 'failed', error: 'Server is restarting — try again in a few seconds' })
      } else {
        updateCheck('stt', { state: 'failed', error: 'Speech-to-text unavailable — check API key' })
      }
    } catch {
      updateCheck('stt', { state: 'failed', error: 'Cannot reach server for STT' })
    }
  }, [updateCheck])

  const checkGemini = useCallback(async (signal?: AbortSignal) => {
    updateCheck('gemini', { state: 'checking' })
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 10000)
      const effectiveSignal = signal || ctrl.signal
      const res = await fetch('/api/gemini/health', { signal: effectiveSignal })
      clearTimeout(timer)
      if (res.ok) {
        logger.log('Preflight: gemini passed')
        updateCheck('gemini', { state: 'passed' })
      } else if (res.status === 502 || res.status === 503) {
        updateCheck('gemini', { state: 'failed', error: 'Server is restarting — try again in a few seconds' })
      } else {
        updateCheck('gemini', { state: 'failed', error: 'AI coach unavailable — check GOOGLE_AI_API_KEY' })
      }
    } catch {
      updateCheck('gemini', { state: 'failed', error: 'Cannot reach server for AI coach' })
    }
  }, [updateCheck])

  const runAllChecks = useCallback(async () => {
    logger.log('Preflight: running all checks, cameraSource:', cameraSource)
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    await Promise.allSettled([
      checkCamera(),
      checkMicrophone(),
      checkSpeaker(),
      checkBackend(ctrl.signal),
      checkSTT(ctrl.signal),
      checkGemini(ctrl.signal),
    ])
  }, [cameraSource, checkCamera, checkMicrophone, checkSpeaker, checkBackend, checkSTT, checkGemini])

  const retryCheck = useCallback(async (id: CheckId) => {
    const checkMap: Record<CheckId, () => Promise<void>> = {
      camera: checkCamera,
      microphone: checkMicrophone,
      speaker: checkSpeaker,
      backend: () => checkBackend(),
      stt: () => checkSTT(),
      gemini: () => checkGemini(),
    }
    await checkMap[id]()
  }, [checkCamera, checkMicrophone, checkSpeaker, checkBackend, checkSTT, checkGemini])

  // Re-run camera check when camera source changes
  useEffect(() => {
    if (checks.camera.state !== 'idle') {
      checkCamera()
    }
  }, [cameraSource]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop())
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop())
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
      }
    }
  }, [])

  const allPassed = Object.values(checks).every(c => c.state === 'passed')
  const anyChecking = Object.values(checks).some(c => c.state === 'checking')
  const anyFailed = Object.values(checks).some(c => c.state === 'failed')

  return {
    checks,
    allPassed,
    anyChecking,
    anyFailed,
    runAllChecks,
    retryCheck,
    cameraStream: cameraStreamRef.current,
    micAnalyser: analyserRef.current,
  }
}
