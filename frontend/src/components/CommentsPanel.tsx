import { useState } from 'react';
import {
  Box, Typography, TextField, Button, CircularProgress,
  Divider, IconButton, Stack, Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '../api/comments';

const fmtDate = (v: string) =>
  new Date(v).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

interface Props {
  tripId: string;
  onClose: () => void;
}

export default function CommentsPanel({ tripId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [author, setAuthor] = useState('');
  const [body, setBody] = useState('');

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', tripId],
    queryFn: () => commentsApi.list(tripId),
  });

  const addMutation = useMutation({
    mutationFn: () => commentsApi.add(tripId, { author: author.trim(), body: body.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', tripId] });
      setBody('');
    },
  });

  const canSubmit = author.trim().length > 0 && body.trim().length > 0 && !addMutation.isPending;

  return (
    <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
          Комментарии
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={20} />
        </Box>
      ) : comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Комментариев пока нет
        </Typography>
      ) : (
        <Stack spacing={1} sx={{ mb: 2, maxHeight: 240, overflowY: 'auto' }}>
          {comments.map(c => (
            <Paper key={c.id} variant="outlined" sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" fontWeight={600}>{c.author}</Typography>
                <Typography variant="caption" color="text.secondary">{fmtDate(c.createdAt)}</Typography>
              </Box>
              <Typography variant="body2">{c.body}</Typography>
            </Paper>
          ))}
        </Stack>
      )}

      <Divider sx={{ mb: 1.5 }} />

      <Stack spacing={1}>
        <TextField
          size="small"
          label="Автор"
          value={author}
          onChange={e => setAuthor(e.target.value)}
          inputProps={{ maxLength: 100 }}
          sx={{ maxWidth: 260 }}
        />
        <TextField
          size="small"
          label="Комментарий"
          value={body}
          onChange={e => setBody(e.target.value)}
          multiline
          minRows={2}
          maxRows={5}
          inputProps={{ maxLength: 2000 }}
        />
        <Button
          variant="contained"
          size="small"
          disabled={!canSubmit}
          onClick={() => addMutation.mutate()}
          sx={{ alignSelf: 'flex-start' }}>
          {addMutation.isPending ? <CircularProgress size={16} /> : 'Добавить'}
        </Button>
      </Stack>
    </Box>
  );
}
