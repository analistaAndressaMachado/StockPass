import { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { MOTIVOS_SAIDA } from './saidasMock';
import type { Produto } from '../../types';

export type NovaSaidaDados = {
  productId: number;
  quantidade: number;
  motivo: string;
  observacao: string;
};

type Props = {
  products: Produto[];
  onClose: () => void;
  onSave: (dados: NovaSaidaDados) => void | Promise<void>;
};

export function NovaSaidaModal({ products, onClose, onSave }: Props) {
  const [productId, setProductId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observacao, setObservacao] = useState('');

  const produto = products.find((p) => p.id === Number(productId));

  return (
    <Modal title="Registrar Saída de Estoque" onClose={onClose}>
      <form
        className="modal-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!produto) return;
          void onSave({ productId: produto.id, quantidade: Number(quantidade), motivo, observacao: observacao.trim() });
        }}
      >
        <label>
          Produto
          <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
            <option value="" disabled>{products.length ? 'Selecione um produto' : 'Cadastre um produto primeiro'}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id} disabled={p.quantidade === 0}>
                {p.nome} ({p.sku}){p.quantidade === 0 ? ' (sem estoque)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label>
          Quantidade que saiu (Uni)
          <input
            type="number"
            min={1}
            max={produto ? produto.quantidade : undefined}
            placeholder="Ex: 5"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            required
          />
        </label>

        {produto && <p className="muted-sm">Disponível em estoque: {produto.quantidade} Uni</p>}

        <label>
          Motivo
          <select value={motivo} onChange={(e) => setMotivo(e.target.value)} required>
            <option value="" disabled>Selecione um motivo</option>
            {MOTIVOS_SAIDA.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>

        <label>
          Observação (opcional)
          <input
            type="text"
            placeholder="Ex: Item danificado no transporte"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </label>

        <p className="muted-sm">A data, a hora e o usuário são registrados automaticamente.</p>

        <button className="btn-primary" type="submit" disabled={!produto}>
          Registrar Saída
        </button>
      </form>
    </Modal>
  );
}