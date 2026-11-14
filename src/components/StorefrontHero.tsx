import React from 'react';
import { ArrowRight, Award, Gift, MessageSquare, ShieldCheck, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { HERO_BOUTIQUE_IMAGE } from '../data/seedCatalog';
import { CHEZ_LOULOU_LOGO_URL, formatXof } from '../utils/formatters';
import { ProductImage } from './ProductImage';

interface StorefrontHeroProps {
  onExploreCatalog: () => void;
  onOpenChat: () => void;
  onOpenAccount: () => void;
}

export const StorefrontHero: React.FC<StorefrontHeroProps> = ({
  onExploreCatalog,
  onOpenChat,
  onOpenAccount,
}) => {
  const { activeSeason, settings, user, loyaltyAccount } = useStore();

  return (
    <section
      className="border-b transition-colors duration-300"
      style={{
        backgroundColor: 'var(--canvas)',
        borderColor: 'var(--border-hairline)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left editorial column */}
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div>
              <div
                className="flex flex-wrap items-center gap-2 text-xs font-medium mb-5"
                style={{ color: 'var(--ink-muted)' }}
              >
                <span>{activeSeason.heroEyebrow}</span>
                <span aria-hidden="true">·</span>
                <span>Abidjan &amp; Côte d’Ivoire</span>
                <span aria-hidden="true">·</span>
                <span>{activeSeason.periodLabel}</span>
              </div>

              <h1
                className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.08] font-semibold text-balance mb-6"
                style={{ color: 'var(--ink)' }}
              >
                {activeSeason.heroHeadline}
              </h1>

              <p
                className="text-base sm:text-lg leading-relaxed max-w-xl mb-8"
                style={{ color: 'var(--ink-muted)' }}
              >
                {activeSeason.heroSubtitle}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onExploreCatalog}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-contrast)',
                  }}
                >
                  <span>{activeSeason.ctaLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onOpenChat}
                  className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-medium border rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface)',
                    color: 'var(--ink)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Parler au vendeur</span>
                </button>
              </div>
            </div>

            <div
              className="mt-10 pt-6 border-t flex flex-wrap items-center justify-between gap-4 text-xs"
              style={{
                borderColor: 'var(--border-hairline)',
                color: 'var(--ink-muted)',
              }}
            >
              <span className="inline-flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>
                  Programme Points LouLou : 1 pt / {formatXof(settings.loyaltyEarnStepXof)} · 100 pts = {formatXof(100 * settings.loyaltyPointValueXof)}
                </span>
              </span>
              <button
                type="button"
                onClick={onOpenAccount}
                className="underline underline-offset-4 cursor-pointer"
                style={{ color: 'var(--ink)' }}
              >
                {user
                  ? `${user.displayName || user.email} · ${loyaltyAccount?.pointsBalance ?? 0} pts`
                  : 'Connexion · 50 pts offerts'}
              </button>
            </div>
          </div>

          {/* Right visual column */}
          <div className="lg:col-span-6">
            <div
              className="relative h-full min-h-[300px] lg:min-h-[460px] rounded-xl overflow-hidden border"
              style={{
                backgroundColor: 'var(--surface-subtle)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <ProductImage
                src={HERO_BOUTIQUE_IMAGE}
                alt="Boutique Chez LouLou à Abidjan : collections femme, homme, enfants, jeunes et coffrets cadeaux"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-2 shadow-md border border-black/10">
                <img
                  src={CHEZ_LOULOU_LOGO_URL}
                  alt="Chez LouLou"
                  className="h-14 w-14 object-contain"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-white">
                <p className="text-xs opacity-90 mb-1">
                  Ambiance active · {activeSeason.name}
                </p>
                <p className="font-display text-2xl font-medium">
                  Chez LouLou Abidjan · Mode familiale &amp; cadeaux
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width 4-column store trust strip */}
        <div
          className="mt-10 pt-8 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--ink)' }} strokeWidth={1.6} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                Livraison Abidjan 24h
              </p>
              <p className="text-xs mt-0.5 tabular-nums" style={{ color: 'var(--ink-muted)' }}>
                Offerte dès {formatXof(settings.freeDeliveryThresholdXof)} d’achat
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--ink)' }} strokeWidth={1.6} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                Points Fidélité LouLou
              </p>
              <p className="text-xs mt-0.5 tabular-nums" style={{ color: 'var(--ink-muted)' }}>
                50 pts offerts à l’inscription · 1 pt = {formatXof(settings.loyaltyPointValueXof)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--ink)' }} strokeWidth={1.6} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                Paiement Mobile &amp; Livraison
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                Wave, Orange Money, MTN MoMo ou espèces
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Gift className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--ink)' }} strokeWidth={1.6} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                Emballage Fête Offert
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                Coffrets adaptés à chaque saison &amp; événement
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
