import { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { PRODUTOS_ENTRADA } from './entradasMock';

export type NovaEntradaDados = {
  sku: string;
  produto: string;
  fornecedor: string;
  quantidade: number;
  notaFiscal: string;
};

type Props = {
  onClose: () => void;
  onSave: (dados: NovaEntradaDados) => void;
};

export function NovaEntradaModal({ onClose, onSave }: Props) {
  const [sku, setSku] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [notaFiscal, setNotaFiscal] = useState('');

  // O fornecedor é preenchido sozinho, a partir do produto escolhido.
  const produto = PRODUTOS_ENTRADA.find((p) => p.sku === sku);

  return (
    <Modal title="Nova Entrada de Estoque" onClose={onClose}>
      <form
        className="modal-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!produto) return;
          onSave({
            sku: produto.sku,
            produto: produto.nome,
            fornecedor: produto.fornecedor,
            quantidade: Number(quantidade),
            notaFiscal: notaFiscal.trim(),
          });
        }}
      >
        <label>
          Produto
          <select value={sku} onChange={(e) => setSku(e.target.value)} required>
            <option value="" disabled>Selecione um produto</option>
            {PRODUTOS_ENTRADA.map((p) => (
              <option key={p.sku} value={p.sku}>{p.nome}</option>
            ))}
          </select>
        </label>

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

        <button className="btn-primary" type="submit">
          Registrar Entrada
        </button>
      </form>
    </Modal>
  );
}