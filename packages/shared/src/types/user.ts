export interface User {
  _id: string
  email: string
  oauth_provider: 'google' | 'discord'
  oauth_id: string
  credits: number
  devices: Device[]
  created_at: Date
}

export interface Device {
  device_id: string
  paired_at: Date
}
