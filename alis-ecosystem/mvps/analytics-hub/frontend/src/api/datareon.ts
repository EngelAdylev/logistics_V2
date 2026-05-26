import axios from 'axios'

export interface EventDto {
  id: string
  time: string
  direction: 'INBOUND' | 'OUTBOUND'
  system: string
  eventType: string
  status: string
  error: string | null
}

export interface SummaryDto {
  total: number
  success: number
  errors: number
  stuck: number
}

export type PeriodFilter = '1h' | '6h' | '24h'
export type StatusFilter = 'ALL' | 'ERROR' | 'STUCK'
export type SystemFilter = 'ALL' | 'WMS' | 'TOS' | '1C' | 'DATAREON'

export const datareonApi = {
  getSummary: (period: PeriodFilter = '1h') =>
    axios.get<SummaryDto>('/api/datareon/summary', { params: { period } }).then(r => r.data),

  getEvents: (params: { period: PeriodFilter; status: StatusFilter; system: SystemFilter; page: number; size: number }) =>
    axios.get<EventDto[]>('/api/datareon/events', { params }).then(r => r.data),
}
