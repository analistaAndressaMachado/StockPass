import type { User } from '../../types';

type Props = {
  title: string;
  user: User;
  onProfileClick: () => void;
};

export function Header({ title, user, onProfileClick }: Props) {
  return (
    <div className="app-header">
      <p className="app-header-eyebrow">Controle de Estoque</p>
      <h1 className="app-header-title">{title}</h1>
     <div className="app-header-user" onClick={onProfileClick} style={{ cursor: 'pointer' }}>
        <div className="app-header-avatar">{user.name.charAt(0).toUpperCase()}</div>
        <div>
          <p className="app-header-user-name">{user.name}</p>
          <p className="app-header-user-role">{user.role}</p>
        </div>
        <button className="app-header-menu">⋮</button>
      </div>
    </div>
  );
}