'use client';

import { useActionState } from 'react';

import SubmitButton from '@/components/SubmitButton';

export function AddTeacherForm({ action }) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="form-grid">
      {state?.error ? <div className="banner error">{state.error}</div> : null}
      {state?.success ? <div className="banner success">{state.success}</div> : null}
      <div className="two-col">
        <div className="field">
          <label>First Name</label>
          <input name="firstName" />
        </div>
        <div className="field">
          <label>Last Name</label>
          <input name="lastName" />
        </div>
      </div>
      <div className="field">
        <label>Email</label>
        <input type="email" name="email" />
      </div>
      <div className="field">
        <label>Password</label>
        <input type="password" name="password" />
      </div>
      <SubmitButton>Add Teacher</SubmitButton>
    </form>
  );
}

export function AddAnnouncementForm({ action }) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="form-grid">
      {state?.error ? <div className="banner error">{state.error}</div> : null}
      {state?.success ? <div className="banner success">{state.success}</div> : null}
      <div className="field">
        <label>Title</label>
        <input name="title" />
      </div>
      <div className="field">
        <label>Message</label>
        <textarea name="message" />
      </div>
      <SubmitButton>Post Announcement</SubmitButton>
    </form>
  );
}

export function DeleteTeacherForm({ action, teacherId }) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="inline-form">
      <input type="hidden" name="teacherId" value={teacherId} />
      {state?.error ? <div className="subtle error-text">{state.error}</div> : null}
      {state?.success ? <div className="subtle success-text">{state.success}</div> : null}
      <SubmitButton className="button-danger">Delete</SubmitButton>
    </form>
  );
}

export function DeleteAnnouncementForm({ action, announcementId }) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="inline-form">
      <input type="hidden" name="announcementId" value={announcementId} />
      {state?.error ? <div className="subtle error-text">{state.error}</div> : null}
      {state?.success ? <div className="subtle success-text">{state.success}</div> : null}
      <SubmitButton className="button-danger">Delete</SubmitButton>
    </form>
  );
}
