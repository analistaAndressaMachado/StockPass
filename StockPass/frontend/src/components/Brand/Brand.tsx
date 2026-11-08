type Props = {
  className?: string;
};

export function Brand({ className = '' }: Props) {
  return (
    <span className={`sidebar-logo ${className}`}>
      <span className="sidebar-logo-icon" aria-hidden="true">
        <span className="sidebar-logo-motion" />
        <span className="sidebar-logo-package" />
      </span>
      <span className="sidebar-logo-text">Stock<span>Pass</span></span>
    </span>
  );
}