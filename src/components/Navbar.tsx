import React, { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CHEZ_LOULOU_LOGO_URL } from '../utils/formatters';

export type AppView = 'store' | 'orders' | 'admin';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView, category?: 'cadeaux' | 'all') => void;
  onOpenCart: () => void;
  onOpenChat: () => void;
  onOpenAccount: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenCart,
  onOpenChat,
  onOpenAccount,
}) => {
  const { cartCount, conversations, user, isAdmin, loyaltyAccount } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadMessages =
    user && !isAdmin
      ? conversations.filter((c) => c.unreadByCustomer).length
      : isAdmin
      ? conversations.filter((c) => c.unreadByAdmin).length
      : 0;

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md border-b"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--canvas) 92%, transparent)',
        borderColor: 'var(--border-hairline)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Logo & Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('store', 'all');
          }}
          className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0"
        >
          <img
            src={CHEZ_LOULOU_LOGO_URL}
            alt="Logo Chez LouLou"
            className="h-10 w-10 rounded-lg object-contain bg-white p-0.5 border"
            style={{ borderColor: 'var(--border-hairline)' }}
          />
          <span
            className="font-display text-2xl font-semibold tracking-tight"
            style={{ color: 'var(--ink)' }}
          >
            Chez LouLou
          </span>
        </a>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav
          aria-label="Navigation principale"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
          style={{ color: 'var(--ink-muted)' }}
        >
          <button
            type="button"
            onClick={() => onNavigate('store', 'all')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:opacity-100 cursor-pointer ${
              currentView === 'store' ? 'underline underline-offset-8' : ''
            }`}
            style={currentView === 'store' ? { color: 'var(--ink)' } : undefined}
          >
            Catalogue
          </button>
          <button
            type="button"
            onClick={() => onNavigate('store', 'cadeaux')}
            className="whitespace-nowrap shrink-0 transition-colors hover:opacity-100 cursor-pointer"
          >
            Cadeaux
          </button>
          <button
            type="button"
            onClick={onOpenChat}
            className="whitespace-nowrap shrink-0 transition-colors hover:opacity-100 cursor-pointer"
          >
            Messagerie{unreadMessages > 0 ? ` (${unreadMessages})` : ''}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:opacity-100 cursor-pointer ${
              currentView === 'orders' ? 'underline underline-offset-8' : ''
            }`}
            style={currentView === 'orders' ? { color: 'var(--ink)' } : undefined}
          >
            Fidélité &amp; Commandes
            {user && loyaltyAccount ? ` (${loyaltyAccount.pointsBalance} pts)` : ''}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:opacity-100 cursor-pointer ${
              currentView === 'admin' ? 'underline underline-offset-8' : ''
            }`}
            style={currentView === 'admin' ? { color: 'var(--ink)' } : undefined}
          >
            Administration
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-contrast)',
            }}
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={1.75} />
            <span>Panier</span>
            <span className="font-mono-num">({cartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            className="md:hidden p-2 rounded-lg border cursor-pointer"
            style={{
              color: 'var(--ink)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t px-4 py-4 space-y-2"
          style={{
            backgroundColor: 'var(--canvas)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              onNavigate('store', 'all');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2.5 text-sm font-medium"
            style={{ color: 'var(--ink)' }}
          >
            Catalogue
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigate('store', 'cadeaux');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2.5 text-sm font-medium"
            style={{ color: 'var(--ink)' }}
          >
            Cadeaux
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenChat();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2.5 text-sm font-medium"
            style={{ color: 'var(--ink)' }}
          >
            Messagerie vendeur{unreadMessages > 0 ? ` (${unreadMessages})` : ''}
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigate('orders');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2.5 text-sm font-medium"
            style={{ color: 'var(--ink)' }}
          >
            Fidélité &amp; Commandes
            {user && loyaltyAccount ? ` (${loyaltyAccount.pointsBalance} pts)` : ''}
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigate('admin');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2.5 text-sm font-medium"
            style={{ color: 'var(--ink)' }}
          >
            Administration
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenAccount();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2.5 text-sm font-medium"
            style={{ color: 'var(--ink-muted)' }}
          >
            {user ? `Compte (${user.displayName || user.email})` : 'Se connecter avec Google'}
          </button>
        </div>
      )}
    </header>
  );
};
