import { Card, CardContent, Typography } from '@mui/material'

interface Props {
  label: string
  value: number
  color?: 'success' | 'error' | 'warning' | 'info' | 'default'
}

const colorMap = {
  success: '#2e7d32',
  error: '#c62828',
  warning: '#e65100',
  info: '#01579b',
  default: '#37474f',
}

export default function StatCard({ label, value, color = 'default' }: Props) {
  return (
    <Card variant="outlined" sx={{ minWidth: 140 }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: colorMap[color] }}>
          {value.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  )
}
