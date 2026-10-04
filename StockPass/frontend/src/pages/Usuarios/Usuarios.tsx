import { useState } from 'react';
import './Usuarios.css';
import type { User } from '../../types';
import {
  ATIVIDADES_INICIAIS,
  DESCRICAO_PERFIL,
  MODULOS,
  NIVEL_TEXTO,
  NOME_PERFIL,
  PERFIS,
  USUARIOS_INICIAIS,
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
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>(USUARIOS_INICIAIS);
  const [atividades, setAtividades] = useState<Atividade[]>(ATIVIDADES_INICIAIS);
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

  function registrarAtividade(acao: string) {
    // Com o backend, o servidor é quem grava isso (com data/hora e usuário reais).
    setAtividades((prev) => [
      { id: Date.now(), dataHora: new Date().toISOString(), usuario: user.name, acao },
      ...prev,
    ]);
  }

  function salvarUsuario(dados: UsuarioDados) {
    if (modal?.tipo === 'editar') {
      const antigo = modal.usuario;
      setUsuarios((prev) =>
        prev.map((u) => (u.id === antigo.id ? { ...u, nome: dados.nome, perfil: dados.perfil } : u)),
      );
      if (antigo.perfil !== dados.perfil) {
        registrarAtividade(`Alterou o perfil de ${dados.nome} para ${NOME_PERFIL[dados.perfil]}`);
      } else {
        registrarAtividade(`Editou os dados de ${dados.nome}`);
      }
    } else {
      const novo: UsuarioSistema = {
        id: Date.now(),
        nome: dados.nome,
        email: dados.email,
        perfil: dados.perfil,
        ativo: true,
        ultimoAcesso: null,
      };
      setUsuarios((prev) => [novo, ...prev]);
      registrarAtividade(`Criou o usuário ${dados.nome} (${NOME_PERFIL[dados.perfil]})`);
    }
    setModal(null);
  }

  function alternarStatus(alvo: UsuarioSistema) {
    setUsuarios((prev) => prev.map((u) => (u.id === alvo.id ? { ...u, ativo: !u.ativo } : u)));
    registrarAtividade(`${alvo.ativo ? 'Desativou' : 'Reativou'} o usuário ${alvo.nome}`);
  }

  return (
    <div className="usuarios">
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
              {filtrados.length === 0 ? (
                <p className="muted-sm usuarios-vazio">Nenhum usuário encontrado.</p>
              ) : (
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
                                               <td>{u.ultimoAcesso ? formatarDataHora(u.ultimoAcesso) : 'Nunca acessou'}</td>
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
                                                       onClick={() => alternarStatus(u)}
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
                                   )}
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
                                     Nesta versão a tabela é só de consulta. Depois, o Administrador poderá ajustar cada nível por aqui.
                                   </p>
                                 </div>
                               </>
                             )}

                             {aba === 'atividades' && (
                               <>
                                 <div className="usuarios-toolbar">
                                   <span className="muted-sm">{atividades.length} registros · do mais recente para o mais antigo</span>
                                 </div>

                                 <div className="usuarios-area">
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