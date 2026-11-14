import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const FestiveBanner: React.FC = () => {
  const { activeSeason, settings, previewSeasonId, setPreviewSeasonId } = useStore();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed && !previewSeasonId) return null;

  const message =
    settings.customBannerText && !previewSeasonId
      ? settings.customBannerText
      : activeSeason.bannerText;

  const discount =
    !previewSeasonId && settings.festiveDiscountPercent > 0
      ? settings.festiveDiscountPercent
      : activeSeason.suggestedDiscountPercent;

  return (
    <div
      className="w-full min-h-[36px] py-2 px-4 sm:px-6 flex items-center justify-between gap-4 text-xs transition-colors duration-300"
      style={{
        backgroundColor: 'var(--banner-bg)',
        color: 'var(--banner-ink)',
      }}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
        <p className="truncate font-medium tracking-wide">
          <span>{activeSeason.name}</span>
          <span className="mx-2 opacity-50" aria-hidden="true">
            ·
          </span>
          <span className="opacity-90">{message}</span>
          {discount > 0 && (
            <>
              <span className="mx-2 opacity-50" aria-hidden="true">
                ·
              </span>
              <span className="font-semibold underline underline-offset-2">
                -{discount}% appliqué automatiquement
              </span>
            </>
          )}
        </p>

        <div className="flex items-center gap-3 shrink-0">
          {previewSeasonId && (
            <button
              type="button"
              onClick={() => setPreviewSeasonId(null)}
              className="underline underline-offset-2 text-xs whitespace-nowrap hover:opacity-80 cursor-pointer"
            >
              Quitter l’aperçu
            </button>
          )}
          {!previewSeasonId && (
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Fermer la bannière saisonnière"
              className="p-1 opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
