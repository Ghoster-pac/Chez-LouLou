import React, { useMemo, useState } from 'react';
import { Check, Gift, Sparkles, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CustomGiftBoxDetails, Product } from '../types/store';
import { CATEGORY_LABELS, formatXof } from '../utils/formatters';
import { ProductImage } from './ProductImage';

interface CustomGiftBoxModalProps {
  open: boolean;
  onClose: () => void;
}

const GIFT_BOX_TIERS = [
  {
    id: 'pochon',
    name: 'Pochon Lin Offert',
    priceXof: 0,
    desc: 'Pochon coton écru Chez LouLou + ruban satin.',
  },
  {
    id: 'prune',
    name: 'Boîte Prune Signature',
    priceXof: 2500,
    desc: 'Coffret rigide aimanté prune & papier de soie parfumé.',
  },
  {
    id: 'luxe',
    name: 'Coffret Luxe Ruban Or',
    priceXof: 4000,
    desc: 'Grand écrin premium + carte calligraphiée dorée.',
  },
];

const TISSUE_COLORS = [
  { name: 'Rose Poudré', hex: '#F9A8D4' },
  { name: 'Prune Royal', hex: '#540B3B' },
  { name: 'Ivoire Crème', hex: '#FAF4F7' },
  { name: 'Or Champagne', hex: '#D4AF37' },
];

