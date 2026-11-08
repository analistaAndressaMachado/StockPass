import { useEffect, useState } from 'react';
import './Usuarios.css';
import type { User } from '../../types';
import { mensagemErro } from '../../services/stockApi';
import { alterarStatusUsuario, criarUsuario, editarUsuario, listarAtividadesUsuarios, listarUsuarios } from '../../services/userManagementApi';
import {
  DESCRICAO_PERFIL,
  MODULOS,
  NIVEL_TEXTO,
  NOME_PERFIL,
  PERFIS,
  formatarDataHora,
  nivelClass,
  nivelDoPerfil,
  perfilClass,
} from './usuariosMock';
import type { Atividade, Perfil, UsuarioSistema } from './usuariosMock';
import { UsuarioModal } from './UsuarioModal';
import type { UsuarioDados } from './UsuarioModal';

type Aba = 'usuarios' | 'permissoes' | 'atividades';

type ModalEstado = { tipo: 'novo' } | { tipo: 'editar'; usuario: UsuarioSistema } | null;

type Props = {
  user: User;
};

export function Usuarios({ user }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState<Aba>('usuarios');
  const [busca, setBusca] = useState('');
  const [perfilFiltro, setPerfilFiltro] = useState<'todos' | Perfil>('todos');
  const [modal, setModal] = useState<ModalEstado>(null);

  // Perfil de quem está logado e o que ele pode fazer nesta área
  const meuPerfil = (PERFIS.includes(user.role as Perfil) ? user.role : 'USER') as Perfil;
  const meuNivel = nivelDoPerfil(meuPerfil, 'usuarios');
  const podeEditar = meuNivel === 'editar';
  const dicaSemPermissao = 'Somente Administradores podem alterar ou acrescentar';

  const termo = busca.trim().toLowerCase();
  const filtrados = usuarios.filter(
    (u) =>
      (perfilFiltro === 'todos' || u.perfil === perfilFiltro) &&
      (termo === '' || u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo)),
  );

  const ativos = usuarios.filter((u) => u.ativo).length;

  async function carregarDados() {
    const [lista, historico] = await Promise.all([listarUsuarios(), listarAtividadesUsuarios()]);
    setUsuarios(lista);
    setAtividades(historico);
    setErro('');
  }

  useEffect(() => {
    carregarDados().catch((error: unknown) => setErro(mensagemErro(error))).finally(() => setCarregando(false));
  }, []);

  async function salvarUsuario(dados: UsuarioDados) {
    if (modal?.tipo === 'editar') {
      await editarUsuario(modal.usuario.id, dados);
    } else {
      await criarUsuario(dados);
    }
    setModal(null);
    await carregarDados().catch((error: unknown) => setErro(mensagemErro(error)));
  }

  async function alternarStatus(alvo: UsuarioSistema) {
    try {
      await alterarStatusUsuario(alvo.id, !alvo.ativo);
      await carregarDados();
    } catch (error: unknown) {
      setErro(mensagemErro(error));
    }
  }

  return (
    <div className="usuarios">
      {erro && <p className="usuarios-erro" role="alert">{erro}</p>}
      <section className="panel-card panel-card--soft-padrao usuarios-topo">
        <div>
          <h2>Usuários e Permissões</h2>
          <p className="muted-sm">Controle quem acessa o sistema e o que cada perfil pode fazer</p>
          <p className="usuarios-acesso">
            <span className={nivelClass(meuNivel)}>{NIVEL_TEXTO[meuNivel]}</span>
            {podeEditar
              ? 'Seu acesso nesta área: você pode criar usuários, mudar perfis e ativar ou desativar contas.'
              : 'Seu acesso nesta área: você pode consultar, mas só Administradores podem alterar ou acrescentar.'}
          </p>
        </div>

        <button
          className="btn-primary"
          disabled={!podeEditar}
          title={podeEditar ? undefined : dicaSemPermissao}
          onClick={() => setModal({ tipo: 'novo' })}
        >
          Novo Usuário
        </button>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total de usuários</span>
          <p className="stat-value">{usuarios.length}</p>
          <p className="stat-hint">Contas cadastradas</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Ativos</span>
          <p className="stat-value">{ativos}</p>
          <p className="stat-hint">Com acesso liberado</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Inativos</span>
          <p className="stat-value">{usuarios.length - ativos}</p>
          <p className="stat-hint">Acesso bloqueado</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Seu perfil</span>
          <p className="stat-value">{NOME_PERFIL[meuPerfil]}</p>
          <p className="stat-hint">{DESCRICAO_PERFIL[meuPerfil]}</p>
        </div>
      </section>

      <section className="panel-card panel-card--soft-padrao usuarios-card">
        <div className="usuarios-abas">
          <button className={aba === 'usuarios' ? 'ativa' : ''} onClick={() => setAba('usuarios')}>
            Usuários
          </button>
          <button className={aba === 'permissoes' ? 'ativa' : ''} onClick={() => setAba('permissoes')}>
            Perfis e permissões
          </button>
          <button className={aba === 'atividades' ? 'ativa' : ''} onClick={() => setAba('atividades')}>
            Registro de atividades
          </button>
        </div>

        {aba === 'usuarios' && (
          <>
            <div className="usuarios-toolbar">
              <span className="muted-sm">{filtrados.length} usuários</span>
              <div className="usuarios-filtros">
                <input
                  type="search"
                  placeholder="Buscar por nome ou e-mail..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
                <select value={perfilFiltro} onChange={(e) => setPerfilFiltro(e.target.value as 'todos' | Perfil)}>
                  <option value="todos">Todos os perfis</option>
                  {PERFIS.map((p) => (
                    <option key={p} value={p}>{NOME_PERFIL[p]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="usuarios-area">
              {carregando ? <p className="muted-sm usuarios-vazio">Carregando usuários...</p> : filtrados.length === 0 && !erro ? (
                <p className="muted-sm usuarios-vazio">Nenhum usuário encontrado.</p>
              ) : filtrados.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Usuário</th>
                      <th>E-mail</th>
                      <th>Perfil</th>
                     <th>Status</th>
                     <th>Último acesso</th>
                                           <th>Ações</th>
                                         </tr>
                                       </thead>

                                       <tbody>
                                         {filtrados.map((u) => {
                                           const sou = u.email === user.email;
                                           return (
                                             <tr key={u.id}>
                                               <td>
                                                 <div className="usuarios-nome">
                                                   <span className="usuarios-avatar">{u.nome.charAt(0).toUpperCase()}</span>
                                                   {u.nome}
                                                 </div>
                                               </td>
                                               <td>{u.email}</td>
                                               <td>
                                                 <span className={perfilClass(u.perfil)}>{NOME_PERFIL[u.perfil]}</span>
                                               </td>
                                               <td>
                                                 <span className={u.ativo ? 'badge badge-green' : 'badge badge-gray'}>
                                                   {u.ativo ? 'Ativo' : 'Inativo'}
                                                 </span>
                                               </td>
                                               <td>{u.ultimoAcesso ? formatarDataHora(u.ultimoAcesso) : 'Não registrado'}</td>
                                               <td>
                                                 {sou ? (
                                                   <span className="muted-sm">Você</span>
                                                 ) : (
                                                   <div className="usuarios-acoes">
                                                     <button
                                                       className="btn-secondary"
                                                       disabled={!podeEditar}
                                                       title={podeEditar ? undefined : dicaSemPermissao}
                                                       onClick={() => setModal({ tipo: 'editar', usuario: u })}
                                                     >
                                                       Editar
                                                     </button>
                                                     <button
                                                       className="btn-secondary"
                                                       disabled={!podeEditar}
                                                       title={podeEditar ? undefined : dicaSemPermissao}
                                                       onClick={() => void alternarStatus(u)}
                                                     >
                                                       {u.ativo ? 'Desativar' : 'Reativar'}
                                                     </button>
                                                   </div>
                                                 )}
                                               </td>
                                             </tr>
                                           );
                                         })}
                                       </tbody>
                                     </table>
                                   ) : null}
                                 </div>
                               </>
                             )}

                             {aba === 'permissoes' && (
                               <>
                                 <div className="usuarios-toolbar">
                                   <div className="usuarios-legenda">
                                     <span className={nivelClass('editar')}>{NIVEL_TEXTO.editar}</span>
                                     <span className="muted-sm">pode consultar e alterar</span>
                                     <span className={nivelClass('ver')}>{NIVEL_TEXTO.ver}</span>
                                     <span className="muted-sm">só consulta, sem alterar</span>
                                     <span className={nivelClass('nenhum')}>{NIVEL_TEXTO.nenhum}</span>
                                     <span className="muted-sm">a área nem aparece no menu</span>
                                   </div>
                                 </div>

                                 <div className="usuarios-area">
                                   <table className="table usuarios-matriz">
                                     <thead>
                                       <tr>
                                         <th>Área do sistema</th>
                                         {PERFIS.map((p) => (
                                           <th key={p} className={p === meuPerfil ? 'coluna-voce' : ''}>
                                             {NOME_PERFIL[p]}{p === meuPerfil ? ' (você)' : ''}
                                             <small>{DESCRICAO_PERFIL[p]}</small>
                                           </th>
                                         ))}
                                       </tr>
                                     </thead>

                                     <tbody>
                                       {MODULOS.map((m) => (
                                         <tr key={m.chave}>
                                           <td>
                                             {m.nome}
                                             <small>{m.descricao}</small>
                                           </td>
                                           {PERFIS.map((p) => (
                                             <td key={p} className={p === meuPerfil ? 'coluna-voce' : ''}>
                                               <span className={nivelClass(m.niveis[p])}>{NIVEL_TEXTO[m.niveis[p]]}</span>
                                             </td>
                                           ))}
                                         </tr>
                                       ))}
                                     </tbody>
                                   </table>

                                   <p className="muted-sm usuarios-nota">
                                     Os perfis são definidos pelo sistema; somente administradores podem alterar contas internas.
                                   </p>
                                 </div>
                               </>
                             )}

                             {aba === 'atividades' && (
                               <>
                                 <div className="usuarios-toolbar">
                                   <span className="muted-sm">{atividades.length} alterações de usuários · do mais recente para o mais antigo</span>
                                 </div>

                                 <div className="usuarios-area">
                                   {!carregando && !erro && atividades.length === 0 && <p className="muted-sm usuarios-vazio">Nenhuma alteração administrativa registrada.</p>}
                                   <table className="table">
                                     <thead>
                                       <tr>
                                         <th>Data e hora</th>
                                         <th>Usuário</th>
                                         <th>Ação</th>
                                       </tr>
                                     </thead>

                                     <tbody>
                                       {atividades.map((a) => (
                                         <tr key={a.id}>
                                           <td>{formatarDataHora(a.dataHora)}</td>
                                           <td>{a.usuario}</td>
                                           <td>{a.acao}</td>
                                         </tr>
                                       ))}
                                     </tbody>
                                   </table>
                                 </div>
                               </>
                             )}
                           </section>

                           {modal && (
                             <UsuarioModal
                               usuario={modal.tipo === 'editar' ? modal.usuario : undefined}
                               emailsExistentes={usuarios.map((u) => u.email.toLowerCase())}
                               onClose={() => setModal(null)}
                               onSave={salvarUsuario}
                             />
                           )}
                         </div>
                       );
                     }