import { useState } from 'react';
import { Popover } from '@mui/material';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { COLUMNS } from './columns';

interface Props {
  visibleIds: string[];
  onChange: (ids: string[]) => void;
}

export default function ColumnVisibilityPanel({ visibleIds, onChange }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const toggle = (id: string, required: boolean) => {
    if (required) return;
    onChange(
      visibleIds.includes(id)
        ? visibleIds.filter(x => x !== id)
        : [...visibleIds, id],
    );
  };

  return (
    <>
      <button type="button" className="toolbar-btn" onClick={e => setAnchor(e.currentTarget)}>
        <ViewColumnIcon sx={{ fontSize: 18 }} />
        Колонки
      </button>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { className: 'colvis-popover' } }}
      >
        <div className="colvis-title">Отображаемые колонки</div>
        <div className="colvis-list">
          {COLUMNS.map(c => {
            const checked = visibleIds.includes(c.id);
            return (
              <label key={c.id} className={`colvis-item${c.required ? ' disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={c.required}
                  onChange={() => toggle(c.id, c.required)}
                />
                <span>{c.label}</span>
              </label>
            );
          })}
        </div>
      </Popover>
    </>
  );
}
