import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import './Input.css';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', invalid = false, ...props },
  ref,
) {
  const classes = ['ui-input', invalid && 'ui-input--invalid', className].filter(Boolean).join(' ');

  return <input {...props} ref={ref} className={classes} aria-invalid={invalid || props['aria-invalid']} />;
});

Input.displayName = 'Input';
