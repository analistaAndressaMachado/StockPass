import React, { useState } from 'react';
import { api } from '../../services/api';
import type { User } from '../../types';

type Props = {
  onLogin: (user: User) => void;
};

export function Login({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      if (mode === 'login') {
        const r = await api.post('/auth/login', { email: form.email, password: form.password });
        localStorage.setItem('stockpass_token', r.data.token);
        onLogin(r.data.user);
      } else {
        await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
        setMsg('Cadastro realizado. Agora faça login.');
        setMode('login');
      }
    } catch (err: any) {
      setMsg(err?.response?.data?.message || 'Não foi possível concluir a operação.');
    }
  }

  return (
    <main className="page">
      <section className="card auth">
        <h1>StockPass</h1>
        <p className="muted">Sistema de Controle de Estoque</p>
        <h2>{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
        <form onSubmit={submit}>
          {mode === 'register' && (
            <input
              placeholder="Nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          )}
          <input
            type="email"
            placeholder="E-mail"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={6}
            required
          />
          <button>{mode === 'login' ? 'Entrar' : 'Cadastrar'}</button>
        </form>
        {msg && <p className="message">{msg}</p>}
        <button
          className="link"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setMsg('');
          }}
        >
          {mode === 'login' ? 'Ainda não tenho cadastro' : 'Já tenho uma conta'}
        </button>
      </section>
    </main>
  );
}