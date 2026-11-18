import { Link, type To } from 'react-router-dom';

export function BackLink({ to, children }: { to: To; children: string }) {
  return <Link to={to} className="back-link"><span aria-hidden="true">‹</span>&nbsp; {children}</Link>;
}
