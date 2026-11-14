import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileDown,
  Gift,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  Tag,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order, PaymentMethod, PromoCode } from '../types/store';
import {
  ABIDJAN_COMMUNES,
  INTERIOR_CITIES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  buildWhatsAppUrl,
  calculateEarnedPoints,
  calculateMaxRedeemablePoints,
  formatXof,
} from '../utils/formatters';
import { downloadCustomerReceiptPdf } from '../utils/pdfGenerator';
import { ProductImage } from './ProductImage';

interface CartCheckoutDrawerProps {
  open: boolean;
  onClose: () => void;
  onViewOrders: () => void;
}

interface PaymentInitResult {
  provider: string;
  mode: string;
  reference: string;
  checkoutUrl: string | null;
  instructions: string;
}

export const CartCheckoutDrawer: React.FC<CartCheckoutDrawerProps> = ({
  open,
  onClose,
  onViewOrders,
}) => {
  const {
    user,
    signInWithGoogle,
    cart,
    cartSubtotalXof,
    updateCartQuantity,
    removeFromCart,
    settings,
    orders,
    loyaltyAccount,
    capturedReferralCode,
    validatePromoCode,
    verifyOrderPayment,
    placeOrder,
    pushToast,
  } = useStore();

  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState('+225 ');
  const [city, setCity] = useState('Abidjan');
  const [commune, setCommune] = useState('Cocody');
  const [addressDetails, setAddressDetails] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wave');
  const [notes, setNotes] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  // Promo & Referral
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [referralInput, setReferralInput] = useState('');

  // Post-order Online Payment Verification
  const [paymentInit, setPaymentInit] = useState<PaymentInitResult | null>(null);
  const [paymentInitLoading, setPaymentInitLoading] = useState(false);
  const [txReferenceInput, setTxReferenceInput] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  useEffect(() => {
    if (capturedReferralCode && !referralInput) {
      setReferralInput(capturedReferralCode);
    }
  }, [capturedReferralCode, referralInput]);

  useEffect(() => {
    if (!confirmedOrder || confirmedOrder.paymentMethod === 'cash_on_delivery') {
      setPaymentInit(null);
      return;
    }
    let cancelled = false;
    setPaymentInitLoading(true);
    fetch('/api/payments/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: confirmedOrder.id,
        orderNumber: confirmedOrder.orderNumber,
        amountXof: confirmedOrder.totalXof,
        customerEmail: confirmedOrder.customerEmail,
        customerPhone: confirmedOrder.customerPhone,
        paymentMethod: confirmedOrder.paymentMethod,
      }),
    })
      .then((r) => r.json())
      .then((data: PaymentInitResult) => {
        if (!cancelled) {
          setPaymentInit(data);
          setTxReferenceInput(data.reference || '');
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPaymentInitLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [confirmedOrder]);

  if (!open) return null;

  const discountPercent = settings.festiveDiscountPercent || 0;
  const discountXof = Math.round((cartSubtotalXof * discountPercent) / 100);
  const afterFestiveDiscount = Math.max(0, cartSubtotalXof - discountXof);

  const promoDiscountXof = appliedPromo
    ? appliedPromo.discountType === 'percent'
      ? Math.round((afterFestiveDiscount * appliedPromo.discountValue) / 100)
      : Math.min(afterFestiveDiscount, appliedPromo.discountValue)
    : 0;

  const afterPromoDiscount = Math.max(0, afterFestiveDiscount - promoDiscountXof);

  const currentBalance = loyaltyAccount?.pointsBalance || 0;
  const maxRedeemablePts = user
    ? calculateMaxRedeemablePoints(currentBalance, afterPromoDiscount, settings)
    : 0;
  const effectiveRedeemedPts =
    pointsToRedeem >= (settings.loyaltyMinRedeemPoints || 100) &&
    pointsToRedeem <= maxRedeemablePts
      ? pointsToRedeem
      : 0;
  const pointsDiscountXof = effectiveRedeemedPts * (settings.loyaltyPointValueXof || 25);

  const netMerchandiseXof = Math.max(0, afterPromoDiscount - pointsDiscountXof);
  const estimatedEarnedPts = calculateEarnedPoints(netMerchandiseXof, settings);

  const baseDelivery =
    city === 'Abidjan'
      ? settings.standardDeliveryFeeXof
      : Math.max(settings.standardDeliveryFeeXof, 4000);
  const deliveryFeeXof =
    city === 'Abidjan' && netMerchandiseXof >= settings.freeDeliveryThresholdXof
      ? 0
      : cart.length === 0
      ? 0
      : baseDelivery;
  const totalXof = netMerchandiseXof + deliveryFeeXof;
  const remainingForFreeAbidjan = Math.max(
    0,
    settings.freeDeliveryThresholdXof - netMerchandiseXof
  );

  const handleApplyPromo = async () => {
    setPromoError(null);
    if (!promoInput.trim()) return;
    try {
      const valid = await validatePromoCode(promoInput, afterFestiveDiscount);
      setAppliedPromo(valid);
      pushToast(`Code promo ${valid.code} appliqué.`, 'success');
    } catch (err) {
      setAppliedPromo(null);
      setPromoError(err instanceof Error ? err.message : 'Code promo invalide.');
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!user) {
      const signed = await signInWithGoogle();
      if (!signed) return;
      if (!customerName.trim() && signed.displayName) {
        setCustomerName(signed.displayName);
      }
      return;
    }

    if (customerName.trim().length < 2) {
      setErrorMsg('Veuillez saisir votre nom complet.');
      return;
    }
    if (customerPhone.trim().length < 8) {
      setErrorMsg('Veuillez saisir un numéro de téléphone valide en Côte d’Ivoire.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await placeOrder({
        customerName,
        customerPhone,
        city,
        commune: city === 'Abidjan' ? commune : city,
        addressDetails,
        paymentMethod,
        notes,
        pointsToRedeem: effectiveRedeemedPts,
        promoCode: appliedPromo ? appliedPromo.code : null,
        promoDiscountXof,
        referralCodeUsed: orders.length === 0 ? referralInput.trim().toUpperCase() || null : null,
      });
      setConfirmedOrder(order);
      setPointsToRedeem(0);
      setAppliedPromo(null);
      setPromoInput('');
      setStep('success');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erreur lors de l’envoi de la commande.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedOrder || txReferenceInput.trim().length < 6) {
      pushToast('Saisissez la référence de transaction (6 caractères min.).', 'error');
      return;
    }
    setVerifyingPayment(true);
    try {
      const res = await verifyOrderPayment(
        confirmedOrder.id,
        txReferenceInput,
        paymentInit?.provider || confirmedOrder.paymentMethod
      );
      setConfirmedOrder({
        ...confirmedOrder,
        paymentStatus: res.status,
        paymentReference: txReferenceInput.trim(),
      });
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : 'Impossible de vérifier le paiement.',
        'error'
      );
    } finally {
      setVerifyingPayment(false);
    }
  };

  const resetAndClose = () => {
    setStep('cart');
    setConfirmedOrder(null);
    setErrorMsg(null);
    onClose();
  };

  const sellerWhatsApp = settings.whatsappPhone || settings.storePhone;
  const whatsappConfirmText = confirmedOrder
    ? `Bonjour Chez LouLou ! Je viens de passer la commande ${confirmedOrder.orderNumber} (${formatXof(
        confirmedOrder.totalXof
      )}) à ${confirmedOrder.commune}, ${confirmedOrder.city}. Mode : ${
        PAYMENT_METHOD_LABELS[confirmedOrder.paymentMethod]
      }.`
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Panier et commande"
      onClick={resetAndClose}
    >
      <div
        className="w-full max-w-lg h-full flex flex-col border-l shadow-2xl"
        style={{
          backgroundColor: 'var(--canvas)',
          borderColor: 'var(--border-hairline)',
          color: 'var(--ink)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--ink)' }}>
            {step === 'cart'
              ? 'Votre Panier'
              : step === 'checkout'
              ? 'Livraison, Promo & Fidélité'
              : 'Commande enregistrée'}
          </h2>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="Fermer le panier"
            className="p-2 rounded-lg cursor-pointer"
            style={{ color: 'var(--ink-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'success' && confirmedOrder ? (
            <div className="space-y-4">
              <div
                className="rounded-xl border p-6 text-center space-y-4"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <CheckCircle2 className="w-12 h-12 text-[#16A34A] mx-auto" />
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>
                    Merci de votre confiance chez Chez LouLou
                  </p>
                  <h3 className="font-display text-3xl font-semibold" style={{ color: 'var(--ink)' }}>
                    Commande {confirmedOrder.orderNumber}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                  Montant total :{' '}
                  <strong className="font-mono-num" style={{ color: 'var(--ink)' }}>
                    {formatXof(confirmedOrder.totalXof)}
                  </strong>
                  . Gain prévu :{' '}
                  <strong className="font-mono-num" style={{ color: 'var(--ink)' }}>
                    +{confirmedOrder.pointsEarned} Points LouLou
                  </strong>
                  .
                </p>

                <div
                  className="pt-4 border-t text-left text-xs space-y-1.5"
                  style={{
                    borderColor: 'var(--border-hairline)',
                    color: 'var(--ink-muted)',
                  }}
                >
                  <p>
                    Livraison :{' '}
                    <span style={{ color: 'var(--ink)' }}>
                      {confirmedOrder.city} · {confirmedOrder.commune}
                    </span>
                  </p>
                  <p>
                    Mode :{' '}
                    <span style={{ color: 'var(--ink)' }}>
                      {PAYMENT_METHOD_LABELS[confirmedOrder.paymentMethod]}
                    </span>
                  </p>
                  <p>
                    État paiement :{' '}
                    <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                      {PAYMENT_STATUS_LABELS[confirmedOrder.paymentStatus || 'unpaid']}
                    </span>
                  </p>
                </div>

                {/* PDF Receipt + WhatsApp Direct Confirm */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => downloadCustomerReceiptPdf(confirmedOrder, settings)}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-medium rounded-lg border cursor-pointer"
                    style={{
                      backgroundColor: 'var(--canvas)',
                      borderColor: 'var(--border-hairline)',
                      color: 'var(--ink)',
                    }}
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Télécharger Reçu PDF</span>
                  </button>

                  <a
                    href={buildWhatsAppUrl(sellerWhatsApp, whatsappConfirmText)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-medium rounded-lg bg-[#16A34A] text-white"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Notifier sur WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Verified Online Mobile Money Payment Module */}
              {confirmedOrder.paymentMethod !== 'cash_on_delivery' &&
                confirmedOrder.paymentStatus !== 'paid' && (
                  <div
                    className="rounded-xl border p-5 space-y-3"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border-hairline)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                        Vérification Paiement Mobile Money / En ligne
                      </h4>
                    </div>

                    {paymentInitLoading ? (
                      <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                        Initialisation du lien sécurisé...
                      </p>
                    ) : (
                      <>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                          {paymentInit?.instructions ||
                            `Réglez ${formatXof(
                              confirmedOrder.totalXof
                            )} puis saisissez l'ID de transaction pour validation avant préparation.`}
                        </p>

                        {paymentInit?.checkoutUrl && (
                          <a
                            href={paymentInit.checkoutUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg"
                            style={{
                              backgroundColor: 'var(--accent)',
                              color: 'var(--accent-contrast)',
                            }}
                          >
                            <span>Ouvrir la page de paiement ({paymentInit.provider})</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <form onSubmit={handleVerifyPayment} className="space-y-2.5 pt-1">
                          <label className="block text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                            ID / Référence de transaction (Wave, OM, MTN ou Passerelle) :
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={txReferenceInput}
                              onChange={(e) => setTxReferenceInput(e.target.value)}
                              placeholder="Ex. T241113.1842.A9201"
                              className="flex-1 px-3 py-2 text-xs font-mono-num border rounded-lg"
                              style={{
                                backgroundColor: 'var(--canvas)',
                                borderColor: 'var(--border-hairline)',
                                color: 'var(--ink)',
                              }}
                            />
                            <button
                              type="submit"
                              disabled={verifyingPayment}
                              className="px-3.5 py-2 text-xs font-medium rounded-lg disabled:opacity-50 cursor-pointer"
                              style={{
                                backgroundColor: 'var(--accent)',
                                color: 'var(--accent-contrast)',
                              }}
                            >
                              {verifyingPayment ? 'Vérif...' : 'Vérifier'}
                            </button>
                          </div>
                        </form>
                      </>
                    )}
                  </div>
                )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetAndClose();
                    onViewOrders();
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-contrast)',
                  }}
                >
                  Suivre ma commande &amp; points
                </button>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface-subtle)',
                    color: 'var(--ink)',
                  }}
                >
                  Continuer mes achats
                </button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <p className="font-display text-2xl mb-2" style={{ color: 'var(--ink)' }}>
                Votre panier est vide
              </p>
              <p className="text-sm max-w-xs mb-6" style={{ color: 'var(--ink-muted)' }}>
                Parcourez nos collections Femme, Homme, Enfants, Jeunes et Coffrets Cadeaux pour cumuler des Points LouLou.
              </p>
              <button
                type="button"
                onClick={resetAndClose}
                className="px-5 py-2.5 text-sm font-medium rounded-lg cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                }}
              >
                Découvrir le catalogue
              </button>
            </div>
          ) : step === 'cart' ? (
            <div className="space-y-4">
              <div
                className="rounded-xl border p-4 space-y-1.5"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <p className="text-xs tabular-nums" style={{ color: 'var(--ink-muted)' }}>
                  {remainingForFreeAbidjan === 0
                    ? 'Livraison offerte à Abidjan débloquée.'
                    : `Ajoutez ${formatXof(remainingForFreeAbidjan)} pour la livraison offerte à Abidjan.`}
                </p>
                <p className="text-xs font-medium" style={{ color: 'var(--ink)' }}>
                  Cette commande vous rapportera +{estimatedEarnedPts} Points LouLou.
                </p>
              </div>

              {cart.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}-${item.color || ''}`}
                  className="rounded-xl border p-3.5 flex gap-4"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  <div
                    className="w-20 h-20 rounded-lg overflow-hidden shrink-0"
                    style={{ backgroundColor: 'var(--surface-subtle)' }}
                  >
                    <ProductImage src={item.product.imageUrl} alt={item.product.title} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4
                          className="text-sm font-semibold truncate"
                          style={{ color: 'var(--ink)' }}
                        >
                          {item.product.title}
                        </h4>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                          Taille : {item.size}
                          {item.color ? ` · Coloris : ${item.color}` : ''}
                        </p>
                        {item.customGiftDetails && (
                          <div className="mt-1.5 text-[11px] space-y-0.5" style={{ color: 'var(--ink-muted)' }}>
                            <p className="inline-flex items-center gap-1 font-medium" style={{ color: 'var(--ink)' }}>
                              <Gift className="w-3 h-3" />
                              <span>
                                {item.customGiftDetails.boxName} · Pour {item.customGiftDetails.recipientName}
                              </span>
                            </p>
                            <p className="truncate">
                              Contenu : {item.customGiftDetails.includedItems.map((i) => i.title).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id, item.size, item.color)}
                        aria-label={`Supprimer ${item.product.title}`}
                        className="p-1 hover:text-[#DC2626] cursor-pointer"
                        style={{ color: 'var(--ink-muted)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div
                        className="inline-flex items-center border rounded-md"
                        style={{
                          backgroundColor: 'var(--surface-subtle)',
                          borderColor: 'var(--border-hairline)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(
                              item.product.id,
                              item.size,
                              item.quantity - 1,
                              item.color
                            )
                          }
                          className="p-1.5 cursor-pointer"
                          aria-label="Diminuer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-mono-num">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(
                              item.product.id,
                              item.size,
                              item.quantity + 1,
                              item.color
                            )
                          }
                          className="p-1.5 cursor-pointer"
                          aria-label="Augmenter"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span
                        className="text-sm font-semibold font-mono-num"
                        style={{ color: 'var(--ink)' }}
                      >
                        {formatXof(item.product.priceXof * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
              {!user && (
                <div
                  className="rounded-xl border p-4 space-y-3"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--ink)' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                        Connexion requise pour finaliser
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                        Connectez-vous avec Google pour recevoir vos 50 points de bienvenue, utiliser un code parrain et suivre votre commande.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const signed = await signInWithGoogle();
                      if (signed?.displayName && !customerName) {
                        setCustomerName(signed.displayName);
                      }
                    }}
                    className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg cursor-pointer"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-contrast)',
                    }}
                  >
                    Se connecter avec Google
                  </button>
                </div>
              )}

              {/* Promo Code & Referral Code */}
              <div
                className="rounded-xl border p-4 space-y-3"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                  <Tag className="w-4 h-4" />
                  <span>Code promo saisonnier / influenceur</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Ex. LOULOU10"
                    className="flex-1 px-3 py-2 text-xs font-mono-num uppercase border rounded-lg"
                    style={{
                      backgroundColor: 'var(--surface-subtle)',
                      borderColor: 'var(--border-hairline)',
                      color: 'var(--ink)',
                    }}
                  />
                  {appliedPromo ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedPromo(null);
                        setPromoInput('');
                        setPromoError(null);
                      }}
                      className="px-3 py-2 text-xs font-medium rounded-lg border cursor-pointer"
                      style={{
                        borderColor: 'var(--border-hairline)',
                        color: 'var(--ink)',
                      }}
                    >
                      Retirer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-3.5 py-2 text-xs font-medium rounded-lg cursor-pointer"
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-contrast)',
                      }}
                    >
                      Appliquer
                    </button>
                  )}
                </div>

                {appliedPromo && (
                  <p className="text-xs text-[#16A34A] font-medium">
                    Code {appliedPromo.code} actif ({appliedPromo.partnerName}) : -{formatXof(promoDiscountXof)}
                  </p>
                )}
                {promoError && <p className="text-xs text-[#DC2626]">{promoError}</p>}

                {orders.length === 0 && (
                  <div className="pt-2 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                    <label
                      className="flex items-center gap-1.5 text-xs font-semibold mb-1.5"
                      style={{ color: 'var(--ink)' }}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Code de parrainage (+100 Points LouLou offerts sur 1re commande)</span>
                    </label>
                    <input
                      type="text"
                      value={referralInput}
                      onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                      placeholder="Ex. LL-AMINA4F9A (optionnel)"
                      className="w-full px-3 py-2 text-xs font-mono-num uppercase border rounded-lg"
                      style={{
                        backgroundColor: 'var(--surface-subtle)',
                        borderColor: 'var(--border-hairline)',
                        color: 'var(--ink)',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Loyalty Points Redemption Panel */}
              {user && (
                <div
                  className="rounded-xl border p-4 space-y-3"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: 'var(--ink)' }}
                    >
                      <Award className="w-4 h-4" />
                      <span>Points Fidélité LouLou</span>
                    </span>
                    <span className="text-xs font-mono-num" style={{ color: 'var(--ink)' }}>
                      Solde : {currentBalance} pts ({formatXof(currentBalance * settings.loyaltyPointValueXof)})
                    </span>
                  </div>

                  {maxRedeemablePts >= (settings.loyaltyMinRedeemPoints || 100) ? (
                    <div className="space-y-2.5">
                      <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                        Vous pouvez utiliser entre {settings.loyaltyMinRedeemPoints} et{' '}
                        {maxRedeemablePts} pts (max {settings.loyaltyMaxDiscountPercent}% de la commande).
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setPointsToRedeem(0)}
                          className="px-2.5 py-1 text-xs rounded-md border cursor-pointer"
                          style={
                            effectiveRedeemedPts === 0
                              ? {
                                  backgroundColor: 'var(--accent)',
                                  color: 'var(--accent-contrast)',
                                  borderColor: 'var(--accent)',
                                }
                              : { borderColor: 'var(--border-hairline)', color: 'var(--ink)' }
                          }
                        >
                          Ne pas utiliser
                        </button>
                        <button
                          type="button"
                          onClick={() => setPointsToRedeem(settings.loyaltyMinRedeemPoints)}
                          className="px-2.5 py-1 text-xs rounded-md border cursor-pointer"
                          style={
                            effectiveRedeemedPts === settings.loyaltyMinRedeemPoints
                              ? {
                                  backgroundColor: 'var(--accent)',
                                  color: 'var(--accent-contrast)',
                                  borderColor: 'var(--accent)',
                                }
                              : { borderColor: 'var(--border-hairline)', color: 'var(--ink)' }
                          }
                        >
                          {settings.loyaltyMinRedeemPoints} pts (-
                          {formatXof(
                            settings.loyaltyMinRedeemPoints * settings.loyaltyPointValueXof
                          )}
                          )
                        </button>
                        {maxRedeemablePts > settings.loyaltyMinRedeemPoints && (
                          <button
                            type="button"
                            onClick={() => setPointsToRedeem(maxRedeemablePts)}
                            className="px-2.5 py-1 text-xs rounded-md border cursor-pointer"
                            style={
                              effectiveRedeemedPts === maxRedeemablePts
                                ? {
                                    backgroundColor: 'var(--accent)',
                                    color: 'var(--accent-contrast)',
                                    borderColor: 'var(--accent)',
                                  }
                                : { borderColor: 'var(--border-hairline)', color: 'var(--ink)' }
                            }
                          >
                            Max : {maxRedeemablePts} pts (-
                            {formatXof(maxRedeemablePts * settings.loyaltyPointValueXof)})
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                      {currentBalance < settings.loyaltyMinRedeemPoints
                        ? `Cumulez encore ${
                            settings.loyaltyMinRedeemPoints - currentBalance
                          } pts pour débloquer votre première remise (minimum ${
                            settings.loyaltyMinRedeemPoints
                          } pts = ${formatXof(
                            settings.loyaltyMinRedeemPoints * settings.loyaltyPointValueXof
                          )}).`
                        : `Commande minimum de ${formatXof(
                            settings.loyaltyMinOrderXof
                          )} requise pour utiliser vos points.`}
                    </p>
                  )}
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-lg bg-[#FEE2E2] text-[#991B1B] text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div
                className="rounded-xl border p-4 space-y-3"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                  Coordonnées client
                </p>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>
                    Nom complet
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex. Aminata Koné"
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                    style={{
                      backgroundColor: 'var(--surface-subtle)',
                      borderColor: 'var(--border-hairline)',
                      color: 'var(--ink)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>
                    Téléphone (WhatsApp / Appel CI)
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+225 07 XX XX XX XX"
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                    style={{
                      backgroundColor: 'var(--surface-subtle)',
                      borderColor: 'var(--border-hairline)',
                      color: 'var(--ink)',
                    }}
                  />
                </div>
              </div>

              <div
                className="rounded-xl border p-4 space-y-3"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                  Adresse de livraison
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>
                      Ville
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                      style={{
                        backgroundColor: 'var(--surface-subtle)',
                        borderColor: 'var(--border-hairline)',
                        color: 'var(--ink)',
                      }}
                    >
                      {INTERIOR_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {city === 'Abidjan' && (
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>
                        Commune
                      </label>
                      <select
                        value={commune}
                        onChange={(e) => setCommune(e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-lg"
                        style={{
                          backgroundColor: 'var(--surface-subtle)',
                          borderColor: 'var(--border-hairline)',
                          color: 'var(--ink)',
                        }}
                      >
                        {ABIDJAN_COMMUNES.map((com) => (
                          <option key={com} value={com}>
                            {com}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>
                    Quartier / Repère précis
                  </label>
                  <input
                    type="text"
                    required
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    placeholder="Ex. Riviera Palmeraie, près du rond-point"
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                    style={{
                      backgroundColor: 'var(--surface-subtle)',
                      borderColor: 'var(--border-hairline)',
                      color: 'var(--ink)',
                    }}
                  />
                </div>
              </div>

              <div
                className="rounded-xl border p-4 space-y-3"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                  Mode de paiement
                </p>
                <div className="space-y-2">
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                    <label
                      key={method}
                      className="flex items-center gap-3 p-2.5 rounded-lg border text-sm cursor-pointer"
                      style={{
                        borderColor:
                          paymentMethod === method
                            ? 'var(--accent)'
                            : 'var(--border-hairline)',
                        backgroundColor:
                          paymentMethod === method
                            ? 'var(--surface-subtle)'
                            : 'transparent',
                        color: 'var(--ink)',
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      <span>{PAYMENT_METHOD_LABELS[method]}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>
                    Mot cadeau ou instruction (optionnel)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Message sur carte cadeau, horaire souhaité..."
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                    style={{
                      backgroundColor: 'var(--surface-subtle)',
                      borderColor: 'var(--border-hairline)',
                      color: 'var(--ink)',
                    }}
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Totals & CTA */}
        {cart.length > 0 && step !== 'success' && (
          <div
            className="p-6 border-t space-y-3"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between" style={{ color: 'var(--ink-muted)' }}>
                <span>Sous-total</span>
                <span className="font-mono-num">{formatXof(cartSubtotalXof)}</span>
              </div>
              {discountXof > 0 && (
                <div className="flex justify-between text-[#16A34A]">
                  <span>Remise événement ({discountPercent}%)</span>
                  <span className="font-mono-num">-{formatXof(discountXof)}</span>
                </div>
              )}
              {promoDiscountXof > 0 && appliedPromo && (
                <div className="flex justify-between text-[#16A34A]">
                  <span>Code promo ({appliedPromo.code})</span>
                  <span className="font-mono-num">-{formatXof(promoDiscountXof)}</span>
                </div>
              )}
              {pointsDiscountXof > 0 && (
                <div className="flex justify-between text-[#16A34A]">
                  <span>Points LouLou ({effectiveRedeemedPts} pts)</span>
                  <span className="font-mono-num">-{formatXof(pointsDiscountXof)}</span>
                </div>
              )}
              <div className="flex justify-between" style={{ color: 'var(--ink-muted)' }}>
                <span>Livraison ({city})</span>
                <span className="font-mono-num">
                  {deliveryFeeXof === 0 ? 'Offerte' : formatXof(deliveryFeeXof)}
                </span>
              </div>
              <div
                className="flex justify-between text-base font-semibold pt-2 border-t"
                style={{
                  color: 'var(--ink)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <span>Total à régler</span>
                <span className="font-mono-num">{formatXof(totalXof)}</span>
              </div>
              <p className="text-[11px] text-right font-mono-num" style={{ color: 'var(--ink-muted)' }}>
                Gain fidélité sur cette commande : +{estimatedEarnedPts} pts LouLou
              </p>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => {
                  if (user?.displayName && !customerName) {
                    setCustomerName(user.displayName);
                  }
                  setStep('checkout');
                }}
                className="w-full py-3 text-sm font-medium rounded-lg cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                }}
              >
                Passer la commande
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="px-4 py-3 text-sm font-medium rounded-lg cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface-subtle)',
                    color: 'var(--ink)',
                  }}
                >
                  Retour
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={submitting}
                  className="flex-1 py-3 text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-contrast)',
                  }}
                >
                  {submitting
                    ? 'Enregistrement...'
                    : user
                    ? 'Confirmer la commande'
                    : 'Connexion Google & Confirmer'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
