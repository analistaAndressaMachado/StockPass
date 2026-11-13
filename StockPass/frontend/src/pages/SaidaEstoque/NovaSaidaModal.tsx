import { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { MOTIVOS_SAIDA } from './saidasMock';
import type { Produto } from '../../types';
import { mensagemErro } from '../../services/stockApi';

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
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const produto = products.find((p) => p.id === Number(productId));
  const quantidadeValida = Number.isInteger(Number(quantidade)) && Number(quantidade) > 0 &&
    Boolean(produto && Number(quantidade) <= produto.availableQuantity);

  async function solicitarReserva() {
    if (!produto || !quantidadeValida) return;
    setSalvando(true);
    setErro('');
    try {
      await onSave({ productId: produto.id, quantidade: Number(quantidade), motivo, observacao: observacao.trim() });
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal title="Registrar Saída de Estoque" onClose={onClose}>
      <form
        className="modal-form"
        onSubmit={(e) => {
          e.preventDefault();
          void solicitarReserva();
        }}
      >
        <label>
          Produto
          <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
            <option value="" disabled>{products.length ? 'Selecione um produto' : 'Cadastre um produto primeiro'}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id} disabled={p.availableQuantity === 0}>
                {p.nome} ({p.sku}){p.availableQuantity === 0 ? ' (sem saldo disponível)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label>
          Quantidade para reservar (Uni)
          <input
            type="number"
            min={1}
            max={produto ? produto.availableQuantity : undefined}
            placeholder="Ex: 5"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            required
          />
        </label>

        {produto && <p className="muted-sm">
          Saldo disponível: {produto.availableQuantity} Uni · Já reservadas: {produto.reservedQuantity} Uni
        </p>}

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

        {erro && <p className="muted-sm" role="alert" style={{ color: '#b91c1c' }}>{erro}</p>}

        <button className="btn-primary" type="submit" disabled={!produto || !quantidadeValida || salvando}>
          {salvando ? 'Criando reserva...' : 'Reservar saída'}
        </button>
      </form>
    </Modal>
  );
}
