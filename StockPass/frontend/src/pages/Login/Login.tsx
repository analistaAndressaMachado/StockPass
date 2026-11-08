import React, { useState } from 'react';
import axios from 'axios';
import { api } from '../../services/api';
import { mensagemErro } from '../../services/stockApi';
import type { User } from '../../types';

type Props = {
  onLogin: (user: User) => void;
};

export function Login({ onLogin }: Props) {
  type Mode = 'login' | 'register' | 'supplierRegister' | 'clientRegister' | 'forgotPassword' | 'resetPassword';
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get('resetToken') ?? '');
  const [mode, setMode] = useState<Mode>(() => new URLSearchParams(window.location.search).has('resetToken') ? 'resetPassword' : 'login');
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', companyName: '', taxId: '', phone: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setMsg('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      if (mode === 'login') {
        const r = await api.post('/auth/login', { email: form.email, password: form.password });
        localStorage.setItem('stockpass_token', r.data.token);
        onLogin(r.data.user);
      } else if (mode === 'forgotPassword') {
        if (newPassword !== confirmPassword) {
          setMsg('As senhas não conferem.');
          return;
        }
        const { data } = await api.post('/auth/password/demo-reset', { email: form.email, newPassword });
        setMsg(data.message);
        setForm({ ...form, password: '' });
        setNewPassword('');
        setConfirmPassword('');
        setMode('login');
      } else if (mode === 'resetPassword') {
        if (newPassword !== confirmPassword) {
          setMsg('As senhas não conferem.');
          return;
        }
        const { data } = await api.post('/auth/password/reset', { token: resetToken, newPassword });
        setMsg(data.message);
        setForm({ ...form, password: '' });
        setNewPassword('');
        setConfirmPassword('');
        setResetToken('');
        window.history.replaceState({}, '', window.location.pathname);
        setMode('login');
      } else if (mode === 'supplierRegister') {
        await api.post('/auth/register-supplier', {
          name: form.name,
          email: form.email,
          password: form.password,
          companyName: form.companyName,
          taxId: form.taxId,
          phone: form.phone,
        });
        setMsg('Cadastro de fornecedor realizado. Agora faça login.');
        setMode('login');
      } else if (mode === 'clientRegister') {
        await api.post('/auth/register-client', { name: form.name, email: form.email, password: form.password });
        setMsg('Cadastro de cliente realizado. Agora faça login.');
        setMode('login');
      } else {
        await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
        setMsg('Cadastro realizado. Agora faça login.');
        setMode('login');
      }
    } catch (err: unknown) {
      if (mode === 'forgotPassword' && axios.isAxiosError(err) && err.response?.status === 403) {
        setMsg('Para redefinir a senha nesta demonstração, inicie o backend no modo acadêmico.');
        return;
      }
      setMsg(mensagemErro(err));
    }
  }

  return (
    <main className="page">
      <section className="card auth">
        <h1>StockPass</h1>
        <p className="muted">Sistema de Controle de Estoque</p>
        <h2>{mode === 'login' ? 'Entrar'
          : mode === 'supplierRegister' ? 'Cadastro de fornecedor'
            : mode === 'clientRegister' ? 'Cadastro de cliente'
              : mode === 'forgotPassword' ? 'Recuperar senha'
                : mode === 'resetPassword' ? 'Criar nova senha' : 'Criar conta'}</h2>
        <form onSubmit={submit}>
          {(mode === 'register' || mode === 'clientRegister') && (
            <input
              placeholder="Nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          )}
          {mode === 'supplierRegister' && (
            <>
              <input
                placeholder="Nome do responsável"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                placeholder="Razão social ou nome da empresa"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
              />
              <input
                placeholder="CNPJ (opcional)"
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
              />
              <input
                type="tel"
                placeholder="Telefone (opcional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </>
          )}
          {mode !== 'resetPassword' && (
            <input
              type="email"
              placeholder="E-mail"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          )}
          {(mode === 'login' || mode === 'register' || mode === 'supplierRegister' || mode === 'clientRegister') && (
            <input
              type="password"
              placeholder="Senha"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={6}
              required
            />
          )}
          {(mode === 'resetPassword' || mode === 'forgotPassword') && (
            <>
              <input
                type="password"
                placeholder="Nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
              <input
                type="password"
                placeholder="Confirme a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </>
          )}
          <button>{mode === 'login' ? 'Entrar'
            : mode === 'supplierRegister' ? 'Cadastrar fornecedor'
              : mode === 'clientRegister' ? 'Cadastrar cliente'
                : mode === 'forgotPassword' ? 'Redefinir senha'
                  : mode === 'resetPassword' ? 'Redefinir senha' : 'Cadastrar'}</button>
        </form>
        {msg && <p className="message">{msg}</p>}
        {mode === 'login' ? (
          <div className="login-links">
            <button type="button" className="link" onClick={() => changeMode('register')}>
              Ainda não tenho cadastro
            </button>
            <button type="button" className="link" onClick={() => changeMode('supplierRegister')}>
              Sou fornecedor e quero me cadastrar
            </button>
            <button type="button" className="link" onClick={() => changeMode('clientRegister')}>
              Cadastrar como cliente
            </button>
            <button type="button" className="link" onClick={() => changeMode('forgotPassword')}>
              Esqueci minha senha
            </button>
          </div>
        ) : (
          <button type="button" className="link" onClick={() => changeMode('login')}>
            Voltar para entrar
          </button>
        )}
      </section>
    </main>
  );
}