export const CustomGiftBoxModal: React.FC<CustomGiftBoxModalProps> = ({ open, onClose }) => {
  const { products, addToCart, activeSeason, settings, previewSeasonId, pushToast } = useStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [boxTierId, setBoxTierId] = useState<string>('prune');
  const [tissueColor, setTissueColor] = useState<string>(TISSUE_COLORS[0].name);
  const [recipientName, setRecipientName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');

  const eligibleProducts = useMemo(
    () => products.filter((p) => p.available && p.stock > 0),
    [products]
  );

  const effectiveDiscount =
    !previewSeasonId && settings.festiveDiscountPercent > 0
      ? settings.festiveDiscountPercent
      : activeSeason.suggestedDiscountPercent;

  const getProductPrice = (p: Product) =>
    effectiveDiscount > 0
      ? Math.round((p.priceXof * (100 - effectiveDiscount)) / 100)
      : p.priceXof;

  const selectedProducts = useMemo(
    () =>
      selectedIds
        .map((id) => eligibleProducts.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    [selectedIds, eligibleProducts]
  );

  const boxTier = GIFT_BOX_TIERS.find((b) => b.id === boxTierId) || GIFT_BOX_TIERS[1];

  const itemsTotalXof = selectedProducts.reduce((sum, p) => sum + getProductPrice(p), 0);
  const totalBoxXof = itemsTotalXof + boxTier.priceXof;

  if (!open) return null;

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) {
        pushToast('Un coffret sur mesure peut contenir jusqu’à 4 articles.', 'neutral');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleAddCustomBox = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length < 2) {
      pushToast('Sélectionnez au moins 2 articles pour composer votre coffret.', 'error');
      return;
    }

    const cleanRecipient = recipientName.trim() || 'Un être cher';
    const cleanMessage = giftMessage.trim() || 'Avec toute mon affection — Chez LouLou';

    const details: CustomGiftBoxDetails = {
      boxName: boxTier.name,
      boxPriceXof: boxTier.priceXof,
      tissueColor,
      recipientName: cleanRecipient.slice(0, 80),
      giftMessage: cleanMessage.slice(0, 250),
      includedItems: selectedProducts.map((p) => ({
        productId: p.id,
        title: p.title,
        priceXof: getProductPrice(p),
      })),
    };

    const syntheticProduct: Product = {
      id: `coffret-perso-${Date.now().toString(36)}`,
      title: `Coffret Sur Mesure (${selectedProducts.length} articles)`,
      category: 'cadeaux',
      description: `${boxTier.name} · Papier de soie ${tissueColor} · Pour ${cleanRecipient}`,
      priceXof: totalBoxXof,
      imageUrl: selectedProducts[0].imageUrl,
      available: true,
      stock: 5,
      sizes: ['Coffret'],
      festiveTags: [activeSeason.id],
      featured: false,
      salesCount: 0,
    };

    addToCart(syntheticProduct, 'Coffret', 1, tissueColor, details);
    setSelectedIds([]);
    setRecipientName('');
    setGiftMessage('');
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--canvas)',
    color: 'var(--ink)',
    borderColor: 'var(--border-hairline)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Créer un coffret cadeau sur mesure"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-2xl border shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border-hairline)',
          color: 'var(--ink)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          <div className="flex items-center gap-2.5">
            <Gift className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <div>
              <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--ink)' }}>
                Composer un Coffret Cadeau Sur Mesure
              </h2>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                Choisissez 2 à 4 articles, votre écrin, la couleur du papier de soie et votre mot imprimé.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 rounded-lg cursor-pointer"
            style={{ color: 'var(--ink-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAddCustomBox} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Select 2-4 items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                1. Sélectionnez 2 à 4 articles ({selectedProducts.length}/4 choisis)
              </p>
              <span className="text-xs font-mono-num" style={{ color: 'var(--ink-muted)' }}>
                Articles : {formatXof(itemsTotalXof)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
              {eligibleProducts.map((p) => {
                const picked = selectedIds.includes(p.id);
                const price = getProductPrice(p);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProduct(p.id)}
                    className="p-2.5 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer"
                    style={{
                      backgroundColor: picked ? 'var(--surface-subtle)' : 'var(--canvas)',
                      borderColor: picked ? 'var(--accent)' : 'var(--border-hairline)',
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-lg overflow-hidden shrink-0"
                      style={{ backgroundColor: 'var(--surface-subtle)' }}
                    >
                      <ProductImage src={p.imageUrl} alt={p.title} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--ink)' }}>
                        {p.title}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                        {CATEGORY_LABELS[p.category]} ·{' '}
                        <span className="font-mono-num font-medium" style={{ color: 'var(--ink)' }}>
                          {formatXof(price)}
                        </span>
                      </p>
                    </div>
                    <div
                      className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0"
                      style={
                        picked
                          ? {
                              backgroundColor: 'var(--accent)',
                              borderColor: 'var(--accent)',
                              color: 'var(--accent-contrast)',
                            }
                          : { borderColor: 'var(--border-hairline)' }
                      }
                    >
                      {picked && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Box & Tissue Paper */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold mb-2.5" style={{ color: 'var(--ink)' }}>
                2. Choix de l’écrin
              </p>
              <div className="space-y-2">
                {GIFT_BOX_TIERS.map((tier) => {
                  const active = tier.id === boxTierId;
                  return (
                    <label
                      key={tier.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-xl border cursor-pointer"
                      style={{
                        backgroundColor: active ? 'var(--surface-subtle)' : 'var(--canvas)',
                        borderColor: active ? 'var(--accent)' : 'var(--border-hairline)',
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="giftBoxTier"
                          checked={active}
                          onChange={() => setBoxTierId(tier.id)}
                          className="mt-1"
                          style={{ accentColor: 'var(--accent)' }}
                        />
                        <div>
                          <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                            {tier.name}
                          </p>
                          <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                            {tier.desc}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-xs font-mono-num font-semibold shrink-0"
                        style={{ color: 'var(--ink)' }}
                      >
                        {tier.priceXof === 0 ? 'Offert' : formatXof(tier.priceXof)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2.5" style={{ color: 'var(--ink)' }}>
                  3. Papier de soie &amp; carte imprimée
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {TISSUE_COLORS.map((tc) => {
                    const active = tissueColor === tc.name;
                    return (
                      <button
                        key={tc.name}
                        type="button"
                        onClick={() => setTissueColor(tc.name)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border cursor-pointer"
                        style={{
                          backgroundColor: active ? 'var(--surface-subtle)' : 'var(--canvas)',
                          borderColor: active ? 'var(--accent)' : 'var(--border-hairline)',
                          color: 'var(--ink)',
                        }}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/15"
                          style={{ backgroundColor: tc.hex }}
                        />
                        <span>{tc.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                  Prénom / Nom du destinataire
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Ex. Maman Chérie / Mariam"
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                  Message imprimé sur la carte LouLou
                </label>
                <textarea
                  rows={2}
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Joyeuse fête ! Profite de ce coffret préparé avec soin..."
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div
            className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <div>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                Total du coffret ({selectedProducts.length} articles + {boxTier.name})
              </p>
              <p className="text-2xl font-semibold font-mono-num" style={{ color: 'var(--ink)' }}>
                {formatXof(totalBoxXof)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium rounded-lg cursor-pointer"
                style={{ backgroundColor: 'var(--surface-subtle)', color: 'var(--ink)' }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={selectedProducts.length < 2}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg disabled:opacity-45 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Ajouter mon coffret au panier</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
