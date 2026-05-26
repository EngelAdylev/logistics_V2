import { useState, useCallback } from 'react'
import {
  Alert, Box, Chip, CircularProgress, FormControl,
  InputLabel, MenuItem, Select, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Typography
} from '@mui/material'
import StatCard from '../components/StatCard'
import { usePolling } from '../hooks/usePolling'
import { datareonApi } from '../api/datareon'
import type { PeriodFilter, StatusFilter, SystemFilter, EventDto } from '../api/datareon'

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  'Успешно': 'success',
  'В обработке': 'default',
  'Завис': 'warning',
  'Ошибка': 'error',
}

export default function DatareonPage() {
  const [period, setPeriod] = useState<PeriodFilter>('1h')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [systemFilter, setSystemFilter] = useState<SystemFilter>('ALL')

  const summaryFetcher = useCallback(() => datareonApi.getSummary(period), [period])
  const { data: summary, error: summaryError } = usePolling(summaryFetcher)

  const eventsFetcher = useCallback(
    () => datareonApi.getEvents({ period, status: statusFilter, system: systemFilter, page: 0, size: 50 }),
    [period, statusFilter, systemFilter]
  )
  const { data: events, error: eventsError, loading } = usePolling(eventsFetcher)

  const hasError = summaryError || eventsError

  return (
    <Stack spacing={3}>
      {hasError && (
        <Alert severity="error">Нет соединения с бэкендом. Данные могут быть устаревшими.</Alert>
      )}

      {summary && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <StatCard label="Всего" value={summary.total} />
          <StatCard label="Успешно" value={summary.success} color="success" />
          <StatCard label="Ошибки" value={summary.errors} color="error" />
          <StatCard label="Зависли" value={summary.stuck} color="warning" />
        </Box>
      )}

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Период</InputLabel>
          <Select value={period} label="Период" onChange={e => setPeriod(e.target.value as PeriodFilter)}>
            <MenuItem value="1h">Последний час</MenuItem>
            <MenuItem value="6h">6 часов</MenuItem>
            <MenuItem value="24h">24 часа</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Статус</InputLabel>
          <Select value={statusFilter} label="Статус" onChange={e => setStatusFilter(e.target.value as StatusFilter)}>
            <MenuItem value="ALL">Все</MenuItem>
            <MenuItem value="ERROR">Ошибки</MenuItem>
            <MenuItem value="STUCK">Зависли</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Система</InputLabel>
          <Select value={systemFilter} label="Система" onChange={e => setSystemFilter(e.target.value as SystemFilter)}>
            <MenuItem value="ALL">Все</MenuItem>
            <MenuItem value="WMS">WMS</MenuItem>
            <MenuItem value="TOS">TOS</MenuItem>
            <MenuItem value="1C">1C</MenuItem>
            <MenuItem value="DATAREON">Datareon</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {loading && <CircularProgress />}

      {events && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Время</TableCell>
                <TableCell>Направление</TableCell>
                <TableCell>Система</TableCell>
                <TableCell>Тип события</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Ошибка</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">Нет данных за выбранный период</Typography>
                  </TableCell>
                </TableRow>
              )}
              {events.map((e: EventDto) => (
                <TableRow key={e.id} hover>
                  <TableCell>{new Date(e.time).toLocaleString('ru-RU')}</TableCell>
                  <TableCell>
                    <Chip size="small"
                      label={e.direction === 'INBOUND' ? '← Входящий' : '→ Исходящий'}
                      variant="outlined" />
                  </TableCell>
                  <TableCell>{e.system}</TableCell>
                  <TableCell>{e.eventType}</TableCell>
                  <TableCell>
                    <Chip size="small" label={e.status}
                      color={STATUS_COLORS[e.status] as any} />
                  </TableCell>
                  <TableCell sx={{ color: 'error.main', maxWidth: 300, wordBreak: 'break-word' }}>
                    {e.error ?? '—'}
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
