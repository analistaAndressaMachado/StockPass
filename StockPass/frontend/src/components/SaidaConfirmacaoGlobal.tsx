import { useEffect, useState } from 'react';
import type { ReservaSaida } from '../types';
import { cancelarReservaSaida, confirmarReservaSaida, listarReservasSaida } from '../services/stockApi';

type Resultado = { acao: 'confirmada' | 'cancelada'; produto: string; quantidade: number; saidaId?: number };
type Props = { reservaId: number; onClose: (resultado?: Resultado) => void };

function restanteSegundos(reserva: ReservaSaida, agora: number) {
  return Math.max(0, Math.ceil((new Date(reserva.expiresAt).getTime() - agora) / 1000));
}

function ToastReservaSaida({ reservaId, onClose }: Props) {
  const [reserva, setReserva] = useState<ReservaSaida | null>(null);
  const [agora, setAgora] = useState(Date.now());
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    listarReservasSaida()
      .then((reservas) => { if (ativo) setReserva(reservas.find((item) => item.id === reservaId) ?? null); })
      .catch(() => { if (ativo) setErro('Não foi possível carregar a reserva.'); });
    return () => { ativo = false; };
  }, [reservaId]);

  useEffect(() => {
    const intervalo = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(intervalo);
  }, [reservaId]);

  useEffect(() => {
    if (reserva && restanteSegundos(reserva, agora) === 0) onClose();
  }, [reserva, agora, onClose]);

  if (!reserva) return null;
  const reservaAtual = reserva;

  async function executar(acao: 'confirmar' | 'cancelar') {
    setProcessando(true);
    setErro('');
    try {
      const saida = acao === 'confirmar' ? await confirmarReservaSaida(reservaId) : null;
      if (acao === 'cancelar') await cancelarReservaSaida(reservaId);
      onClose({ acao: acao === 'confirmar' ? 'confirmada' : 'cancelada', produto: reservaAtual.product, quantidade: reservaAtual.quantity, saidaId: saida?.id });
    } catch {
      setErro('Não foi possível concluir. A reserva pode ter expirado.');
    } finally { setProcessando(false); }
  }

  const restante = restanteSegundos(reserva, agora);
  return (
    <aside className="saida-confirmacao-flutuante" role="dialog" aria-label="Confirmar saída de estoque">
      <div className="saida-confirmacao-indicador" aria-hidden="true" />
      <div className="saida-confirmacao-conteudo">
        <span className="saida-confirmacao-legenda">Saída aguardando confirmação</span>
        <strong>{reserva.product}</strong>
        <span className="muted-sm">{reserva.quantity} Uni · {reserva.reason}</span>
        <span className="saida-confirmacao-tempo">Confirme em {String(Math.floor(restante / 60)).padStart(2, '0')}:{String(restante % 60).padStart(2, '0')}</span>
        {erro && <span role="alert" className="muted-sm">{erro}</span>}
      </div>
      <div className="saida-confirmacao-acoes">
        <button className="btn-primary" type="button" disabled={processando} onClick={() => void executar('confirmar')}>{processando ? 'Aguarde...' : 'Confirmar'}</button>
        <button className="btn-secondary" type="button" disabled={processando} onClick={() => void executar('cancelar')}>Cancelar</button>
      </div>
    </aside>
  );
}

type GlobalProps = { reservaIds: number[]; onClose: (reservaId: number, resultado?: Resultado) => void };

export function SaidaConfirmacaoGlobal({ reservaIds, onClose }: GlobalProps) {
  if (reservaIds.length === 0) return null;
  return (
    <div className="saida-confirmacoes-flutuantes">
      {reservaIds.map((reservaId) => (
        <ToastReservaSaida key={reservaId} reservaId={reservaId} onClose={(resultado) => onClose(reservaId, resultado)} />
      ))}
    </div>
  );
}
