import { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import './TodosItensModal.css';

type Item = {
  sku: string;
  produto: string;
  categoria: string;
  atual: number;
  ponto: number;
  fornecedor: string;
  status: string;
};

// Mock provisório com mais itens, só pra testar ordenação e paginação.
// As categorias reais vocês ainda vão decidir.
const ITENS_INICIAIS: Item[] = [
  { sku: 'WB-750-BLK', produto: 'Garrafa Reutilizável 750ml', categoria: 'Utilidades', atual: 8, ponto: 40, fornecedor: 'EcoFlow Supplies', status: 'Repor agora' },
  { sku: 'WM-PRO-GRY', produto: 'Mouse Sem Fio Pro', categoria: 'Eletrônicos', atual: 15, ponto: 50, fornecedor: 'Digital Gear Ltd', status: 'Estoque baixo' },
  { sku: 'BOX-MED-25', produto: 'Caixa de Envio Média', categoria: 'Embalagens', atual: 120, ponto: 200, fornecedor: 'PackRight', status: 'Monitorar' },
  { sku: 'CAB-USBC-1M', produto: 'Cabo de Carregamento USB-C 1m', categoria: 'Eletrônicos', atual: 0, ponto: 80, fornecedor: 'Connectix', status: 'Sem estoque' },
  { sku: 'NB-A5-L', produto: 'Caderno A5 Pautado', categoria: 'Papelaria', atual: 22, ponto: 60, fornecedor: 'PaperMill Co.', status: 'Reposição agendada' },
  { sku: 'PEN-BL-12', produto: 'Caneta Esferográfica Azul (cx 12)', categoria: 'Papelaria', atual: 34, ponto: 50, fornecedor: 'PaperMill Co.', status: 'Estoque baixo' },
  { sku: 'CLN-MULT-1L', produto: 'Limpador Multiuso 1L', categoria: 'Limpeza', atual: 60, ponto: 30, fornecedor: 'CleanPro', status: 'Monitorar' },
  { sku: 'BOX-SM-50', produto: 'Caixa de Envio Pequena', categoria: 'Embalagens', atual: 200, ponto: 150, fornecedor: 'PackRight', status: 'Monitorar' },
  { sku: 'HDPH-BT-01', produto: 'Fone de Ouvido Bluetooth', categoria: 'Eletrônicos', atual: 5, ponto: 25, fornecedor: 'Digital Gear Ltd', status: 'Repor agora' },
  { sku: 'GLV-NIT-M', produto: 'Luva de Nitrila (M)', categoria: 'Limpeza', atual: 0, ponto: 40, fornecedor: 'CleanPro', status: 'Sem estoque' },
  { sku: 'NB-A4-L', produto: 'Caderno A4 Pautado', categoria: 'Papelaria', atual: 48, ponto: 60, fornecedor: 'PaperMill Co.', status: 'Estoque baixo' },
  { sku: 'TAPE-CLR-48', produto: 'Fita Adesiva Transparente', categoria: 'Embalagens', atual: 90, ponto: 40, fornecedor: 'PackRight', status: 'OK' },
  { sku: 'MUG-CER-01', produto: 'Caneca de Cerâmica', categoria: 'Utilidades', atual: 30, ponto: 20, fornecedor: 'EcoFlow Supplies', status: 'OK' },
  { sku: 'USB-32GB', produto: 'Pen Drive 32GB', categoria: 'Eletrônicos', atual: 12, ponto: 30, fornecedor: 'Digital Gear Ltd', status: 'Repor agora' },
  { sku: 'SOAP-LIQ-500', produto: 'Sabonete Líquido 500ml', categoria: 'Limpeza', atual: 70, ponto: 25, fornecedor: 'CleanPro', status: 'OK' },
  { sku: 'ENV-A4-100', produto: 'Envelope A4 (pct 100)', categoria: 'Papelaria', atual: 18, ponto: 20, fornecedor: 'PaperMill Co.', status: 'Estoque baixo' },
  { sku: 'BOX-LG-10', produto: 'Caixa de Envio Grande', categoria: 'Embalagens', atual: 40, ponto: 30, fornecedor: 'PackRight', status: 'OK' },
  { sku: 'BOTL-STL-500', produto: 'Garrafa Térmica de Aço 500ml', categoria: 'Utilidades', atual: 6, ponto: 25, fornecedor: 'EcoFlow Supplies', status: 'Repor agora' },
  { sku: 'CBL-HDMI-2M', produto: 'Cabo HDMI 2m', categoria: 'Eletrônicos', atual: 20, ponto: 20, fornecedor: 'Digital Gear Ltd', status: 'Monitorar' },
  { sku: 'DETG-PO-1KG', produto: 'Detergente em Pó 1kg', categoria: 'Limpeza', atual: 45, ponto: 30, fornecedor: 'CleanPro', status: 'OK' },
];

const ITENS_POR_PAGINA = 8;

type OrdemOpcao = 'nome-asc' | 'nome-desc' | 'categoria-asc' | 'atual-asc' | 'atual-desc';

function statusClass(status: string) {
  if (status === 'Repor agora' || status === 'Sem estoque') return 'badge badge-red';
  if (status === 'Estoque baixo') return 'badge badge-orange';
  if (status === 'Monitorar') return 'badge badge-yellow';
  if (status === 'Reposição agendada') return 'badge badge-blue';
  return 'badge badge-green';
}

type Props = {
  onClose: () => void;
};

export function TodosItensModal({ onClose }: Props) {
  const [itens, setItens] = useState<Item[]>(ITENS_INICIAIS);
  const [ordem, setOrdem] = useState<OrdemOpcao>('nome-asc');
  const [pagina, setPagina] = useState(1);
  const [editandoSku, setEditandoSku] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<Item | null>(null);

  const itensOrdenados = [...itens].sort((a, b) => {
    switch (ordem) {
      case 'nome-asc': return a.produto.localeCompare(b.produto);
      case 'nome-desc': return b.produto.localeCompare(a.produto);
      case 'categoria-asc': return a.categoria.localeCompare(b.categoria);
      case 'atual-asc': return a.atual - b.atual;
      case 'atual-desc': return b.atual - a.atual;
      default: return 0;
    }
  });

  const totalPaginas = Math.max(1, Math.ceil(itensOrdenados.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const itensDaPagina = itensOrdenados.slice(inicio, inicio + ITENS_POR_PAGINA);

  function iniciarEdicao(item: Item) {
    setEditandoSku(item.sku);
    setRascunho({ ...item });
  }

  function cancelarEdicao() {
    setEditandoSku(null);
    setRascunho(null);
  }

  function salvarEdicao() {
    if (!rascunho) return;
    // Por enquanto só muda em memória (no navegador). Quando existir
    // backend de Produto, aqui vai entrar uma chamada pra API de verdade.
    setItens((prev) => prev.map((i) => (i.sku === rascunho.sku ? rascunho : i)));
    setEditandoSku(null);
    setRascunho(null);
  }

  return (
    <Modal title="Todos os itens com baixo estoque" onClose={onClose} size="large">
      <div className="todos-itens">

        <div className="todos-itens-toolbar">
          <label className="ordenar-label">
            Ordenar por
            <select
              value={ordem}
              onChange={(e) => {
                setOrdem(e.target.value as OrdemOpcao);
                setPagina(1);
              }}
            >
              <option value="nome-asc">Nome (A–Z)</option>
              <option value="nome-desc">Nome (Z–A)</option>
              <option value="categoria-asc">Categoria (A–Z)</option>
              <option value="atual-asc">Estoque atual (menor primeiro)</option>
              <option value="atual-desc">Estoque atual (maior primeiro)</option>
            </select>
          </label>

          <span className="muted-sm">{itensOrdenados.length} itens no total</span>
        </div>

        <div className="todos-itens-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Código</th>
                <th>Categoria</th>
                <th>Estoque Atual</th>
                <th>Ponto de Reposição</th>
                <th>Fornecedor</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {itensDaPagina.map((item) => {
                const emEdicao = editandoSku === item.sku;

                return (
                  <tr key={item.sku}>
                    {emEdicao && rascunho ? (
                      <>
                        <td>
                          <input
                            className="edit-input"
                            value={rascunho.produto}
                            onChange={(e) => setRascunho({ ...rascunho, produto: e.target.value })}
                          />
                        </td>
                        <td>{item.sku}</td>
                        <td>
                          <input
                            className="edit-input"
                            value={rascunho.categoria}
                            onChange={(e) => setRascunho({ ...rascunho, categoria: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="edit-input edit-input-num"
                            type="number"
                            min={0}
                            value={rascunho.atual}
                            onChange={(e) => setRascunho({ ...rascunho, atual: Number(e.target.value) })}
                          />
                        </td>
                        <td>
                          <input
                            className="edit-input edit-input-num"
                            type="number"
                            min={0}
                            value={rascunho.ponto}
                            onChange={(e) => setRascunho({ ...rascunho, ponto: Number(e.target.value) })}
                          />
                        </td>
                        <td>
                          <input
                            className="edit-input"
                            value={rascunho.fornecedor}
                            onChange={(e) => setRascunho({ ...rascunho, fornecedor: e.target.value })}
                          />
                        </td>
                        <td>
                          <span className={statusClass(item.status)}>{item.status}</span>
                        </td>
                        <td className="acoes-col">
                          <button className="icon-btn icon-btn-ok" onClick={salvarEdicao} title="Salvar">✓</button>
                          <button className="icon-btn icon-btn-cancel" onClick={cancelarEdicao} title="Cancelar">✕</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{item.produto}</td>
                        <td>{item.sku}</td>
                        <td>{item.categoria}</td>
                        <td>{item.atual}</td>
                        <td>{item.ponto}</td>
                        <td>{item.fornecedor}</td>
                        <td>
                          <span className={statusClass(item.status)}>{item.status}</span>
                        </td>
                        <td className="acoes-col">
                          <button className="icon-btn" onClick={() => iniciarEdicao(item)} title="Editar">✏️</button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="todos-itens-footer">
          <button
            className="btn-secondary"
            disabled={paginaAtual === 1}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
          >
            ← Anterior
          </button>

          <span className="muted-sm">Página {paginaAtual} de {totalPaginas}</span>

          <button
            className="btn-secondary"
            disabled={paginaAtual === totalPaginas}
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
          >
            Próxima →
          </button>

          <button className="btn-primary" onClick={onClose}>
            Fechar
          </button>
        </div>

      </div>
    </Modal>
  );
}