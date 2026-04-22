'use client';

import { useTransition } from 'react';

export default function AttendanceControls({ action, studentId, sessionDate, currentStatus }) {
  const [pending, startTransition] = useTransition();
  const statuses = ['', 'P', 'A', 'L'];

  return (
    <div className="inline-actions">
      {statuses.map((status) => {
        const active = status === currentStatus;
        const label = status || 'Clear';
        return (
          <button
            key={label}
            type="button"
            className={active ? 'button' : 'button-secondary'}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const formData = new FormData();
                formData.set('studentId', String(studentId));
                formData.set('sessionDate', sessionDate);
                formData.set('status', status);
                await action(formData);
              })
            }
          >
            {pending && active ? 'Saving...' : label}
          </button>
        );
      })}
    </div>
  );
}
