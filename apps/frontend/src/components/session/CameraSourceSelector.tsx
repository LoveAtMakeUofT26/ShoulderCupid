import type React from 'react'

export type CameraSource = 'webcam' | 'esp32'

interface CameraSourceSelectorProps {
  value: CameraSource
  onChange: (source: CameraSource) => void
  esp32Connected?: boolean
}

export function CameraSourceSelector({ value, onChange, esp32Connected = false }: CameraSourceSelectorProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange('webcam')}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
          value === 'webcam'
            ? 'bg-cupid-500 text-white'
            : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
        }`}
      >
        <span>📷</span>
        <span>ESP32-CAM</span>
      </button>
      <button
        onClick={() => onChange('esp32')}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
          value === 'esp32'
            ? 'bg-cupid-500 text-white'
            : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
        }`}
      >
        <span>💻</span>
        <span>Webcam</span>
        {!esp32Connected && value === 'esp32' && (
          <span className="w-2 h-2 rounded-full bg-red-500" />
        )}
      </button>
    </div>
  )
}

interface CameraFeedProps {
  source: CameraSource
  videoRef?: React.RefObject<HTMLVideoElement | null> | React.LegacyRef<HTMLVideoElement>
  esp32StreamUrl?: string
  isActive?: boolean
  frameCount?: number
}

export function CameraFeed({ source, videoRef, esp32StreamUrl, isActive, frameCount }: CameraFeedProps) {
  if (source === 'webcam') {
    return (
      <div className="relative w-full h-full">
        <video
          ref={videoRef as React.LegacyRef<HTMLVideoElement>}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover rounded-2xl"
          style={{ transform: 'scaleX(-1)' }} // Mirror for selfie view
        />
        {isActive && (
          <div className="absolute top-3 right-3 flex items-center gap-2 rounded-lg px-3 py-1" style={{ backgroundColor: 'var(--color-overlay)' }}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-white text-xs font-medium">
              LIVE {frameCount !== undefined && `(${frameCount} frames)`}
            </span>
          </div>
        )}
      </div>
    )
  }

  // ESP32-CAM MJPEG stream
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {esp32StreamUrl ? (
        <img
          src={esp32StreamUrl}
          alt="ESP32-CAM feed"
          className="w-full h-full object-cover rounded-2xl"
        />
      ) : (
        <div className="text-center text-[var(--color-text-faint)]">
          <p className="text-4xl mb-2">📷</p>
          <p className="text-sm">ESP32-CAM not connected</p>
          <p className="text-xs mt-1 text-[var(--color-text-tertiary)]">Switch to Webcam for testing</p>
        </div>
      )}
    </div>
  )
}
