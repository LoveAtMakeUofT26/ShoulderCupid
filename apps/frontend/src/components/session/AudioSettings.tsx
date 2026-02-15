import { useEffect, useState } from 'react'

interface AudioDevice {
  deviceId: string
  label: string
}

interface AudioSettingsProps {
  onMicChange?: (deviceId: string) => void
  onSpeakerChange?: (deviceId: string) => void
}

export function AudioSettings({ onMicChange, onSpeakerChange }: AudioSettingsProps) {
  const [microphones, setMicrophones] = useState<AudioDevice[]>([])
  const [speakers, setSpeakers] = useState<AudioDevice[]>([])
  const [selectedMic, setSelectedMic] = useState<string>('')
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('')

  useEffect(() => {
    async function loadDevices() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })

        const devices = await navigator.mediaDevices.enumerateDevices()

        const mics = devices
          .filter(d => d.kind === 'audioinput')
          .map(d => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`,
          }))

        const spkrs = devices
          .filter(d => d.kind === 'audiooutput')
          .map(d => ({
            deviceId: d.deviceId,
            label: d.label || `Speaker ${d.deviceId.slice(0, 8)}`,
          }))

        setMicrophones(mics)
        setSpeakers(spkrs)

        if (mics.length > 0 && !selectedMic) setSelectedMic(mics[0].deviceId)
        if (spkrs.length > 0 && !selectedSpeaker) setSelectedSpeaker(spkrs[0].deviceId)
      } catch (err) {
        console.error('Failed to enumerate audio devices:', err)
      }
    }

    loadDevices()
  }, [])

  const handleMicChange = (deviceId: string) => {
    setSelectedMic(deviceId)
    onMicChange?.(deviceId)
  }

  const handleSpeakerChange = (deviceId: string) => {
    setSelectedSpeaker(deviceId)
    onSpeakerChange?.(deviceId)
  }

  return (
    <div className="space-y-3">
      {/* Microphone */}
      <div>
        <label className="block text-xs text-[var(--color-text-faint)] mb-1">🎤 Microphone</label>
        <select
          value={selectedMic}
          onChange={e => handleMicChange(e.target.value)}
          className="w-full text-sm rounded-lg px-3 py-2 border focus:outline-none"
          style={{ backgroundColor: 'var(--color-surface-secondary)', color: 'var(--color-text)', borderColor: 'var(--color-border-strong)' }}
        >
          {microphones.map(mic => (
            <option key={mic.deviceId} value={mic.deviceId}>
              {mic.label}
            </option>
          ))}
        </select>
      </div>

      {/* Speaker */}
      <div>
        <label className="block text-xs text-[var(--color-text-faint)] mb-1">🔊 Speaker</label>
        <select
          value={selectedSpeaker}
          onChange={e => handleSpeakerChange(e.target.value)}
          className="w-full text-sm rounded-lg px-3 py-2 border focus:outline-none"
          style={{ backgroundColor: 'var(--color-surface-secondary)', color: 'var(--color-text)', borderColor: 'var(--color-border-strong)' }}
        >
          {speakers.map(spk => (
            <option key={spk.deviceId} value={spk.deviceId}>
              {spk.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
