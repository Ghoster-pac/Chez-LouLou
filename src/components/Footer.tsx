import React from 'react';
import { useStore } from '../context/StoreContext';
import { CHEZ_LOULOU_LOGO_URL, formatXof } from '../utils/formatters';
import { AppView } from './Navbar';

interface FooterProps {
  onNavigate: (view: AppView, category?: 'cadeaux' | 'all') => void;
  onOpenChat: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenChat }) => {
  const { settings, activeSeason } = useStore();

  return (
    <footer
      className="border-t mt-16 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border-hairline)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={CHEZ_LOULOU_LOGO_URL}
              alt="Logo Chez LouLou"
              className="h-12 w-12 rounded-xl object-contain bg-white p-1 border"
              style={{ borderColor: 'var(--border-hairline)' }}
            />
            <p className="font-display text-2xl font-semibold" style={{ color: 'var(--ink)' }}>
              Chez LouLou
            </p>
          </div>
          <p className="text-sm max-w-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
            Boutique lifestyle et cadeaux basée à Abidjan, Côte d’Ivoire. Articles choisis pour femme, homme, enfants et jeunes avec programme de fidélité.
          </p>
          <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            Téléphone boutique : {settings.storePhone}
          </p>
        </div>

        <div className="md:col-span-3 space-y-2.5 text-sm">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--ink)' }}>
            Navigation
          </p>
          <button
            type="button"
            onClick={() => onNavigate('store', 'all')}
            className="block cursor-pointer hover:underline"
            style={{ color: 'var(--ink-muted)' }}
          >
            Catalogue complet
          </button>
          <button
            type="button"
            onClick={() => onNavigate('store', 'cadeaux')}
            className="block cursor-pointer hover:underline"
            style={{ color: 'var(--ink-muted)' }}
          >
            Coffrets Cadeaux
          </button>
          <button
            type="button"
            onClick={onOpenChat}
            className="block cursor-pointer hover:underline"
            style={{ color: 'var(--ink-muted)' }}
          >
            Messagerie vendeur
          </button>
          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className="block cursor-pointer hover:underline"
            style={{ color: 'var(--ink-muted)' }}
          >
            Fidélité &amp; Commandes
          </button>
        </div>

        <div className="md:col-span-4 space-y-2.5 text-sm">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--ink)' }}>
            Saison, Fidélité &amp; Paiements
          </p>
          <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            Thème actif : {activeSeason.name} ({activeSeason.periodLabel})
          </p>
          <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            Points LouLou : 1 pt / {formatXof(settings.loyaltyEarnStepXof)} · 1 pt ={' '}
            {formatXof(settings.loyaltyPointValueXof)}
          </p>
          <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            Wave · Orange Money · MTN MoMo · Carte · Livraison
          </p>
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className="pt-2 text-xs underline underline-offset-4 cursor-pointer"
            style={{ color: 'var(--ink-muted)' }}
          >
            Accès Administrateur
          </button>
        </div>
      </div>

      <div
        className="border-t py-4 px-4 sm:px-6 lg:px-8"
        style={{ borderColor: 'var(--border-hairline)' }}
      >
        <div
          className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs"
          style={{ color: 'var(--ink-muted)' }}
        >
          <p>© {new Date().getFullYear()} Chez LouLou · Abidjan, Côte d’Ivoire</p>
          <p>Femme · Homme · Enfants · Jeunes · Cadeaux</p>
        </div>
      </div>
    </footer>
  );
};
