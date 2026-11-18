import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

export type ButtonStyle = 'primary' | 'white' | 'secondary' | 'ghost';

const cls = (variant: ButtonStyle, wide?: boolean, className?: string) =>
  ['btn', `btn--${variant}`, wide && 'btn--wide', className].filter(Boolean).join(' ');

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonStyle;
  wide?: boolean;
  loading?: boolean;
}

export function Button({ variant = 'white', wide, loading, disabled, type = 'button', className, children, ...rest }: ButtonProps) {
  return (
    <button {...rest} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={cls(variant, wide, className) + (loading ? ' btn--loading' : '')}>
      {children}
    </button>
  );
}

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonStyle;
  wide?: boolean;
}

export function ButtonLink({ variant = 'white', wide, className, ...rest }: ButtonLinkProps) {
  return <Link {...rest} className={cls(variant, wide, className)} />;
}
