import { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { DESCRICAO_PERFIL, NOME_PERFIL, PERFIS } from './usuariosMock';
import type { Perfil, UsuarioSistema } from './usuariosMock';

export type UsuarioDados = {
  nome: string;
  email: string;
  perfil: Perfil;
  senha: string;
};

type Props = {
  usuario?: UsuarioSistema; // se vier preenchido, estamos EDITANDO; senão, criando
  emailsExistentes: string[];
  onClose: () => void;
  onSave: (dados: UsuarioDados) => void;
};

export function UsuarioModal({ usuario, emailsExistentes, onClose, onSave }: Props) {
  const editando = Boolean(usuario);

  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [perfil, setPerfil] = useState<Perfil>(usuario?.perfil ?? 'USER');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  return (
    <Modal title={editando ? 'Editar Usuário' : 'Novo Usuário'} onClose={onClose}>
      <form
        className="modal-form"
        onSubmit={(e) => {
          e.preventDefault();
          const emailLimpo = email.trim().toLowerCase();
          if (!editando && emailsExistentes.includes(emailLimpo)) {
            setErro('Já existe um usuário com esse e-mail.');
            return;
          }
          onSave({ nome: nome.trim(), email: emailLimpo, perfil, senha });
        }}
      >
        <label>
          Nome
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Maria Silva" required />
        </label>

        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErro('');
            }}
            placeholder="Ex: maria@stockpass.com"
            readOnly={editando}
            required
          />
        </label>

        <label>
          Perfil de acesso
          <select value={perfil} onChange={(e) => setPerfil(e.target.value as Perfil)}>
            {PERFIS.map((p) => (
              <option key={p} value={p}>{NOME_PERFIL[p]}</option>
            ))}
          </select>
        </label>

        <p className="muted-sm">{NOME_PERFIL[perfil]}: {DESCRICAO_PERFIL[perfil].toLowerCase()}.</p>

        {!editando && (
          <label>
            Senha provisória
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
              minLength={6}
              required
            />
          </label>
        )}

        {erro && <p className="usuarios-erro">{erro}</p>}

        <button className="btn-primary" type="submit">
          {editando ? 'Salvar alterações' : 'Criar Usuário'}
        </button>
      </form>
    </Modal>
  );
}