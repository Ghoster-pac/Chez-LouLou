import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Camera,
  CheckCircle2,
  Heart,
  MessageSquare,
  Minus,
  Plus,
  Ruler,
  ShoppingBag,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types/store';
import {
  CATEGORY_LABELS,
  SIZE_GUIDES,
  calculateEarnedPoints,
  compressImageToDataUrl,
  formatDateFr,
  formatXof,
  resolveSizeGuideCategory,
} from '../utils/formatters';
import { ProductImage } from './ProductImage';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAskSeller: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAskSeller,
}) => {
  const {
    user,
    isAdmin,
    orders,
    reviews,
    submitVerifiedReview,
    deleteReview,
    addToCart,
    wishlistIds,
    toggleWishlist,
    activeSeason,
    settings,
    previewSeasonId,
    pushToast,
  } = useStore();

  const [selectedSize, setSelectedSize] = useState<string>('Unique');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Verified review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewPhoto, setReviewPhoto] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] || 'Unique');
      setSelectedColor(product.colors?.[0]?.name || null);
      setActivePhotoIndex(0);
      setShowSizeGuide(false);
      setQuantity(1);
      setRating(5);
      setComment('');
      setReviewPhoto(null);
    }
  }, [product]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const list = [product.imageUrl, ...(product.galleryUrls || [])].filter(Boolean);
    return Array.from(new Set(list));
  }, [product]);

  const productReviews = useMemo(() => {
    if (!product) return [];
    return reviews.filter((r) => r.productId === product.id);
  }, [reviews, product]);

  const eligibleDeliveredOrder = useMemo(() => {
    if (!product || !user) return null;
    return (
      orders.find(
        (o) =>
          o.customerId === user.uid &&
          o.status === 'delivered' &&
          o.items.some(
            (i) =>
              i.productId === product.id ||
              Boolean(i.customGiftDetails?.includedItems.some((sub) => sub.productId === product.id))
          )
      ) || null
    );
  }, [orders, product, user]);

  const alreadyReviewed = useMemo(() => {
    if (!user || !product) return false;
    return productReviews.some((r) => r.customerId === user.uid);
  }, [productReviews, user, product]);

  if (!product) return null;

  const isAvailable = product.available && product.stock > 0;
  const isFav = wishlistIds.includes(product.id);
  const effectiveDiscount =
    !previewSeasonId && settings.festiveDiscountPercent > 0
      ? settings.festiveDiscountPercent
      : activeSeason.suggestedDiscountPercent;

  const finalPrice =
    effectiveDiscount > 0
      ? Math.round((product.priceXof * (100 - effectiveDiscount)) / 100)
      : product.priceXof;
  const earnedPts = calculateEarnedPoints(finalPrice * quantity, settings);

  const guideCategory = resolveSizeGuideCategory(product.category, product.sizeGuideCategory);
  const sizeGuide = SIZE_GUIDES[guideCategory];

  const avgRating =
    productReviews.length > 0
      ? Math.round(
          (productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length) * 10
        ) / 10
      : null;

  const handleReviewPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataUrl(file, 720, 0.78);
      if (dataUrl.length > 340000) {
        pushToast('Photo trop lourde. Choisissez un cliché plus léger.', 'error');
        return;
      }
      setReviewPhoto(dataUrl);
    } catch {
      pushToast('Impossible de charger la photo.', 'error');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligibleDeliveredOrder) return;
    setSubmittingReview(true);
    try {
      await submitVerifiedReview({
        productId: product.id,
        orderId: eligibleDeliveredOrder.id,
        rating,
        comment,
        photoUrl: reviewPhoto,
      });
      setComment('');
      setReviewPhoto(null);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Erreur lors de la publication.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={product.title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-2xl border overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border-hairline)',
          color: 'var(--ink)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left Column: Multi-Photo Gallery */}
          <div
            className="md:col-span-6 p-4 flex flex-col gap-3"
            style={{ backgroundColor: 'var(--surface-subtle)' }}
          >
            <div
              className="aspect-[4/3] rounded-xl overflow-hidden border"
              style={{ borderColor: 'var(--border-hairline)' }}
            >
              <ProductImage
                src={gallery[activePhotoIndex] || product.imageUrl}
                alt={`${product.title} — vue ${activePhotoIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            {gallery.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {gallery.map((url, idx) => {
                  const active = idx === activePhotoIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePhotoIndex(idx)}
                      aria-label={`Voir photo ${idx + 1}`}
                      className="w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-opacity"
                      style={{
                        borderColor: active ? 'var(--accent)' : 'var(--border-hairline)',
                        opacity: active ? 1 : 0.7,
                      }}
                    >
                      <ProductImage src={url} alt={`Miniature ${idx + 1}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Info & Actions */}
          <div
            className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div
                  className="flex flex-wrap items-center gap-2 text-xs"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  <span>{CATEGORY_LABELS[product.category]}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium" style={{ color: 'var(--ink)' }}>
                    {isAvailable ? `Disponible (${product.stock} en stock)` : 'Rupture de stock'}
                  </span>
                  {avgRating !== null && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-mono-num" style={{ color: 'var(--ink)' }}>
                        <Star className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
                        {avgRating} ({productReviews.length} avis)
                      </span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer la fiche produit"
                  className="p-1.5 rounded-lg cursor-pointer"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2
                className="font-display text-3xl font-semibold leading-tight mb-3"
                style={{ color: 'var(--ink)' }}
              >
                {product.title}
              </h2>

              <div className="flex items-baseline gap-3 mb-2">
                <span
                  className="text-2xl font-semibold font-mono-num"
                  style={{ color: 'var(--ink)' }}
                >
                  {formatXof(finalPrice)}
                </span>
                {(effectiveDiscount > 0 || product.compareAtPriceXof) && (
                  <span
                    className="text-sm line-through font-mono-num"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    {formatXof(
                      effectiveDiscount > 0
                        ? product.priceXof
                        : product.compareAtPriceXof || 0
                    )}
                  </span>
                )}
              </div>

              <p
                className="inline-flex items-center gap-1.5 text-xs font-medium mb-4"
                style={{ color: 'var(--ink-muted)' }}
              >
                <Award className="w-3.5 h-3.5" />
                <span>
                  Rapporte <strong style={{ color: 'var(--ink)' }}>+{earnedPts} Points LouLou</strong> (= {formatXof(earnedPts * settings.loyaltyPointValueXof)} de remise future)
                </span>
              </p>

              <p
                className="text-sm leading-relaxed mb-5"
                style={{ color: 'var(--ink-muted)' }}
              >
                {product.description}
              </p>

              {/* Color Swatches */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ink)' }}>
                    Coloris : <span className="font-normal">{selectedColor}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((col) => {
                      const active = selectedColor === col.name;
                      return (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => setSelectedColor(col.name)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer"
                          style={{
                            borderColor: active ? 'var(--accent)' : 'var(--border-hairline)',
                            backgroundColor: active ? 'var(--surface-subtle)' : 'var(--surface)',
                            color: 'var(--ink)',
                          }}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span>{col.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sizes & Interactive Size Guide */}
              {product.sizes.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                      Taille / Format
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowSizeGuide((v) => !v)}
                      className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4 cursor-pointer"
                      style={{ color: 'var(--ink)' }}
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>{showSizeGuide ? 'Masquer le guide' : 'Guide des tailles'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => {
                      const active = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className="px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer"
                          style={
                            active
                              ? {
                                  backgroundColor: 'var(--accent)',
                                  color: 'var(--accent-contrast)',
                                  borderColor: 'var(--accent)',
                                }
                              : {
                                  backgroundColor: 'var(--surface)',
                                  color: 'var(--ink)',
                                  borderColor: 'var(--border-hairline)',
                                }
                          }
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>

                  {showSizeGuide && (
                    <div
                      className="mt-3 p-3 rounded-xl border text-xs overflow-x-auto"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-hairline)',
                      }}
                    >
                      <p className="font-semibold mb-2" style={{ color: 'var(--ink)' }}>
                        {sizeGuide.title}
                      </p>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b" style={{ borderColor: 'var(--border-hairline)', color: 'var(--ink-muted)' }}>
                            {sizeGuide.columns.map((c) => (
                              <th key={c} className="py-1.5 pr-3 font-medium">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y font-mono-num" style={{ borderColor: 'var(--border-hairline)' }}>
                          {sizeGuide.rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className={`py-1.5 pr-3 ${cIdx === 0 ? 'font-semibold' : ''}`}
                                  style={{ color: cIdx === 0 ? 'var(--ink)' : 'var(--ink-muted)' }}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-6">
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ink)' }}>
                  Quantité
                </p>
                <div
                  className="inline-flex items-center border rounded-lg"
                  style={{
                    backgroundColor: 'var(--surface-subtle)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Diminuer la quantité"
                    className="p-2.5 rounded-l-lg cursor-pointer"
                    style={{ color: 'var(--ink)' }}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span
                    className="px-4 text-sm font-medium font-mono-num"
                    style={{ color: 'var(--ink)' }}
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) => Math.min(Math.max(1, product.stock), q + 1))
                    }
                    aria-label="Augmenter la quantité"
                    className="p-2.5 rounded-r-lg cursor-pointer"
                    style={{ color: 'var(--ink)' }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div
              className="space-y-3 pt-4 border-t"
              style={{ borderColor: 'var(--border-hairline)' }}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => {
                    addToCart(
                      { ...product, priceXof: finalPrice },
                      selectedSize,
                      quantity,
                      selectedColor
                    );
                    onClose();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium rounded-lg transition-colors disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-contrast)',
                  }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isAvailable ? 'Ajouter au panier' : 'Actuellement épuisé'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Enregistrer dans les favoris"
                  className="p-3 rounded-lg border cursor-pointer"
                  style={{
                    borderColor: 'var(--border-hairline)',
                    color: 'var(--ink)',
                  }}
                >
                  <Heart
                    className={`w-4 h-4 ${isFav ? 'fill-[#9D174D] text-[#9D174D]' : ''}`}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAskSeller(product);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-subtle)',
                  color: 'var(--ink)',
                }}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Poser une question au vendeur sur cet article</span>
              </button>
            </div>
          </div>
        </div>

        {/* Verified Customer Reviews Section */}
        <div
          className="p-6 sm:p-8 border-t space-y-5"
          style={{
            backgroundColor: 'var(--canvas)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl font-semibold" style={{ color: 'var(--ink)' }}>
                Avis clients vérifiés ({productReviews.length})
              </h3>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                Seuls les clients ayant reçu cet article (commande livrée) peuvent publier une note et une photo.
              </p>
            </div>
            {avgRating !== null && (
              <div className="flex items-center gap-1.5 text-sm font-semibold font-mono-num">
                <Star className="w-4 h-4 fill-[#D97706] text-[#D97706]" />
                <span>{avgRating} / 5</span>
              </div>
            )}
          </div>

          {eligibleDeliveredOrder && !alreadyReviewed && (
            <form
              onSubmit={handleReviewSubmit}
              className="rounded-xl border p-4 space-y-3"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold inline-flex items-center gap-1.5 text-[#16A34A]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Achat vérifié ({eligibleDeliveredOrder.orderNumber}) — Laissez votre avis</span>
                </p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      aria-label={`${starVal} étoiles`}
                      className="p-0.5 cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          starVal <= rating
                            ? 'fill-[#D97706] text-[#D97706]'
                            : 'text-[#CBD5E1]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={2}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Qualité du tissu, taille, emballage, livraison..."
                className="w-full px-3 py-2 text-sm border rounded-lg"
                style={{
                  backgroundColor: 'var(--canvas)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--ink)',
                }}
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer"
                  style={{
                    borderColor: 'var(--border-hairline)',
                    color: 'var(--ink)',
                  }}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{reviewPhoto ? 'Photo ajoutée (changer)' : 'Ajouter une photo (opt.)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReviewPhotoUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 text-xs font-medium rounded-lg disabled:opacity-50 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-contrast)',
                  }}
                >
                  {submittingReview ? 'Publication...' : 'Publier mon avis vérifié'}
                </button>
              </div>
            </form>
          )}

          {productReviews.length === 0 ? (
            <p className="text-xs py-2" style={{ color: 'var(--ink-muted)' }}>
              Aucun avis publié pour cet article pour le moment.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {productReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-xl border p-4 space-y-2"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                        {rev.customerName}
                      </p>
                      <p className="text-[11px] text-[#16A34A] font-medium">
                        Achat vérifié · {formatDateFr(rev.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-0.5 text-xs font-mono-num">
                        <Star className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
                        {rev.rating}
                      </span>
                      {(isAdmin || (user && rev.customerId === user.uid)) && (
                        <button
                          type="button"
                          onClick={() => deleteReview(rev.id)}
                          aria-label="Supprimer cet avis"
                          className="p-1 text-[#DC2626] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                    {rev.comment}
                  </p>
                  {rev.photoUrl && (
                    <img
                      src={rev.photoUrl}
                      alt={`Photo avis de ${rev.customerName}`}
                      className="w-24 h-24 object-cover rounded-lg border"
                      style={{ borderColor: 'var(--border-hairline)' }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
