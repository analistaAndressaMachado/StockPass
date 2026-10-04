import { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { MOTIVOS_SAIDA, PRODUTOS_SAIDA } from './saidasMock';

export type NovaSaidaDados = {
  sku: string;
  produto: string;
  quantidade: number;
  motivo: string;
  observacao: string;
};

type Props = {
  onClose: () => void;
  onSave: (dados: NovaSaidaDados) => void;
};

export function NovaSaidaModal({ onClose, onSave }: Props) {
  const [sku, setSku] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observacao, setObservacao] = useState('');

  const produto = PRODUTOS_SAIDA.find((p) => p.sku === sku);

  return (
    <Modal title="Registrar Saída de Estoque" onClose={onClose}>
      <form
        className="modal-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!produto) return;
          onSave({
            sku: produto.sku,
            produto: produto.nome,
            quantidade: Number(quantidade),
            motivo,
            observacao: observacao.trim(),
          });
        }}
      >
        <label>
          Produto
          <select value={sku} onChange={(e) => setSku(e.target.value)} required>
            <option value="" disabled>Selecione um produto</option>
            {PRODUTOS_SAIDA.map((p) => (
              <option key={p.sku} value={p.sku} disabled={p.disponivel === 0}>
                {p.nome}{p.disponivel === 0 ? ' (sem estoque)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label>
          Quantidade que saiu (Uni)
          <input
            type="number"
            min={1}
            max={produto ? produto.disponivel : undefined}
            placeholder="Ex: 5"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            required
          />
        </label>

        {produto && <p className="muted-sm">Disponível em estoque: {produto.disponivel} Uni</p>}

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

        <button className="btn-primary" type="submit">
          Registrar Saída
        </button>
      </form>
    </Modal>
  );
}