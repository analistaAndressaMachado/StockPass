import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { User } from '../../types';
import {
  adquirirOferta,
  atualizarOfertaFornecedor,
  criarOfertaFornecedor,
  desativarOfertaFornecedor,
  listarMarketplaceFornecedores,
  listarOfertasFornecedor,
  listarSaidasFornecedor,
  obterPerfilFornecedor,
} from '../../services/supplierApi';
import type { SupplierOffer, SupplierOfferInput, SupplierProfile, SupplierSale } from '../../services/supplierApi';
import { mensagemErro } from '../../services/stockApi';
import './Fornecedores.css';

type Props = {
  user: User;
};

type OfferForm = {
  sku: string;
  name: string;
  category: string;
  price: string;
  availableQuantity: string;
};

const EMPTY_FORM: OfferForm = { sku: '', name: '', category: '', price: '', availableQuantity: '' };

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function Fornecedores({ user }: Props) {
  const isSupplier = user.role === 'FORNECEDOR';
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [offers, setOffers] = useState<SupplierOffer[]>([]);
  const [sales, setSales] = useState<SupplierSale[]>([]);
  const [form, setForm] = useState<OfferForm>({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyOfferId, setBusyOfferId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadOffers() {
    if (isSupplier) {
      const [supplierProfile, supplierOffers, supplierSales] = await Promise.all([
        obterPerfilFornecedor(),
        listarOfertasFornecedor(),
        listarSaidasFornecedor(),
      ]);
      setProfile(supplierProfile);
      setOffers(supplierOffers);
      setSales(supplierSales);
    } else {
      setOffers(await listarMarketplaceFornecedores());
    }
  }

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        await loadOffers();
      } catch (loadError) {
        if (mounted) setError(mensagemErro(loadError));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, [isSupplier]);

  function editOffer(offer: SupplierOffer) {
    setEditingId(offer.id);
    setForm({
      sku: offer.sku,
      name: offer.name,
      category: offer.category,
      price: String(offer.price),
      availableQuantity: String(offer.availableQuantity),
    });
    setError('');
    setSuccess('');
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  async function saveOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const offer: SupplierOfferInput = {
      sku: form.sku.trim().toUpperCase(),
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      availableQuantity: Number(form.availableQuantity),
    };
    try {
      const saved = editingId === null
        ? await criarOfertaFornecedor(offer)
        : await atualizarOfertaFornecedor(editingId, offer);
      setOffers((current) => {
        const exists = current.some((item) => item.id === saved.id);
        return exists
          ? current.map((item) => item.id === saved.id ? saved : item)
          : [saved, ...current];
      });
      setSuccess(editingId === null ? 'Produto publicado no catálogo de fornecedores.' : 'Oferta atualizada.');
      resetForm();
      void loadOffers().catch((refreshError) => setError(
        `As alterações foram salvas, mas não foi possível atualizar a lista: ${mensagemErro(refreshError)}`,
      ));
    } catch (saveError) {
      setError(mensagemErro(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function deactivateOffer(offer: SupplierOffer) {
    setBusyOfferId(offer.id);
    setError('');
    try {
      await desativarOfertaFornecedor(offer.id);
      await loadOffers();
      setSuccess(`A oferta "${offer.name}" foi retirada do catálogo.`);
    } catch (removeError) {
      setError(mensagemErro(removeError));
    } finally {
      setBusyOfferId(null);
    }
  }

  async function purchaseOffer(offer: SupplierOffer) {
    const quantity = Number(quantities[offer.id] ?? 1);
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > offer.availableQuantity) {
      setError(`Informe uma quantidade entre 1 e ${offer.availableQuantity}.`);
      return;
    }
    setBusyOfferId(offer.id);
    setError('');
    setSuccess('');
    try {
      const purchase = await adquirirOferta(offer.id, quantity);
      await loadOffers();
      setQuantities((current) => ({ ...current, [offer.id]: '' }));
      setSuccess(`${purchase.quantity} un. de ${purchase.product} adquiridas de ${purchase.supplierName} e adicionadas ao estoque (${purchase.stockAfterPurchase} un. disponíveis).`);
    } catch (purchaseError) {
      setError(mensagemErro(purchaseError));
    } finally {
      setBusyOfferId(null);
    }
  }

  return (
    <div className="fornecedores-page">
      <section className="panel-card panel-card--soft-padrao fornecedores-header">
        <div>
          <h2>{isSupplier ? profile?.companyName || user.name : 'Fornecedores'}</h2>
          <p className="muted-sm">
            {isSupplier
              ? 'Gerencie seus produtos disponíveis para aquisição.'
              : 'Consulte ofertas disponíveis e adquira produtos para abastecer o estoque.'}
          </p>
        </div>
        <span className="fornecedores-contagem">{offers.length} {isSupplier ? 'ofertas cadastradas' : 'ofertas disponíveis'}</span>
      </section>

      {error && <p className="fornecedores-feedback fornecedores-feedback-error" role="alert">{error}</p>}
      {success && <p className="fornecedores-feedback fornecedores-feedback-success" role="status">{success}</p>}

      {isSupplier && (
        <section className="panel-card panel-card--soft-padrao fornecedor-form-section">
          <div className="fornecedores-section-title">
            <div>
              <h2>{editingId === null ? 'Publicar produto disponível' : 'Editar oferta'}</h2>
              <p className="muted-sm">A disponibilidade e o preço ficam visíveis para a equipe do estoque.</p>
            </div>
          </div>
          <form className="fornecedor-offer-form" onSubmit={saveOffer}>
            <label>Código do fornecedor
              <input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} required />
            </label>
            <label>Nome do produto
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label>Categoria
              <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required />
            </label>
            <label>Preço unitário
              <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
            </label>
            <label>Quantidade disponível
              <input type="number" min="0" step="1" value={form.availableQuantity} onChange={(event) => setForm({ ...form, availableQuantity: event.target.value })} required />
            </label>
            <div className="fornecedor-form-actions">
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? 'Salvando...' : editingId === null ? 'Publicar oferta' : 'Salvar alterações'}
              </button>
              {editingId !== null && <button className="btn-secondary" type="button" onClick={resetForm}>Cancelar edição</button>}
            </div>
          </form>
        </section>
      )}

      <section className="fornecedores-offers-section">
        <div className="fornecedores-section-title">
          <div>
            <h2>{isSupplier ? 'Meus produtos disponíveis' : 'Produtos disponíveis para aquisição'}</h2>
            <p className="muted-sm">{isSupplier ? 'As alterações aparecem imediatamente no catálogo interno.' : 'Ao adquirir, a entrada é registrada no histórico e o saldo do estoque é atualizado.'}</p>
          </div>
        </div>

        {loading ? <p className="muted-sm">Carregando ofertas...</p> : offers.length === 0 ? (
          <div className="fornecedores-empty">{isSupplier ? 'Você ainda não publicou ofertas.' : 'Nenhum produto está disponível neste momento.'}</div>
        ) : (
          <div className="fornecedores-offer-list">
            {offers.map((offer) => (
              <article className="fornecedor-offer-row" key={offer.id}>
                <div className="fornecedor-offer-main">
                  <span className="fornecedor-offer-category">{offer.category}</span>
                  <h3>{offer.name}</h3>
                  <p className="muted-sm">Código {offer.sku} · {isSupplier ? offer.availableQuantity : `Fornecedor: ${offer.companyName}`} </p>
                </div>
                <div className="fornecedor-offer-price">
                  <strong>{formatPrice(offer.price)}</strong>
                  <span>{offer.availableQuantity} un. disponíveis</span>
                </div>
                {isSupplier ? (
                  <div className="fornecedor-offer-actions">
                    <button className="btn-secondary" onClick={() => editOffer(offer)}>Editar</button>
                    <button className="btn-secondary" disabled={busyOfferId === offer.id} onClick={() => void deactivateOffer(offer)}>
                      {busyOfferId === offer.id ? 'Removendo...' : 'Retirar oferta'}
                    </button>
                  </div>
                ) : (
                  <div className="fornecedor-purchase-actions">
                    <label>Quantidade
                      <input
                        type="number"
                        min="1"
                        max={offer.availableQuantity}
                        value={quantities[offer.id] ?? '1'}
                        onChange={(event) => setQuantities({ ...quantities, [offer.id]: event.target.value })}
                      />
                    </label>
                    <button className="btn-primary" disabled={busyOfferId === offer.id} onClick={() => void purchaseOffer(offer)}>
                      {busyOfferId === offer.id ? 'Processando...' : 'Adquirir'}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {isSupplier && (
        <section className="panel-card panel-card--soft-padrao fornecedor-sales-section">
          <div className="fornecedores-section-title">
            <div>
              <h2>Saídas dos meus produtos</h2>
              <p className="muted-sm">Aquisições realizadas pela equipe e abatidas da disponibilidade das ofertas.</p>
            </div>
            <span className="fornecedores-contagem">
              {sales.reduce((total, sale) => total + sale.quantity, 0)} unidades adquiridas
            </span>
          </div>
          {sales.length === 0 ? (
            <div className="fornecedores-empty">Ainda não há saídas ou aquisições dos seus produtos.</div>
          ) : (
            <div className="fornecedor-sales-table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Produto</th>
                    <th>Código</th>
                    <th>Quantidade</th>
                    <th>Preço unitário</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.purchaseId}>
                      <td>{new Date(sale.purchasedAt).toLocaleString('pt-BR')}</td>
                      <td>{sale.product}</td>
                      <td>{sale.sku}</td>
                      <td>{sale.quantity} un.</td>
                      <td>{formatPrice(sale.unitPrice)}</td>
                      <td>{formatPrice(sale.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
