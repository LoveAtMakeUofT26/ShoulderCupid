import type React from 'react'
import { CameraFeed, type CameraSource } from './CameraSourceSelector'
import type { CoachingMode } from '../../hooks/useSessionSocket'

interface CameraViewportProps {
  cameraSource: CameraSource
  videoRef: React.RefObject<HTMLVideoElement | null> | React.LegacyRef<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement | null> | React.LegacyRef<HTMLCanvasElement>
  isConnected: boolean
  isActive: boolean
  frameCount: number
  mode: CoachingMode
  distance: number
  webcamError: string | null
  minHeight?: string
}

export function CameraViewport({
  cameraSource,
  videoRef,
  canvasRef,
  isConnected,
  isActive,
  frameCount,
  mode,
  distance,
  webcamError,
  minHeight = '200px',
}: CameraViewportProps) {
  return (
    <div
      className="flex-1 rounded-2xl relative overflow-hidden"
      style={{ minHeight, backgroundColor: 'var(--color-surface)' }}
    >
      <CameraFeed
        source={cameraSource}
        videoRef={videoRef}
        esp32StreamUrl={cameraSource === 'esp32' && isConnected ? '/api/stream' : undefined}
        isActive={isActive}
        frameCount={frameCount}
      />
      <canvas ref={canvasRef as React.LegacyRef<HTMLCanvasElement>} className="hidden" />

      <div className="absolute top-3 left-3">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
          mode === 'CONVERSATION' ? 'bg-cupid-500' :
          mode === 'APPROACH' ? 'bg-gold-500' : 'bg-[var(--color-text-faint)]'
        }`}>
          {mode === 'IDLE' ? 'Scanning...' : mode}
        </span>
      </div>

      {distance > 0 && (
        <div className="absolute bottom-3 left-3 rounded-lg px-3 py-1" style={{ backgroundColor: 'var(--color-overlay)' }}>
          <span className="text-white text-sm font-medium">
            {Math.round(distance)}cm away
          </span>
        </div>
      )}

      {webcamError && (
        <div className="absolute bottom-3 right-3 bg-red-500/80 rounded-lg px-3 py-1">
          <span className="text-white text-xs">{webcamError}</span>
        </div>
      )}
    </div>
  )
}

interface TranscriptionStatusProps {
  isConnected: boolean
  partialTranscript: string
  error?: string | null
}

export function TranscriptionStatus({ isConnected, partialTranscript, error }: TranscriptionStatusProps) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
        error ? 'bg-red-500' : isConnected ? 'bg-green-500 animate-pulse' : 'bg-[var(--color-text-faint)]'
      }`} />
      {error ? (
        <p className="text-xs text-red-400 truncate">{error}</p>
      ) : partialTranscript ? (
        <p className="text-xs text-[var(--color-text-tertiary)] italic truncate">"{partialTranscript}"</p>
      ) : (
        <p className="text-xs text-[var(--color-text-faint)]">
          {isConnected ? 'Listening...' : 'Mic off'}
        </p>
      )}
    </div>
  )
}
