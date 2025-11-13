import React, { useMemo } from 'react';

// Simple auditorium seat map: rows labeled A.., seats 1..N
// layout comes as a JSON string from API: {"rows":["A","B","C"],"columns":5}
// blocked: ['A5','B6']
const SeatMap = ({ layout, blocked = [], basePrice = 0, value = [], onChange }) => {
  // Parse the layout if it comes as a string
  const parsedLayout = useMemo(() => {
    if (typeof layout === 'string') {
      try {
        return JSON.parse(layout);
      } catch (e) {
        console.error('Invalid layout JSON:', e);
        return { rows: ['A'], columns: 5 };
      }
    }
    return layout || { rows: ['A'], columns: 5 };
  }, [layout]);

  const rowLabels = useMemo(() => parsedLayout.rows || ['A'], [parsedLayout.rows]);
  const colLabels = useMemo(() => Array.from({ length: parsedLayout.columns || 5 }, (_, i) => i + 1), [parsedLayout.columns]);

  const normalizeCat = (label) => {
    const l = (label || '').toLowerCase();
    if (l.includes('premium')) return { name: 'Premium', variant: 'danger' };
    if (l.includes('gold')) return { name: 'Gold', variant: 'warning' };
    if (l.includes('basic') || l.includes('economy') || l.includes('standard')) return { name: 'Basic', variant: 'secondary' };
    return { name: label || 'Basic', variant: 'secondary' };
  };

  const categoryOfRow = (r) => {
    const found = (parsedLayout.categories || []).find((c) => c.rows.includes(r));
    if (!found) return { label: 'Basic', multiplier: 1, variant: 'secondary' };
    const norm = normalizeCat(found.label);
    return { ...found, variant: norm.variant, label: norm.name };
  };

  const isSelected = (code) => value.some((s) => s.code === code);
  const isBlocked = (code) => blocked.includes(code);

  const toggleSeat = (row, col) => {
    const code = `${row}${col}`;
    if (isBlocked(code)) return;
    const cat = categoryOfRow(row);
    const price = Math.round(basePrice * (cat.multiplier || 1));
    if (isSelected(code)) {
      onChange && onChange(value.filter((s) => s.code !== code));
    } else {
      onChange && onChange([...value, { code, price, category: cat.label }]);
    }
  };

  return (
    <div>
      {/* Legend */}
      <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
        {(parsedLayout.categories || []).map((c) => {
          const n = normalizeCat(c.label);
          const price = Math.round(basePrice * (c.multiplier || 1));
          return (
            <span key={c.label} className={`badge bg-${n.variant}`}>
              {n.name} • ₹{price}
            </span>
          );
        })}
        <span className="badge bg-dark">Blocked</span>
        <span className="badge bg-success">Selected</span>
      </div>

      <div className="mb-2 text-center text-muted">SCREEN</div>
      <div className="d-flex flex-column align-items-center">
        {rowLabels.map((r) => (
          <div key={r} className="d-flex align-items-center mb-2">
            <div style={{ width: 24 }} className="text-muted small">{r}</div>
            {colLabels.map((c) => {
              const code = `${r}${c}`;
              const selected = isSelected(code);
              const blockedSeat = isBlocked(code);
              const cat = categoryOfRow(r);
              const outline = `btn-outline-${cat.variant}`;
              const solid = `btn-${cat.variant}`;
              return (
                <button
                  key={code}
                  type="button"
                  className={`btn btn-sm me-2 ${blockedSeat ? 'btn-dark' : selected ? solid : outline}`}
                  style={{ width: 36 }}
                  onClick={() => toggleSeat(r, c)}
                  disabled={blockedSeat}
                  title={`${code} • ${cat.label}`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {value?.length > 0 && (
        <div className="mt-3">
          <strong>Selected:</strong> {value.map((s) => s.code).join(', ')}
        </div>
      )}
    </div>
  );
};

export default SeatMap;
