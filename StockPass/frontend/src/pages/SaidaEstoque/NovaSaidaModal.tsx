import { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { Select } from '../../components/Select/Select';
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

  const produtoEncontrado = products.find((p) => p.id === Number(productId));
  const produto = produtoEncontrado?.active ? produtoEncontrado : undefined;
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
          <Select
            ariaLabel="Produto"
            value={productId}
            onChange={setProductId}
            required
            placeholder={products.some((p) => p.active) ? 'Selecione um produto' : 'Nenhum produto ativo disponível'}
            options={products.filter((p) => p.active).map((p) => ({
              value: String(p.id),
              label: `${p.nome} (${p.sku})${p.availableQuantity === 0 ? ' (sem saldo disponível)' : ''}`,
              disabled: p.availableQuantity === 0,
            }))}
          />
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
          <Select
            ariaLabel="Motivo da saída"
            value={motivo}
            onChange={setMotivo}
            required
            placeholder="Selecione um motivo"
            options={MOTIVOS_SAIDA.map((m) => ({ value: m, label: m }))}
          />
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
