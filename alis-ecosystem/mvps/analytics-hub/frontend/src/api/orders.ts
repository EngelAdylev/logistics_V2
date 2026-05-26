import axios from 'axios'

export interface OrderSummaryDto {
  draft: number
  onReview: number
  accepted: number
  inProgress: number
  done: number
  type: 'RECEIVING' | 'SHIPPING'
}

export interface StuckOrderDto {
  id: string
  number: number
  type: 'RECEIVING' | 'SHIPPING'
  orderStatus: string
  clientId: string
  updatedAt: string
  minutesInStatus: number
}

export const ordersApi = {
  getSummary: () =>
    axios.get<OrderSummaryDto[]>('/api/orders/summary').then(r => r.data),

  getStuck: (type: 'ALL' | 'RECEIVING' | 'SHIPPING' = 'ALL') =>
    axios.get<StuckOrderDto[]>('/api/orders/stuck', { params: { type } }).then(r => r.data),
}
