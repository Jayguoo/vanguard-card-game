interface PingCounterProps {
  latencyMs: number | null;
}

export function PingCounter({ latencyMs }: PingCounterProps) {
  const color = latencyMs === null ? '#888'
    : latencyMs < 80 ? '#4caf50'
    : latencyMs < 150 ? '#ff9800'
    : '#f44336';

  return (
    <div style={{
      position: 'fixed',
      top: 6,
      left: 8,
      zIndex: 9999,
      fontFamily: 'monospace',
      fontSize: 12,
      color,
      background: 'rgba(0, 0, 0, 0.5)',
      padding: '2px 6px',
      borderRadius: 4,
      pointerEvents: 'none',
      userSelect: 'none',
    }}>
      {latencyMs !== null ? `${latencyMs}ms` : '---'}
    </div>
  );
}
