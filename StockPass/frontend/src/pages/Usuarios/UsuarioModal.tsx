import { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { Select } from '../../components/Select/Select';
import { DESCRICAO_PERFIL, MODULOS, NIVEL_TEXTO, NOME_PERFIL, PERFIS, nivelDoPerfil } from './usuariosMock';
import type { Nivel, Perfil, UsuarioSistema } from './usuariosMock';
import { mensagemErro } from '../../services/stockApi';

export type UsuarioDados = {
  nome: string;
  email: string;
  perfil: Perfil;
  senha: string;
  permissoes: Record<string, Nivel>;
};

type Props = {
  usuario?: UsuarioSistema; // se vier preenchido, estamos EDITANDO; senão, criando
  emailsExistentes: string[];
  onClose: () => void;
  onSave: (dados: UsuarioDados) => Promise<void>;
};

export function UsuarioModal({ usuario, emailsExistentes, onClose, onSave }: Props) {
  const editando = Boolean(usuario);
  const [secao, setSecao] = useState<'dados' | 'permissoes'>('dados');
  const [secaoConteudo, setSecaoConteudo] = useState<'dados' | 'permissoes'>('dados');
  const [linhaVisivel, setLinhaVisivel] = useState(true);

  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [perfil, setPerfil] = useState<Perfil>(usuario?.perfil ?? 'USER');
  const [permissoes, setPermissoes] = useState<Record<string, Nivel>>(() => usuario?.permissoes ?? Object.fromEntries(MODULOS.map((m) => [m.chave, nivelDoPerfil('USER', m.chave)])));
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  function trocarPerfil(value: Perfil) {
    setPerfil(value);
    setPermissoes(Object.fromEntries(MODULOS.map((m) => [m.chave, nivelDoPerfil(value, m.chave)])));
  }

  function trocarSecao(value: 'dados' | 'permissoes') {
    if (secao === value) return;
    setLinhaVisivel(false);
    window.setTimeout(() => {
      setSecao(value);
      requestAnimationFrame(() => {
        setLinhaVisivel(true);
        window.setTimeout(() => setSecaoConteudo(value), 170);
      });
    }, 160);
  }

  return (
    <Modal title={editando ? 'Editar Usuário' : 'Novo Usuário'} onClose={onClose}>
      {editando && (
        <div className="usuarios-modal-tabs" role="tablist" aria-label="Editar usuário ou permissões">
          <button type="button" role="tab" aria-selected={secao === 'dados'} className={secao === 'dados' ? 'ativa' : ''} onClick={() => trocarSecao('dados')}>Editar usuário</button>
          <button type="button" role="tab" aria-selected={secao === 'permissoes'} className={secao === 'permissoes' ? 'ativa' : ''} onClick={() => trocarSecao('permissoes')}>Permissões</button>
          <span className={`usuarios-modal-indicador ${linhaVisivel ? 'visivel' : ''} ${secao === 'permissoes' ? 'direita' : ''}`} />
        </div>
      )}
      <form
        className="modal-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const emailLimpo = email.trim().toLowerCase();
          if (!editando && emailsExistentes.includes(emailLimpo)) {
            setErro('Já existe um usuário com esse e-mail.');
            return;
          }
          setErro('');
          setSalvando(true);
          try {
            await onSave({ nome: nome.trim(), email: emailLimpo, perfil, senha, permissoes });
          } catch (error: unknown) {
            setErro(mensagemErro(error));
            setSalvando(false);
          }
        }}
      >
        <div key={secaoConteudo} className="usuarios-modal-conteudo">
        {secaoConteudo === 'dados' ? <>
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
          <Select<Perfil>
            ariaLabel="Perfil de acesso"
            value={perfil}
            onChange={trocarPerfil}
            options={PERFIS.map((p) => ({ value: p, label: NOME_PERFIL[p] }))}
          />
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

        </> : <div className="usuarios-permissoes-modal">
          <p className="muted-sm">Base do perfil {NOME_PERFIL[perfil]}. Ajuste o acesso deste usuário por área.</p>
          {MODULOS.map((modulo) => (
            <label className="usuarios-permissao-linha" key={modulo.chave}>
              <span><strong>{modulo.nome}</strong><small>{modulo.descricao}</small></span>
              <Select<Nivel>
                className="usuarios-permissao-select"
                ariaLabel={`Permissão para ${modulo.nome}`}
                value={permissoes[modulo.chave] ?? nivelDoPerfil(perfil, modulo.chave)}
                onChange={(value) => setPermissoes((atual) => ({ ...atual, [modulo.chave]: value }))}
                options={(['editar', 'ver', 'nenhum'] as Nivel[]).map((nivel) => ({
                  value: nivel,
                  label: NIVEL_TEXTO[nivel],
                  tone: nivel === 'editar' ? 'green' : nivel === 'ver' ? 'blue' : 'gray',
                }))}
              />
            </label>
          ))}
        </div>}

        </div>

        {erro && <p className="usuarios-erro">{erro}</p>}

        <button className="btn-primary" type="submit" disabled={salvando}>
          {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar Usuário'}
        </button>
      </form>
    </Modal>
  );
}
