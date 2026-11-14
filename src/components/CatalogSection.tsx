import React, { useMemo, useState } from 'react';
import { Gift, Heart, MessageSquare, Search, ShoppingBag, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CategoryId, Product } from '../types/store';
import { CATEGORY_LABELS, calculateEarnedPoints, formatXof } from '../utils/formatters';
import { ProductImage } from './ProductImage';

interface CatalogSectionProps {
  selectedCategory: CategoryId | 'all';
  onSelectCategory: (cat: CategoryId | 'all') => void;
  onSelectProduct: (product: Product) => void;
  onAskAboutProduct: (product: Product) => void;
  onOpenGiftBuilder: () => void;
}

const CATEGORY_TABS: Array<{ id: CategoryId | 'all'; label: string }> = [
  { id: 'all', label: 'Tout voir' },
  { id: 'femme', label: 'Femme' },
  { id: 'homme', label: 'Homme' },
  { id: 'enfants', label: 'Enfants' },
  { id: 'jeunes', label: 'Jeunes' },
  { id: 'cadeaux', label: 'Cadeaux' },
];

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  selectedCategory,
  onSelectCategory,
  onSelectProduct,
  onAskAboutProduct,
  onOpenGiftBuilder,
}) => {
  const {
    products,
    productsLoading,
    reviews,
    activeSeason,
    settings,
    previewSeasonId,
    wishlistIds,
    toggleWishlist,
    addToCart,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'popular'>('featured');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyFestive, setOnlyFestive] = useState(false);
  const [onlyWishlist, setOnlyWishlist] = useState(false);

  const effectiveDiscount =
    !previewSeasonId && settings.festiveDiscountPercent > 0
      ? settings.festiveDiscountPercent
      : activeSeason.suggestedDiscountPercent;

  const reviewStatsByProduct = useMemo(() => {
    const map: Record<string, { avg: number; count: number }> = {};
    for (const r of reviews) {
      if (!map[r.productId]) map[r.productId] = { avg: 0, count: 0 };
      map[r.productId].avg += r.rating;
      map[r.productId].count += 1;
    }
    for (const key of Object.keys(map)) {
      map[key].avg = Math.round((map[key].avg / map[key].count) * 10) / 10;
    }
    return map;
  }, [reviews]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (onlyAvailable && (!p.available || p.stock <= 0)) return false;
      if (onlyWishlist && !wishlistIds.includes(p.id)) return false;
      if (
        onlyFestive &&
        activeSeason.id !== 'permanent' &&
        !p.festiveTags.includes(activeSeason.id) &&
        !activeSeason.featuredCategories.includes(p.category)
      ) {
        return false;
      }
      if (
        q &&
        !p.title.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q) &&
        !CATEGORY_LABELS[p.category].toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price_asc') return a.priceXof - b.priceXof;
      if (sortBy === 'price_desc') return b.priceXof - a.priceXof;
      if (sortBy === 'popular') return (b.salesCount || 0) - (a.salesCount || 0);
      const aScore =
        (a.featured ? 2 : 0) +
        (a.festiveTags.includes(activeSeason.id) ? 3 : 0) +
        (a.available && a.stock > 0 ? 1 : -5);
      const bScore =
        (b.featured ? 2 : 0) +
        (b.festiveTags.includes(activeSeason.id) ? 3 : 0) +
        (b.available && b.stock > 0 ? 1 : -5);
      return bScore - aScore;
    });
  }, [
    products,
    selectedCategory,
    onlyAvailable,
    onlyWishlist,
    onlyFestive,
    searchQuery,
    sortBy,
    wishlistIds,
    activeSeason,
  ]);

  return (
    <section id="catalogue" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--ink-muted)' }}>
            Catalogue Chez LouLou · {activeSeason.name}
          </p>
          <h2
            className="font-display text-3xl sm:text-4xl font-semibold"
            style={{ color: 'var(--ink)' }}
          >
            Collections &amp; Idées Cadeaux
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={onOpenGiftBuilder}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--accent)',
              color: 'var(--ink)',
            }}
          >
            <Gift className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span>Créer un coffret sur mesure</span>
          </button>

          <div className="relative">
            <Search
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--ink-muted)' }}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un article..."
              className="w-full sm:w-56 pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--ink)',
              }}
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'featured' | 'price_asc' | 'price_desc' | 'popular')
            }
            aria-label="Trier les articles"
            className="px-3 py-2 text-sm border rounded-lg focus:outline-none"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--ink)',
            }}
          >
            <option value="featured">Sélection du moment</option>
            <option value="popular">Les plus demandés</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </div>
      </div>

      {/* Interactive Filter Bar */}
      <div
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-8 border-b"
        style={{ borderColor: 'var(--border-hairline)' }}
      >
        <div
          role="tablist"
          aria-label="Filtrer par catégorie"
          className="flex flex-wrap items-center gap-1 p-1 rounded-lg w-fit"
          style={{ backgroundColor: 'var(--surface-subtle)' }}
        >
          {CATEGORY_TABS.map((tab) => {
            const active = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectCategory(tab.id)}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                style={
                  active
                    ? {
                        backgroundColor: 'var(--surface)',
                        color: 'var(--ink)',
                      }
                    : { color: 'var(--ink-muted)' }
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          className="flex flex-wrap items-center gap-4 text-xs sm:text-sm"
          style={{ color: 'var(--ink-muted)' }}
        >
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
            />
            <span>En stock uniquement</span>
          </label>

          {activeSeason.id !== 'permanent' && (
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyFestive}
                onChange={(e) => setOnlyFestive(e.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
              />
              <span>Sélection {activeSeason.name}</span>
            </label>
          )}

          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyWishlist}
              onChange={(e) => setOnlyWishlist(e.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
            />
            <span>Favoris ({wishlistIds.length})</span>
          </label>
        </div>
      </div>

      {/* Product Grid */}
      {productsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="rounded-xl border overflow-hidden animate-pulse"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <div
                className="aspect-[4/3]"
                style={{ backgroundColor: 'var(--surface-subtle)' }}
              />
              <div className="p-5 space-y-3">
                <div className="h-3 w-24 rounded opacity-50" style={{ backgroundColor: 'var(--surface-subtle)' }} />
                <div className="h-5 w-3/4 rounded opacity-50" style={{ backgroundColor: 'var(--surface-subtle)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div
          className="rounded-xl border p-12 text-center"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <p className="font-display text-2xl mb-2" style={{ color: 'var(--ink)' }}>
            Aucun article ne correspond à ces critères
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>
            Essayez une autre catégorie ou réinitialisez vos filtres de recherche.
          </p>
          <button
            type="button"
            onClick={() => {
              onSelectCategory('all');
              setSearchQuery('');
              setOnlyAvailable(false);
              setOnlyFestive(false);
              setOnlyWishlist(false);
            }}
            className="px-4 py-2 text-sm font-medium rounded-lg cursor-pointer"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-contrast)',
            }}
          >
            Afficher tout le catalogue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredProducts.map((product) => {
            const isAvailable = product.available && product.stock > 0;
            const isFav = wishlistIds.includes(product.id);
            const isFestiveMatch =
              activeSeason.id !== 'permanent' &&
              product.festiveTags.includes(activeSeason.id);
            const discountedPrice =
              effectiveDiscount > 0
                ? Math.round((product.priceXof * (100 - effectiveDiscount)) / 100)
                : product.priceXof;
            const earnedPts = calculateEarnedPoints(discountedPrice, settings);
            const ratingInfo = reviewStatsByProduct[product.id];
            const extraPhotosCount = (product.galleryUrls?.length || 1) - 1;

            return (
              <article
                key={product.id}
                className="group rounded-xl border overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <div
                  onClick={() => onSelectProduct(product)}
                  className="relative aspect-[4/3] overflow-hidden cursor-pointer"
                  style={{ backgroundColor: 'var(--surface-subtle)' }}
                >
                  <ProductImage
                    src={product.imageUrl}
                    alt={product.title}
                    className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${
                      !isAvailable ? 'opacity-65 grayscale-[30%]' : ''
                    }`}
                  />
                  {extraPhotosCount > 0 && (
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 text-[11px] font-medium rounded bg-black/65 text-white tabular-nums">
                      +{extraPhotosCount} photos
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-white/90 backdrop-blur-sm border border-black/10 flex items-center justify-center text-[#23121E] hover:bg-white transition-colors cursor-pointer"
                  >
                    <Heart
                      className={`w-4 h-4 ${isFav ? 'fill-[#9D174D] text-[#9D174D]' : ''}`}
                    />
                  </button>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div
                      className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1.5"
                      style={{ color: 'var(--ink-muted)' }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{CATEGORY_LABELS[product.category]}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {isAvailable ? `En stock (${product.stock})` : 'Indisponible'}
                        </span>
                        {isFestiveMatch && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium" style={{ color: 'var(--ink)' }}>
                              Spécial {activeSeason.name}
                            </span>
                          </>
                        )}
                      </div>

                      {ratingInfo && (
                        <span
                          className="inline-flex items-center gap-1 font-mono-num text-[11px] font-medium"
                          style={{ color: 'var(--ink)' }}
                        >
                          <Star className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
                          <span>
                            {ratingInfo.avg} ({ratingInfo.count})
                          </span>
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => onSelectProduct(product)}
                      className="text-base font-semibold leading-snug cursor-pointer hover:underline underline-offset-4"
                      style={{ color: 'var(--ink)' }}
                    >
                      {product.title}
                    </h3>

                    <p
                      className="text-xs mt-1.5 line-clamp-2 leading-relaxed"
                      style={{ color: 'var(--ink-muted)' }}
                    >
                      {product.description}
                    </p>

                    {product.colors && product.colors.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-3">
                        {product.colors.slice(0, 5).map((col) => (
                          <span
                            key={col.name}
                            title={col.name}
                            className="w-3.5 h-3.5 rounded-full border border-black/20"
                            style={{ backgroundColor: col.hex }}
                          />
                        ))}
                        <span className="text-[11px] ml-1" style={{ color: 'var(--ink-muted)' }}>
                          {product.colors.length} coloris
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    className="mt-5 pt-4 border-t flex items-center justify-between gap-3"
                    style={{ borderColor: 'var(--border-hairline)' }}
                  >
                    <div>
                      <p
                        className="text-[15px] font-semibold font-mono-num"
                        style={{ color: 'var(--ink)' }}
                      >
                        {formatXof(discountedPrice)}
                      </p>
                      <p
                        className="text-[11px] font-mono-num"
                        style={{ color: 'var(--ink-muted)' }}
                      >
                        +{earnedPts} pts LouLou
                        {(effectiveDiscount > 0 || product.compareAtPriceXof) && (
                          <span className="ml-2 line-through opacity-75">
                            {formatXof(
                              effectiveDiscount > 0
                                ? product.priceXof
                                : product.compareAtPriceXof || 0
                            )}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onAskAboutProduct(product)}
                        aria-label={`Poser une question sur ${product.title}`}
                        className="p-2 rounded-lg border transition-colors cursor-pointer"
                        style={{
                          borderColor: 'var(--border-hairline)',
                          color: 'var(--ink-muted)',
                        }}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        disabled={!isAvailable}
                        onClick={() =>
                          addToCart(
                            { ...product, priceXof: discountedPrice },
                            product.sizes[0] || 'Unique',
                            1,
                            product.colors?.[0]?.name || null
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                        style={{
                          backgroundColor: 'var(--accent)',
                          color: 'var(--accent-contrast)',
                        }}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{isAvailable ? 'Ajouter' : 'Épuisé'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
