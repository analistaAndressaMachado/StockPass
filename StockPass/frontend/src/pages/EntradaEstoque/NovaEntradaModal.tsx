import { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import type { Produto } from '../../types';

export type NovaEntradaDados = {
  productId: number;
  quantidade: number;
  notaFiscal: string;
  replenishmentId?: number;
};

type Props = {
  products: Produto[];
  reposicao?: { productId: number; quantity: number; replenishmentId?: number } | null;
  onClose: () => void;
  onSave: (dados: NovaEntradaDados) => void | Promise<void>;
};

export function NovaEntradaModal({ products, reposicao = null, onClose, onSave }: Props) {
  const [reposicaoInicial] = useState(reposicao);
  const [productId, setProductId] = useState(reposicaoInicial ? String(reposicaoInicial.productId) : '');
  const [quantidade, setQuantidade] = useState(reposicaoInicial ? String(reposicaoInicial.quantity) : '');
  const [notaFiscal, setNotaFiscal] = useState('');

  const produto = products.find((p) => p.id === Number(productId));

  return (
    <Modal title="Nova Entrada de Estoque" onClose={onClose}>
      <form
        className="modal-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!produto) return;
          void onSave({
            productId: produto.id,
            quantidade: Number(quantidade),
            notaFiscal: notaFiscal.trim(),
            replenishmentId: reposicaoInicial?.replenishmentId,
          });
        }}
      >
        <label>
          Produto
          <select value={productId} onChange={(e) => setProductId(e.target.value)} required disabled={Boolean(reposicaoInicial)}>
            <option value="" disabled>{products.length ? 'Selecione um produto' : 'Cadastre um produto primeiro'}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.nome} ({p.sku})</option>
            ))}
          </select>
        </label>

        {reposicaoInicial && produto && (
          <p className="muted-sm">
            Reposição sugerida para atingir o ponto de reposição de {produto.pontoReposicao} unidades.
          </p>
        )}

        <label>
          Quantidade recebida (Uni)
          <input
            type="number"
            min={1}
            placeholder="Ex: 30"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            required
          />
        </label>

        <label>
          Fornecedor
          <input type="text" value={produto ? produto.fornecedor : ''} readOnly />
        </label>

        <label>
          Nº da nota fiscal (opcional)
          <input
            type="text"
            placeholder="Ex: NF-4125"
            value={notaFiscal}
            onChange={(e) => setNotaFiscal(e.target.value)}
          />
        </label>

        <p className="muted-sm">A data, a hora e o usuário são registrados automaticamente.</p>

        <button className="btn-primary" type="submit" disabled={!produto}>
          Registrar Entrada
        </button>
      </form>
    </Modal>
  );
}