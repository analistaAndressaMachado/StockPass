import React, { useState } from 'react';
import { api } from '../../services/api';
import type { User } from '../../types';

type Props = {
  user: User;
  onLogout: () => void;
};

export function Perfil({ user, onLogout }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setMsg('Senha alterada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setMsg(err?.response?.data?.message || 'Erro ao alterar senha.');
    }
  }

  return (
    <div className="painel">
      <section className="panel-card">
        <h2>Meu perfil</h2>
        <p><b>Nome:</b> {user.name}</p>
        <p><b>E-mail:</b> {user.email}</p>
        <p><b>Perfil:</b> {user.role}</p>
      </section>

      <section className="panel-card">
        <h2>Trocar senha</h2>
        <form onSubmit={changePassword} className="profile-form">
          <input
            type="password"
            placeholder="Senha atual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Nova senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            required
          />
          <button className="btn-primary">Alterar senha</button>
        </form>
        {msg && <p className="message">{msg}</p>}
      </section>

      <section className="panel-card">
        <button className="btn-secondary" onClick={onLogout}>Sair da conta</button>
      </section>
    </div>
  );
}