import { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';

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

function statusClass(status: string) {
  if (status === 'Repor agora' || status === 'Sem estoque') return 'badge badge-red';
  if (status === 'Estoque baixo') return 'badge badge-orange';
  if (status === 'Monitorar') return 'badge badge-yellow';
  return 'badge badge-green';
}

export function Painel() {
  const [showProduto, setShowProduto] = useState(false);

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

          <a className="link-sm" href="#">
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

          <button className="btn-primary">
            Nova Entrada de Estoque
          </button>

          <button className="btn-secondary">
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

    </div>
  );
}