import { clsx } from 'clsx';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const map: Record<string, string> = {
    CONFIRMED: 'badge-confirmed',
    PENDING: 'badge-pending',
    CANCELLED: 'badge-cancelled',
    COMPLETED: 'badge-completed',
    NO_SHOW: 'badge-no_show',
    WAITING: 'badge-pending',
    NOTIFIED: 'badge-confirmed',
  };

  const cls = map[status] || 'badge-pending';

  const labels: Record<string, string> = {
    CONFIRMED: '✓ Confirmed',
    PENDING: '⏳ Pending',
    CANCELLED: '✕ Cancelled',
    COMPLETED: '✓ Completed',
    NO_SHOW: '⚪ No Show',
    WAITING: '⏳ Waiting',
    NOTIFIED: '🔔 Notified',
  };

  return (
    <span className={clsx(cls, className)}>
      {labels[status] ?? status}
    </span>
  );
}
