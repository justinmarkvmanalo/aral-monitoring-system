'use client';

import { useFormStatus } from 'react-dom';

export default function SubmitButton({ children, className = 'button' }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? 'Working...' : children}
    </button>
  );
}
