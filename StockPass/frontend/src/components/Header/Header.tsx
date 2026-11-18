import type { User } from '../../types';
import { nomePerfil } from '../../utils/perfil';
import { Avatar } from '../Avatar/Avatar';

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
        <Avatar className="app-header-avatar" name={user.name} photoUrl={user.photoUrl} />
        <div>
          <p className="app-header-user-name">{user.name}</p>
          <p className="app-header-user-role">{nomePerfil(user.role)}</p>
        </div>
        <button className="app-header-menu">⋮</button>
      </div>
    </div>
  );
}
