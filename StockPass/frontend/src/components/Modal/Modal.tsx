import type { ReactNode } from 'react';

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'default' | 'large';
};

export function Modal({ title, onClose, children, size = 'default' }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal-box ${size === 'large' ? 'modal-box-large' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}