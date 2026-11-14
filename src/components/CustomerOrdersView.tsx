import React, { useMemo, useState } from 'react';
import {
  Award,
  Check,
  Copy,
  CreditCard,
  FileDown,
  Gift,
  PackageCheck,
  ShieldCheck,
  Star,
  UserPlus,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus } from '../types/store';
import {
  LOYALTY_TX_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDateTimeFr,
  formatXof,
  getLoyaltyTier,
} from '../utils/formatters';
import { downloadCustomerReceiptPdf } from '../utils/pdfGenerator';
import { ProductImage } from './ProductImage';

const TIMELINE_STEPS: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'delivering',
  'delivered',
];

export const CustomerOrdersView: React.FC<{ onBackToStore: () => void }> = ({
  onBackToStore,
}) => {
  const {
    user,
    signInWithGoogle,
    orders,
    ordersLoading,
    cancelCustomerOrder,
    verifyOrderPayment,
    loyaltyAccount,
    loyaltyTransactions,
    myReferral,
    settings,
    pushToast,
  } = useStore();

  const [copiedRef, setCopiedRef] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [refInput, setRefInput] = useState('');
  const [verifying, setVerifying] = useState(false);

  const pendingPoints = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'pending' && !o.pointsCredited)
        .reduce((s, o) => s + (o.pointsEarned || 0), 0),
    [orders]
  );

  if (!user) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div
          className="rounded-2xl border p-8 sm:p-12 text-center space-y-4"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <ShieldCheck
            className="w-10 h-10 mx-auto"
            style={{ color: 'var(--ink)' }}
            strokeWidth={1.5}
          />
          <h1 className="font-display text-3xl font-semibold" style={{ color: 'var(--ink)' }}>
            Programme Fidélité, Parrainage &amp; Commandes
          </h1>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--ink-muted)' }}>
            Connectez-vous avec Google pour recevoir vos <strong>50 Points LouLou offerts</strong>, obtenir votre code parrain (+100 pts par proche invité) et suivre vos livraisons en Côte d’Ivoire.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={signInWithGoogle}
              className="px-5 py-2.5 text-sm font-medium rounded-lg cursor-pointer"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)',
              }}
            >
              Se connecter avec Google
            </button>
            <button
              type="button"
              onClick={onBackToStore}
              className="px-5 py-2.5 text-sm font-medium rounded-lg cursor-pointer"
              style={{
                backgroundColor: 'var(--surface-subtle)',
                color: 'var(--ink)',
              }}
            >
              Retour à la boutique
            </button>
          </div>
        </div>
      </section>
    );
  }

  const balance = loyaltyAccount?.pointsBalance ?? 0;
  const totalEarned = loyaltyAccount?.totalEarned ?? 0;
  const tier = getLoyaltyTier(totalEarned);
  const progressPct = tier.nextThreshold
    ? Math.min(100, Math.round((totalEarned / tier.nextThreshold) * 100))
    : 100;

  const referralCode = loyaltyAccount?.referralCode || myReferral?.code || '';
  const referralShareUrl =
    typeof window !== 'undefined' && referralCode
      ? `${window.location.origin}/?parrain=${referralCode}`
      : '';

  const handleCopyReferral = () => {
    if (!referralShareUrl) return;
    navigator.clipboard?.writeText(referralShareUrl);
    setCopiedRef(true);
    pushToast('Lien de parrainage copié !', 'success');
    window.setTimeout(() => setCopiedRef(false), 2500);
  };

  const handleVerifyInlinePayment = async (e: React.FormEvent, order: Order) => {
    e.preventDefault();
    if (refInput.trim().length < 6) {
      pushToast('Saisissez une référence de transaction valide (6 car. min).', 'error');
      return;
    }
    setVerifying(true);
    try {
      await verifyOrderPayment(order.id, refInput, order.paymentMethod);
      setPayingOrderId(null);
      setRefInput('');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Vérification impossible.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--ink-muted)' }}>
            Compte client · {user.email}
          </p>
          <h1
            className="font-display text-3xl sm:text-4xl font-semibold"
            style={{ color: 'var(--ink)' }}
          >
            Fidélité, Parrainage &amp; Commandes
          </h1>
        </div>
        <button
          type="button"
          onClick={onBackToStore}
          className="px-4 py-2 text-sm font-medium border rounded-lg cursor-pointer"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-hairline)',
            color: 'var(--ink)',
          }}
        >
          Retour au catalogue
        </button>
      </div>

      {/* Loyalty Card & Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className="lg:col-span-7 rounded-2xl border p-6 space-y-5"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--ink-muted)' }}>
                Carte Membre Chez LouLou · {tier.name}
              </p>
              <p
                className="text-3xl sm:text-4xl font-semibold font-mono-num"
                style={{ color: 'var(--ink)' }}
              >
                {balance} pts
              </p>
              <p className="text-xs mt-1 font-mono-num" style={{ color: 'var(--ink-muted)' }}>
                Valeur disponible : {formatXof(balance * settings.loyaltyPointValueXof)}
                {pendingPoints > 0 ? ` · +${pendingPoints} pts en attente de validation` : ''}
              </p>
            </div>
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)',
              }}
            >
              <Award className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs" style={{ color: 'var(--ink-muted)' }}>
              <span>Cumul historique : {totalEarned} pts</span>
              {tier.nextTierName && tier.nextThreshold ? (
                <span>
                  Prochain palier ({tier.nextTierName}) : {tier.nextThreshold} pts
                </span>
              ) : (
                <span>Palier maximum atteint</span>
              )}
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--surface-subtle)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: 'var(--accent)',
                }}
              />
            </div>
          </div>

          <div
            className="pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
            style={{
              borderColor: 'var(--border-hairline)',
              color: 'var(--ink-muted)',
            }}
          >
            <div>
              <p className="font-semibold" style={{ color: 'var(--ink)' }}>
                Taux de gain
              </p>
              <p>1 pt par {formatXof(settings.loyaltyEarnStepXof)} dépensés</p>
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--ink)' }}>
                Conversion
              </p>
              <p>1 pt = {formatXof(settings.loyaltyPointValueXof)} de remise</p>
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--ink)' }}>
                Conditions d’usage
              </p>
              <p>
                Min {settings.loyaltyMinRedeemPoints} pts · Cmd ≥{' '}
                {formatXof(settings.loyaltyMinOrderXof)} · Max {settings.loyaltyMaxDiscountPercent}%
              </p>
            </div>
          </div>
        </div>

        {/* Loyalty Ledger */}
        <div
          className="lg:col-span-5 rounded-2xl border p-6 flex flex-col"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--ink)' }}>
            Historique de vos points
          </h2>
          {loyaltyTransactions.length === 0 ? (
            <p className="text-xs py-6" style={{ color: 'var(--ink-muted)' }}>
              Vos mouvements de points apparaîtront ici dès votre première commande.
            </p>
          ) : (
            <div
              className="divide-y overflow-y-auto max-h-56 pr-1"
              style={{ borderColor: 'var(--border-hairline)' }}
            >
              {loyaltyTransactions.slice(0, 12).map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--ink)' }}>
                      {LOYALTY_TX_LABELS[tx.type]}
                    </p>
                    <p className="truncate" style={{ color: 'var(--ink-muted)' }}>
                      {tx.description} · {formatDateTimeFr(tx.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`font-mono-num font-semibold shrink-0 ${
                      tx.pointsDelta >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                    }`}
                  >
                    {tx.pointsDelta >= 0 ? `+${tx.pointsDelta}` : tx.pointsDelta} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Referral Program Card ("Inviter un proche") */}
      {referralCode && (
        <div
          className="rounded-2xl border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="space-y-2 max-w-xl">
            <p
              className="inline-flex items-center gap-2 text-xs font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              <UserPlus className="w-4 h-4" />
              <span>Programme Parrainage « Inviter un proche »</span>
            </p>
            <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--ink)' }}>
              +100 Points LouLou pour vous et +100 pts pour votre proche
            </h2>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
              Partagez votre code unique{' '}
              <strong className="font-mono-num" style={{ color: 'var(--ink)' }}>
                {referralCode}
              </strong>{' '}
              ou votre lien personnel. Dès que votre filleul passe sa première commande validée, vous recevez chacun{' '}
              <strong style={{ color: 'var(--ink)' }}>100 Points LouLou ({formatXof(100 * settings.loyaltyPointValueXof)})</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 shrink-0">
            <div className="flex items-center gap-4 text-xs font-mono-num" style={{ color: 'var(--ink-muted)' }}>
              <span>
                Filleuls validés :{' '}
                <strong style={{ color: 'var(--ink)' }}>{myReferral?.successfulCount ?? 0}</strong>
              </span>
              <span>
                Bonus gagnés :{' '}
                <strong style={{ color: 'var(--ink)' }}>{myReferral?.totalBonusPoints ?? 0} pts</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyReferral}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg cursor-pointer"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)',
              }}
            >
              {copiedRef ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>
                {copiedRef ? 'Lien copié !' : `Copier mon lien (${referralCode})`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--ink)' }}>
          Historique des commandes
        </h2>

        {ordersLoading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-44 rounded-xl border animate-pulse"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div
            className="rounded-xl border p-12 text-center space-y-4"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <PackageCheck
              className="w-10 h-10 mx-auto"
              style={{ color: 'var(--ink-muted)' }}
              strokeWidth={1.5}
            />
            <p className="font-display text-2xl" style={{ color: 'var(--ink)' }}>
              Aucune commande pour le moment
            </p>
            <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
              Dès que vous validez un panier, son statut en direct, son reçu PDF et vos points gagnés s’afficheront ici.
            </p>
            <button
              type="button"
              onClick={onBackToStore}
              className="px-5 py-2.5 text-sm font-medium rounded-lg cursor-pointer"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)',
              }}
            >
              Parcourir la boutique
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const currentIdx = TIMELINE_STEPS.indexOf(order.status);
              const needsOnlineVerify =
                order.status === 'pending' &&
                order.paymentMethod !== 'cash_on_delivery' &&
                order.paymentStatus !== 'paid';

              return (
                <div
                  key={order.id}
                  className="rounded-xl border p-6 space-y-5"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  <div
                    className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b"
                    style={{ borderColor: 'var(--border-hairline)' }}
                  >
                    <div>
                      <div
                        className="flex flex-wrap items-center gap-2 text-xs mb-1"
                        style={{ color: 'var(--ink-muted)' }}
                      >
                        <span className="font-mono-num font-semibold" style={{ color: 'var(--ink)' }}>
                          {order.orderNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatDateTimeFr(order.createdAt)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium" style={{ color: 'var(--ink)' }}>
                          {PAYMENT_STATUS_LABELS[order.paymentStatus || 'unpaid']}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                        Livraison : {order.city}, {order.commune} ({order.addressDetails})
                      </p>
                      <p className="text-xs mt-1 font-mono-num" style={{ color: 'var(--ink-muted)' }}>
                        Fidélité : +{order.pointsEarned || 0} pts{' '}
                        {order.pointsCredited ? '(crédités)' : '(en attente de confirmation)'}
                        {order.promoCode
                          ? ` · Code ${order.promoCode} (-${formatXof(
                              order.promoDiscountXof || 0
                            )})`
                          : ''}
                        {order.pointsRedeemed > 0
                          ? ` · ${order.pointsRedeemed} pts utilisés (-${formatXof(
                              order.pointsDiscountXof
                            )})`
                          : ''}
                      </p>
                      {order.paymentReference && (
                        <p className="text-[11px] font-mono-num mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                          Réf. transaction : {order.paymentReference}
                        </p>
                      )}
                    </div>

                    <div className="text-right space-y-1.5">
                      <p
                        className="text-lg font-semibold font-mono-num"
                        style={{ color: 'var(--ink)' }}
                      >
                        {formatXof(order.totalXof)}
                      </p>
                      <p
                        className={`text-xs font-semibold ${
                          order.status === 'cancelled'
                            ? 'text-[#DC2626]'
                            : order.status === 'delivered'
                            ? 'text-[#16A34A]'
                            : ''
                        }`}
                        style={
                          order.status !== 'cancelled' && order.status !== 'delivered'
                            ? { color: 'var(--ink)' }
                            : undefined
                        }
                      >
                        Statut : {ORDER_STATUS_LABELS[order.status]}
                      </p>
                      <button
                        type="button"
                        onClick={() => downloadCustomerReceiptPdf(order, settings)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md border cursor-pointer"
                        style={{
                          backgroundColor: 'var(--canvas)',
                          borderColor: 'var(--border-hairline)',
                          color: 'var(--ink)',
                        }}
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Reçu PDF</span>
                      </button>
                    </div>
                  </div>

                  {order.status !== 'cancelled' && (
                    <div className="grid grid-cols-5 gap-2 text-center">
                      {TIMELINE_STEPS.map((st, idx) => {
                        const done = idx <= currentIdx;
                        return (
                          <div key={st} className="space-y-1.5">
                            <div
                              className="h-1.5 rounded-full transition-colors"
                              style={{
                                backgroundColor: done
                                  ? 'var(--accent)'
                                  : 'var(--surface-subtle)',
                              }}
                            />
                            <p
                              className="text-[11px] truncate"
                              style={{
                                color: done ? 'var(--ink)' : 'var(--ink-muted)',
                                fontWeight: done ? 600 : 400,
                              }}
                            >
                              {ORDER_STATUS_LABELS[st]}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                    {order.items.map((item, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-12 h-12 rounded-md overflow-hidden shrink-0"
                            style={{ backgroundColor: 'var(--surface-subtle)' }}
                          >
                            <ProductImage src={item.imageUrl} alt={item.title} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>
                              {item.title}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                              Taille {item.size}
                              {item.color ? ` · ${item.color}` : ''} · Qté {item.quantity}
                            </p>
                            {item.customGiftDetails && (
                              <p className="text-[11px] inline-flex items-center gap-1 mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                                <Gift className="w-3 h-3" />
                                <span>
                                  {item.customGiftDetails.boxName} · Pour {item.customGiftDetails.recipientName}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className="text-sm font-mono-num shrink-0"
                          style={{ color: 'var(--ink)' }}
                        >
                          {formatXof(item.priceXof * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Inline Payment Verification / Delivered Review Hint / Cancel */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    {order.status === 'delivered' ? (
                      <button
                        type="button"
                        onClick={onBackToStore}
                        className="inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-4 cursor-pointer"
                        style={{ color: 'var(--ink)' }}
                      >
                        <Star className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
                        <span>Laisser un avis vérifié (+photo) sur vos articles</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      {needsOnlineVerify && (
                        <button
                          type="button"
                          onClick={() => {
                            setPayingOrderId(payingOrderId === order.id ? null : order.id);
                            setRefInput(order.paymentReference || '');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: 'var(--accent-contrast)',
                          }}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>
                            {order.paymentReference ? 'Modifier réf. paiement' : 'Valider réf. Mobile Money'}
                          </span>
                        </button>
                      )}

                      {order.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => cancelCustomerOrder(order.id)}
                          className="text-xs font-medium text-[#DC2626] hover:underline cursor-pointer"
                        >
                          Annuler cette commande
                        </button>
                      )}
                    </div>
                  </div>

                  {payingOrderId === order.id && (
                    <form
                      onSubmit={(e) => handleVerifyInlinePayment(e, order)}
                      className="p-3 rounded-lg border flex flex-col sm:flex-row gap-2"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-hairline)',
                      }}
                    >
                      <input
                        type="text"
                        required
                        value={refInput}
                        onChange={(e) => setRefInput(e.target.value)}
                        placeholder="Saisissez l'ID de transaction Wave / Orange / MTN / Paystack..."
                        className="flex-1 px-3 py-2 text-xs font-mono-num border rounded-md"
                        style={{
                          backgroundColor: 'var(--surface)',
                          borderColor: 'var(--border-hairline)',
                          color: 'var(--ink)',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={verifying}
                        className="px-4 py-2 text-xs font-medium rounded-md disabled:opacity-50 cursor-pointer"
                        style={{
                          backgroundColor: 'var(--accent)',
                          color: 'var(--accent-contrast)',
                        }}
                      >
                        {verifying ? 'Vérification...' : 'Soumettre la référence'}
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
