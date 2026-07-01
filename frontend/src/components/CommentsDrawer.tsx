import { useEffect, useState } from 'react';
import {
  Drawer, Box, Typography, IconButton, TextField, Button,
  CircularProgress, Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { commentsApi, type TripCommentDto } from '../api/comments';
import { useAuth } from '../context/AuthContext';
import type { WagonDto } from '../api/wagons';
import { formatDateTime } from '../table/tableUtils';

interface Props {
  wagon: WagonDto | null;
  onClose: () => void;
}

export default function CommentsDrawer({ wagon, onClose }: Props) {
  const { auth } = useAuth();
  const [comments, setComments] = useState<TripCommentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const tripId = wagon?.activeTripId ?? null;

  useEffect(() => {
    if (!wagon || !tripId) { setComments([]); return; }
    setLoading(true);
    commentsApi.list(tripId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [wagon, tripId]);

  const submit = async () => {
    if (!tripId || !body.trim()) return;
    setSaving(true);
    try {
      const created = await commentsApi.add(tripId, {
        author: auth?.username || 'guest',
        body: body.trim(),
      });
      setComments(prev => [...prev, created]);
      setBody('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer anchor="right" open={!!wagon} onClose={onClose}
      PaperProps={{ sx: { width: 380, maxWidth: '90vw' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>Комментарии</Typography>
          <Typography variant="caption" color="text.secondary">
            Вагон {wagon?.wagonNumber}
            {wagon?.currentTrainNumber ? ` · поезд ${wagon.currentTrainNumber}` : ''}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {!tripId ? (
          <Typography variant="body2" color="text.secondary">
            У вагона нет активного рейса — комментарии недоступны.
          </Typography>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress size={22} /></Box>
        ) : comments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Пока нет комментариев.</Typography>
        ) : (
          comments.map(c => (
            <Box key={c.id} sx={{ mb: 1.5, p: 1.25, bgcolor: '#f6f7f9', borderRadius: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" fontWeight={700}>{c.author}</Typography>
                <Typography variant="caption" color="text.secondary">{formatDateTime(c.createdAt)}</Typography>
              </Box>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{c.body}</Typography>
            </Box>
          ))
        )}
      </Box>

      {tripId && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth multiline minRows={2} maxRows={5} size="small"
              placeholder="Новый комментарий…"
              value={body}
              onChange={e => setBody(e.target.value)}
            />
            <Button
              fullWidth variant="contained" sx={{ mt: 1 }}
              disabled={!body.trim() || saving}
              onClick={submit}
            >
              {saving ? 'Отправка…' : 'Добавить'}
            </Button>
          </Box>
        </>
      )}
    </Drawer>
  );
}
