import { useState, useCallback } from 'react'
import {
  Alert, Box, CircularProgress, Divider, FormControl,
  InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography
} from '@mui/material'
import StatCard from '../components/StatCard'
import { usePolling } from '../hooks/usePolling'
import type { OrderSummaryDto, StuckOrderDto } from '../api/orders'
import { ordersApi } from '../api/orders'

function SummarySection({ data, label }: { data: OrderSummaryDto; label: string }) {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} gutterBottom>{label}</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <StatCard label="Черновик" value={data.draft} />
        <StatCard label="На проверке" value={data.onReview} />
        <StatCard label="Принят" value={data.accepted} />
        <StatCard label="В обработке" value={data.inProgress} color="info" />
        <StatCard label="Завершён" value={data.done} color="success" />
      </Box>
    </Box>
  )
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h} ч ${m} мин`
}

export default function OrdersPage() {
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'RECEIVING' | 'SHIPPING'>('ALL')

  const summaryFetcher = useCallback(() => ordersApi.getSummary(), [])
  const { data: summary, error: summaryError } = usePolling(summaryFetcher)

  const stuckFetcher = useCallback(() => ordersApi.getStuck(typeFilter), [typeFilter])
  const { data: stuck, error: stuckError, loading } = usePolling(stuckFetcher)

  const receiving = summary?.find(s => s.type === 'RECEIVING')
  const shipping = summary?.find(s => s.type === 'SHIPPING')

  return (
    <Stack spacing={3}>
      {(summaryError || stuckError) && (
        <Alert severity="error">Нет соединения с бэкендом. Данные могут быть устаревшими.</Alert>
      )}

      {receiving && <SummarySection data={receiving} label="Приёмка" />}
      {shipping && (
        <>
          <Divider />
          <SummarySection data={shipping} label="Отгрузка" />
        </>
      )}

      <Divider />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Зависшие заказы (IN_PROGRESS более 4 часов)
        </Typography>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Тип</InputLabel>
          <Select value={typeFilter} label="Тип"
            onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}>
            <MenuItem value="ALL">Все</MenuItem>
            <MenuItem value="RECEIVING">Приёмка</MenuItem>
            <MenuItem value="SHIPPING">Отгрузка</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading && <CircularProgress />}

      {stuck && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Тип</TableCell>
                <TableCell>Номер</TableCell>
                <TableCell>Клиент</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Время в статусе</TableCell>
                <TableCell>Обновлён</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stuck.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">Зависших заказов нет</Typography>
                  </TableCell>
                </TableRow>
              )}
              {stuck.map((o: StuckOrderDto) => (
                <TableRow key={o.id} hover>
                  <TableCell>{o.type === 'RECEIVING' ? 'Приёмка' : 'Отгрузка'}</TableCell>
                  <TableCell>#{o.number}</TableCell>
                  <TableCell>{o.clientName}</TableCell>
                  <TableCell>{o.orderStatus}</TableCell>
                  <TableCell sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                    {formatDuration(o.minutesInStatus)}
                  </TableCell>
                  <TableCell>
                    {o.updatedAt ? new Date(o.updatedAt).toLocaleString('ru-RU') : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  )
}
