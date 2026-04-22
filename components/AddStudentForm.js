'use client';

import { useActionState } from 'react';

import SubmitButton from '@/components/SubmitButton';

export default function AddStudentForm({ action, sectionId }) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="form-grid">
      <input type="hidden" name="sectionId" value={sectionId} />
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
      <div className="two-col">
        <div className="field">
          <label>Middle Name</label>
          <input name="middleName" />
        </div>
        <div className="field">
          <label>LRN</label>
          <input name="lrn" maxLength={12} />
        </div>
      </div>
      <div className="two-col">
        <div className="field">
          <label>Gender</label>
          <select name="gender" defaultValue="">
            <option value="" disabled>Select gender</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="field">
          <label>Birth Date</label>
          <input type="date" name="birthDate" />
        </div>
      </div>
      <SubmitButton>Add Student</SubmitButton>
    </form>
  );
}
