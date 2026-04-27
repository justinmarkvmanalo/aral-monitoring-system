'use client';

import { useFormStatus } from 'react-dom';

export default function SubmitButton({ children, className = 'button', disabled = false }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={pending || disabled}>
      {pending ? 'Working...' : children}
    </button>
  );
}
