import { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { TodosItensModal } from './TodosItensModal';

const STATS = [
  { label: 'Estoque Total', value: '1.248', hint: 'Produtos em todos os armazéns' },
  { label: 'Itens em Estoque', value: '18.390', hint: 'Disponíveis para venda' },
  { label: 'Alerta de Mínimo', value: '62', hint: 'Abaixo do ponto de reposição', tag: 'Crítico' },
  { label: 'Itens Sem Estoque', value: '14', hint: 'Atualmente indisponíveis', tag: 'Atenção' },
];

const ALERTS = [
  { produto: 'Garrafa Reutilizável 750ml', sku: 'WB-750-BLK', atual: 8, ponto: 40, fornecedor: 'EcoFlow Supplies', status: 'Repor agora' },
  { produto: 'Mouse Sem Fio Pro', sku: 'WM-PRO-GRY', atual: 15, ponto: 50, fornecedor: 'Digital Gear Ltd', status: 'Estoque baixo' },
  { produto: 'Caixa de Envio Média', sku: 'BOX-MED-25', atual: 120, ponto: 200, fornecedor: 'PackRight', status: 'Monitorar' },
  { produto: 'Cabo de Carregamento USB-C 1m', sku: 'CAB-USBC-1M', atual: 0, ponto: 80, fornecedor: 'Connectix', status: 'Sem estoque' },
  { produto: 'Caderno A5 Pautado', sku: 'NB-A5-L', atual: 22, ponto: 60, fornecedor: 'PaperMill Co.', status: 'Reposição agendada' },
];

// Provisório: até existir backend de Produto, reaproveitamos os dados
// da tabela de alertas como se fosse o "catálogo" de produtos existentes.
const PRODUTOS_MOCK = ALERTS.map((a) => ({
  sku: a.sku,
  nome: a.produto,
  fornecedor: a.fornecedor,
}));

const MOTIVOS_SAIDA = ['Venda', 'Perda', 'Devolução', 'Outro'];

function statusClass(status: string) {
  if (status === 'Repor agora' || status === 'Sem estoque') return 'badge badge-red';
  if (status === 'Estoque baixo') return 'badge badge-orange';
  if (status === 'Monitorar') return 'badge badge-yellow';
  return 'badge badge-green';
}

export function Painel() {
  const [showProduto, setShowProduto] = useState(false);
  const [showEntrada, setShowEntrada] = useState(false);
  const [showSaida, setShowSaida] = useState(false);
  const [showTodos, setShowTodos] = useState(false);

  const [entradaProdutoSku, setEntradaProdutoSku] = useState('');
  const [entradaFornecedor, setEntradaFornecedor] = useState('');

  function handleEntradaProdutoChange(sku: string) {
    setEntradaProdutoSku(sku);
    const produto = PRODUTOS_MOCK.find((p) => p.sku === sku);
    setEntradaFornecedor(produto ? produto.fornecedor : '');
  }

  return (
    <div className="painel">

      <section className="stats-grid">
        {STATS.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-top">
              <span className="stat-label">{s.label}</span>

              {s.tag && (
                <span className={s.tag === 'Crítico' ? 'badge badge-red' : 'badge badge-blue'}>
                  {s.tag}
                </span>
              )}
            </div>

            <p className="stat-value">{s.value}</p>
            <p className="stat-hint">{s.hint}</p>
          </div>
        ))}
      </section>


      <section className="panel-card">
        <div className="card-header">
          <div>
            <h2>Alertas de estoque mínimo</h2>
            <p className="muted-sm">
              Priorize a reposição dos SKUs mais críticos
            </p>
          </div>

<a
            className="link-sm"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setShowTodos(true);
            }}
          >
            Ver todos os itens com baixo estoque
          </a>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Código do Produto</th>
              <th>Estoque Atual</th>
              <th>Ponto de Reposição</th>
              <th>Fornecedor</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {ALERTS.map((a) => (
              <tr key={a.sku}>
                <td>{a.produto}</td>
                <td>{a.sku}</td>
                <td>{a.atual}</td>
                <td>{a.ponto}</td>
                <td>{a.fornecedor}</td>
                <td>
                  <span className={statusClass(a.status)}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>


      <section className="panel-card">
        <h2>Ações rápidas</h2>

        <p className="muted-sm">
          Registre movimentações e gerencie o catálogo
        </p>

        <div className="quick-actions">

          <button className="btn-primary" onClick={() => setShowEntrada(true)}>
            Nova Entrada de Estoque
          </button>

          <button className="btn-secondary" onClick={() => setShowSaida(true)}>
            Registrar Saída de Estoque
          </button>

          <button
            className="btn-secondary"
            onClick={() => setShowProduto(true)}
          >
            Adicionar Novo Produto
          </button>

        </div>
      </section>


      {showProduto && (
        <Modal
          title="Adicionar Novo Produto"
          onClose={() => setShowProduto(false)}
        >
          <form
            className="modal-form"
            onSubmit={(e) => {
              e.preventDefault();

              alert('Produto cadastrado! Em breve isso será salvo no banco.');

              setShowProduto(false);
            }}
          >

            <label>
              Nome do produto
              <input
                type="text"
                placeholder="Ex: Garrafa Reutilizável 750ml"
                required
              />
            </label>


           <label>
             Código do Produto
             <input
               type="text"
               placeholder="Ex: GARRAFA-750-BLK"
               onChange={(e) => {
                 e.target.value = e.target.value.toUpperCase();
               }}
               required
             />
           </label>


            <label>
              Categoria
              <input
                type="text"
                placeholder="Ex: Utilidades"
                required
              />
            </label>


            <label>
              Fornecedor
              <input
                type="text"
                placeholder="Ex: EcoFlow Supplies"
                required
              />
            </label>


            <label>
              Quantidade inicial
              <input
                type="number"
                min={0}
                placeholder="Ex: 50"
                required
              />
            </label>


            <label>
              Ponto de reposição
              <input
                type="number"
                min={0}
                placeholder="Ex: 20"
                required
              />
            </label>


            <button
              className="btn-primary"
              type="submit"
            >
              Adicionar Produto
            </button>

          </form>
        </Modal>
      )}

      {showEntrada && (
        <Modal title="Nova Entrada de Estoque" onClose={() => setShowEntrada(false)}>
          <form
            className="modal-form"
            onSubmit={(e) => {
              e.preventDefault();
              // A data não é escolhida pelo usuário: quando isso salvar de
              // verdade no backend, a data/hora vai ser gravada automaticamente
              // no momento do registro.
              alert('Entrada registrada! Em breve isso será salvo no banco.');
              setShowEntrada(false);
              setEntradaProdutoSku('');
              setEntradaFornecedor('');
            }}
          >
            <label>
              Produto
              <select
                value={entradaProdutoSku}
                onChange={(e) => handleEntradaProdutoChange(e.target.value)}
                required
              >
                <option value="" disabled>Selecione um produto</option>
                {PRODUTOS_MOCK.map((p) => (
                  <option key={p.sku} value={p.sku}>{p.nome}</option>
                ))}
              </select>
            </label>

            <label>
              Quantidade recebida
              <input type="number" min={1} placeholder="Ex: 30" required />
            </label>

            <label>
              Fornecedor
              <input type="text" value={entradaFornecedor} readOnly />
            </label>

            <button className="btn-primary" type="submit">
              Registrar Entrada
            </button>
          </form>
        </Modal>
      )}

      {showSaida && (
        <Modal title="Registrar Saída de Estoque" onClose={() => setShowSaida(false)}>
          <form
            className="modal-form"
            onSubmit={(e) => {
              e.preventDefault();
              alert('Saída registrada! Em breve isso será salvo no banco.');
              setShowSaida(false);
            }}
          >
            <label>
              Produto
              <select defaultValue="" required>
                <option value="" disabled>Selecione um produto</option>
                {PRODUTOS_MOCK.map((p) => (
                  <option key={p.sku} value={p.sku}>{p.nome}</option>
                ))}
              </select>
            </label>

            <label>
              Quantidade que saiu
              <input type="number" min={1} placeholder="Ex: 5" required />
            </label>

            <label>
              Motivo
              <select defaultValue="" required>
                <option value="" disabled>Selecione um motivo</option>
                {MOTIVOS_SAIDA.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>

            <button className="btn-primary" type="submit">
              Registrar Saída
            </button>
          </form>
        </Modal>
      )}

      {showTodos && <TodosItensModal onClose={() => setShowTodos(false)} />}

    </div>
  );
}