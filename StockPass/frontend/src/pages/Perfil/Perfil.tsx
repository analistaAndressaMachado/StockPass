import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { api } from '../../services/api';
import type { User } from '../../types';
import { mensagemErro } from '../../services/stockApi';
import { nomePerfil } from '../../utils/perfil';
import { Modal } from '../../components/Modal/Modal';
import { Avatar } from '../../components/Avatar/Avatar';
import './Perfil.css';

type Props = {
  user: User;
  onUserUpdated: (user: User) => void;
  onLogout: () => void;
};

type ProfileValues = Pick<User, 'name' | 'companyName' | 'taxId' | 'phone'>;

export function Perfil({ user, onUserUpdated, onLogout }: Props) {
  const [name, setName] = useState(user.name);
  const [companyName, setCompanyName] = useState(user.companyName ?? '');
  const [taxId, setTaxId] = useState(user.taxId ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');
  const [original, setOriginal] = useState<ProfileValues>({
    name: user.name,
    companyName: user.companyName,
    taxId: user.taxId,
    phone: user.phone,
  });
  const [editing, setEditing] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [photoRevision, setPhotoRevision] = useState(0);
  const photoInput = useRef<HTMLInputElement>(null);

  const isSupplier = user.role === 'FORNECEDOR';
  const hasProfileChanges = name !== original.name || companyName !== (original.companyName ?? '') ||
    taxId !== (original.taxId ?? '') || phone !== (original.phone ?? '');

  function restoreOriginal() {
    setName(original.name);
    setCompanyName(original.companyName ?? '');
    setTaxId(original.taxId ?? '');
    setPhone(original.phone ?? '');
  }

  function cancelEditing() {
    if (hasProfileChanges && !window.confirm('Descartar as alterações feitas no perfil?')) return;
    restoreOriginal();
    setEditing(false);
    setProfileMessage(null);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileMessage(null);
    setSavingProfile(true);
    try {
      const payload = isSupplier
        ? { name, companyName, taxId, phone }
        : { name };
      const { data } = await api.put<User>('/auth/profile', payload);
      setName(data.name);
      setCompanyName(data.companyName ?? '');
      setTaxId(data.taxId ?? '');
      setPhone(data.phone ?? '');
      setOriginal({ name: data.name, companyName: data.companyName, taxId: data.taxId, phone: data.phone });
      onUserUpdated(data);
      setEditing(false);
      setProfileMessage({ text: 'Perfil atualizado com sucesso.', error: false });
    } catch (error) {
      setProfileMessage({ text: mensagemErro(error), error: true });
    } finally {
      setSavingProfile(false);
    }
  }

  function closePasswordModal() {
    if (savingPassword) return;
    setPasswordOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMessage(null);
    setShowPasswords(false);
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'A nova senha e a confirmação não coincidem.', error: true });
      return;
    }
    setSavingPassword(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setPasswordMessage({ text: 'Senha alterada com sucesso.', error: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordMessage({ text: mensagemErro(error), error: true });
    } finally {
      setSavingPassword(false);
    }
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setPhotoMessage(null);
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setPhotoMessage({ text: 'Selecione uma imagem JPG ou PNG.', error: true });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoMessage({ text: 'A imagem deve ter no máximo 2 MB.', error: true });
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setSavingPhoto(true);
    try {
      const { data } = await api.put<User>('/auth/profile/photo', formData);
      const updatedUser = data.photoUrl ? { ...data, photoUrl: `${data.photoUrl}${data.photoUrl.includes('?') ? '&' : '?'}v=${Date.now()}` } : data;
      onUserUpdated(updatedUser);
      setPhotoRevision((revision) => revision + 1);
      setPhotoMessage({ text: 'Foto atualizada com sucesso.', error: false });
    } catch (error) {
      setPhotoMessage({ text: mensagemErro(error), error: true });
    } finally {
      setSavingPhoto(false);
    }
  }

  async function removePhoto() {
    setPhotoMessage(null);
    setSavingPhoto(true);
    try {
      const { data } = await api.delete<User>('/auth/profile/photo');
      onUserUpdated(data);
      setPhotoRevision((revision) => revision + 1);
      setPhotoMessage({ text: 'Foto removida com sucesso.', error: false });
    } catch (error) {
      setPhotoMessage({ text: mensagemErro(error), error: true });
    } finally {
      setSavingPhoto(false);
    }
  }

  return (
    <div className="painel perfil-page">
      <section className="perfil-hero panel-card">
        <Avatar key={photoRevision} className="perfil-avatar" name={user.name} photoUrl={user.photoUrl} />
        <div className="perfil-hero-copy">
          <span className="perfil-eyebrow">Sua conta</span>
          <h2>{user.name}</h2>
          <span className="perfil-role">{nomePerfil(user.role)}</span>
          <div className="perfil-photo-actions">
            <input ref={photoInput} className="perfil-photo-input" type="file" accept="image/jpeg,image/png" onChange={uploadPhoto} disabled={savingPhoto} />
            <button className="btn-secondary" type="button" onClick={() => photoInput.current?.click()} disabled={savingPhoto}>{savingPhoto ? 'Enviando...' : 'Alterar foto'}</button>
            {user.photoUrl && <button className="btn-secondary" type="button" onClick={removePhoto} disabled={savingPhoto}>{savingPhoto ? 'Aguarde...' : 'Remover foto'}</button>}
          </div>
          {photoMessage && <p className={`perfil-message ${photoMessage.error ? 'is-error' : 'is-success'}`} role={photoMessage.error ? 'alert' : 'status'}>{photoMessage.text}</p>}
        </div>
      </section>

      <section className="panel-card perfil-section">
        <div className="perfil-section-heading">
          <div>
            <h2>Meu perfil</h2>
            <p className="muted-sm">Consulte seus dados e mantenha seu nome atualizado.</p>
          </div>
          {!editing && <button className="btn-secondary" type="button" onClick={() => { setProfileMessage(null); setEditing(true); }}>Editar</button>}
        </div>

        <form onSubmit={saveProfile} className="perfil-form">
          <label>Nome
            <input value={name} onChange={(event) => setName(event.target.value)} required disabled={!editing} />
          </label>
          <label>E-mail
            <input type="email" value={user.email} readOnly disabled />
          </label>
          <label>Perfil
            <input value={nomePerfil(user.role)} readOnly disabled />
          </label>
          {isSupplier && <div className="perfil-supplier-fields">
            <label>Empresa
              <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} required disabled={!editing} />
            </label>
            <label>CNPJ
              <input value={taxId} onChange={(event) => setTaxId(event.target.value)} disabled={!editing} />
            </label>
            <label>Telefone
              <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={!editing} />
            </label>
          </div>}
          {editing && <div className="perfil-actions">
            <button className="btn-primary" type="submit" disabled={savingProfile || !hasProfileChanges}>
              {savingProfile ? 'Salvando...' : 'Salvar'}
            </button>
            <button className="btn-secondary" type="button" onClick={cancelEditing} disabled={savingProfile}>Cancelar</button>
          </div>}
        </form>
        {profileMessage && <p className={`perfil-message ${profileMessage.error ? 'is-error' : 'is-success'}`} role={profileMessage.error ? 'alert' : 'status'}>{profileMessage.text}</p>}
      </section>

      <section className="panel-card perfil-security">
        <div>
          <h2>Segurança</h2>
          <p className="muted-sm">Atualize sua senha para manter sua conta protegida.</p>
        </div>
        <button className="btn-secondary" type="button" onClick={() => { setPasswordMessage(null); setPasswordOpen(true); }}>Trocar senha</button>
      </section>

      <footer className="perfil-logout">
        <span>Precisa encerrar sua sessão?</span>
        <button className="btn-secondary" type="button" onClick={onLogout}>Sair da conta</button>
      </footer>

      {passwordOpen && <Modal title="Trocar senha" onClose={closePasswordModal}>
        <form onSubmit={changePassword} className="modal-form perfil-password-form">
          <label>Senha atual
            <input type={showPasswords ? 'text' : 'password'} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required />
          </label>
          <label>Nova senha
            <input type={showPasswords ? 'text' : 'password'} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={6} autoComplete="new-password" required />
          </label>
          <label>Confirmar nova senha
            <input type={showPasswords ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={6} autoComplete="new-password" required />
          </label>
          <button className="link-sm perfil-toggle-password" type="button" onClick={() => setShowPasswords((visible) => !visible)}>
            {showPasswords ? 'Ocultar senhas' : 'Mostrar senhas'}
          </button>
          {passwordMessage && <p className={`perfil-message ${passwordMessage.error ? 'is-error' : 'is-success'}`} role={passwordMessage.error ? 'alert' : 'status'}>{passwordMessage.text}</p>}
          <div className="perfil-actions">
            <button className="btn-primary" type="submit" disabled={savingPassword}>{savingPassword ? 'Salvando...' : 'Salvar nova senha'}</button>
            <button className="btn-secondary" type="button" onClick={closePasswordModal} disabled={savingPassword}>Fechar</button>
          </div>
        </form>
      </Modal>}
    </div>
  );
}
