import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Paper, TextField, Typography, Alert } from '@mui/material';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const auth = await authApi.login(username, password);
      login(auth);
      navigate('/trains', { replace: true });
    } catch {
      setError('Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      bgcolor: 'grey.100',
    }}>
      <Paper sx={{ p: 4, width: 360 }} elevation={3}>
        <Typography variant="h6" fontWeight={700} mb={3} textAlign="center">
          Дислокация вагонов
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Логин"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
            required
            size="small"
          />
          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            size="small"
          />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
