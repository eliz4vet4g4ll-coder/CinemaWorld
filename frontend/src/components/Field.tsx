import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes, useId } from 'react';

interface WrapProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

function Wrap({ label, error, hint, className, children }: WrapProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={['field', error && 'field--error', className].filter(Boolean).join(' ')}>
      <label className="field__label" htmlFor={id}>{label}</label>
      {children(id, error ? errorId : undefined)}
      {error && <p className="field__error" id={errorId}>{error}</p>}
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  );
}

type Common = Pick<WrapProps, 'label' | 'error' | 'hint' | 'className'>;

export function TextField({ label, error, hint, className, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Wrap {...{ label, error, hint, className }}>
      {(id, describedBy) => <input {...rest} id={id} className="input" aria-invalid={!!error} aria-describedby={describedBy} />}
    </Wrap>
  );
}

export function TextArea({ label, error, hint, className, ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Wrap {...{ label, error, hint, className }}>
      {(id, describedBy) => <textarea {...rest} id={id} className="input input--area" aria-invalid={!!error} aria-describedby={describedBy} />}
    </Wrap>
  );
}

export function SelectField({ label, error, hint, className, children, ...rest }: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Wrap {...{ label, error, hint, className }}>
      {(id, describedBy) => (
        <select {...rest} id={id} className="input input--select" aria-invalid={!!error} aria-describedby={describedBy}>
          {children}
        </select>
      )}
    </Wrap>
  );
}
