import { Fragment, useState } from 'react';
import { pontosParaLinha, statusClass } from './produtosPeriodo';
import type { ProdutoRelatorio } from './produtosPeriodo';

type Props = {
  produtos: ProdutoRelatorio[];
};

// Tabela de produtos com linhas clicáveis: ao clicar, a linha "abre" e mostra
// o resumo de movimentação + gráfico daquele produto. Usada no card da página
// de Relatórios e também dentro do modal "Ver todos".
export function ProdutosPeriodoTabela({ produtos }: Props) {
  const [linhaAberta, setLinhaAberta] = useState<string | null>(null);

  function toggleLinha(sku: string) {
    setLinhaAberta((atual) => (atual === sku ? null : sku));
  }

  function verHistoricoCompleto(produto: string) {
    alert(`Em breve: histórico completo de "${produto}" (depende da tela de Catálogo).`);
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th></th>
          <th>Produto</th>
          <th>Código do Produto</th>
          <th>Fornecedor</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {produtos.map((p) => {
          const aberto = linhaAberta === p.sku;

          return (
            <Fragment key={p.sku}>
              <tr className="linha-clicavel" onClick={() => toggleLinha(p.sku)}>
                <td className="col-seta">
                  <span className={`seta ${aberto ? 'seta-aberta' : ''}`}>›</span>
                </td>
                <td>{p.produto}</td>
                <td>{p.sku}</td>
                <td>{p.fornecedor}</td>
                <td>
                  <span className={statusClass(p.status)}>{p.status}</span>
                </td>
              </tr>

              {aberto && (
                <tr className="linha-detalhe">
                  <td colSpan={5}>
                    {/* Um único quadro com os 3 números, em vez de 3 cards separados */}
                    <div className="resumo-unico">
                      <div className="resumo-item">
                        <span className="stat-label">
                          <i className="ponto ponto-azul" /> Entradas
                        </span>
                        <p className="stat-value">{p.entradasPeriodo} Uni</p>
                      </div>
                      <div className="resumo-item">
                        <span className="stat-label">
                          <i className="ponto ponto-laranja" /> Saídas
                        </span>
                        <p className="stat-value">{p.saidasPeriodo} Uni</p>
                      </div>
                      <div className="resumo-item">
                        <span className="stat-label">Estoque atual</span>
                        <p className="stat-value">{p.estoqueAtual} Uni</p>
                      </div>
                    </div>

                    <svg
                      viewBox="0 0 300 60"
                      className="mini-svg"
                      role="img"
                      aria-label={`Tendência de estoque de ${p.produto}`}
                    >
                      <polyline
                        points={pontosParaLinha(p.tendencia, 300, 50)}
                        fill="none"
                        stroke="#ea580c"
                        strokeWidth={2}
                      />
                    </svg>

                    <a
                      className="link-sm"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        verHistoricoCompleto(p.produto);
                      }}
                    >
                      Ver histórico completo do produto →
                    </a>
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}