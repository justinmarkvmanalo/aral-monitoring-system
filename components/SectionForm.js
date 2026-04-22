'use client';

import { useActionState } from 'react';

import SubmitButton from '@/components/SubmitButton';

export default function SectionForm({ action, initialValues }) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="form-grid">
      {state?.error ? <div className="banner error">{state.error}</div> : null}
      <div className="field">
        <label>School Year Label</label>
        <input name="label" defaultValue={initialValues.label} placeholder="2026-2027" />
      </div>
      <div className="two-col">
        <div className="field">
          <label>Start Date</label>
          <input type="date" name="startDate" defaultValue={initialValues.startDate} />
        </div>
        <div className="field">
          <label>End Date</label>
          <input type="date" name="endDate" defaultValue={initialValues.endDate} />
        </div>
      </div>
      <div className="two-col">
        <div className="field">
          <label>Grade Level</label>
          <select name="gradeLevel" defaultValue={String(initialValues.gradeLevel)}>
            <option value="">Select grade</option>
            {[1, 2, 3, 4, 5, 6].map((grade) => (
              <option key={grade} value={grade}>
                Grade {grade}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Section Name</label>
          <input name="sectionName" defaultValue={initialValues.sectionName} placeholder="Sampaguita" />
        </div>
      </div>
      <SubmitButton>Save Section</SubmitButton>
    </form>
  );
}
