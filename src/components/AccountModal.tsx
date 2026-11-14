import React from 'react';
import { Award, LogOut, Shield, UserCheck, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CHEZ_LOULOU_LOGO_URL, formatXof } from '../utils/formatters';

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  onGoAdmin: () => void;
  onGoOrders: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  open,
  onClose,
  onGoAdmin,
  onGoOrders,
}) => {
  const { user, isAdmin, signInWithGoogle, logout, loyaltyAccount, settings } = useStore();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Compte Chez LouLou"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-5"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border-hairline)',
          color: 'var(--ink)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={CHEZ_LOULOU_LOGO_URL}
              alt="Chez LouLou"
              className="h-9 w-9 rounded-lg object-contain bg-white p-0.5 border border-black/10"
            />
            <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--ink)' }}>
              Compte Chez LouLou
            </h2>
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

        {!user ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
              Connectez-vous avec Google pour recevoir <strong>50 Points LouLou offerts</strong>, suivre vos commandes, discuter avec la boutique ou accéder à l’administration.
            </p>
            <button
              type="button"
              onClick={async () => {
                await signInWithGoogle();
                onClose();
              }}
              className="w-full py-3 px-4 text-sm font-medium rounded-lg cursor-pointer"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)',
              }}
            >
              Continuer avec Google
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className="p-4 rounded-xl border flex items-center gap-3"
              style={{
                backgroundColor: 'var(--surface-subtle)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <UserCheck className="w-5 h-5 shrink-0" style={{ color: 'var(--ink)' }} />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
                  {user.displayName || 'Client Chez LouLou'}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--ink-muted)' }}>
                  {user.email}
                </p>
              </div>
            </div>

            {loyaltyAccount && (
              <div
                className="p-3.5 rounded-xl border flex items-center justify-between text-xs"
                style={{ borderColor: 'var(--border-hairline)' }}
              >
                <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: 'var(--ink)' }}>
                  <Award className="w-4 h-4" />
                  <span>Solde Points LouLou</span>
                </span>
                <span className="font-mono-num font-semibold" style={{ color: 'var(--ink)' }}>
                  {loyaltyAccount.pointsBalance} pts (
                  {formatXof(loyaltyAccount.pointsBalance * settings.loyaltyPointValueXof)})
                </span>
              </div>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoOrders();
                }}
                className="w-full py-2.5 px-4 text-sm font-medium rounded-lg text-left cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-subtle)',
                  color: 'var(--ink)',
                }}
              >
                Fidélité &amp; Mes Commandes
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoAdmin();
                  }}
                  className="w-full py-2.5 px-4 text-sm font-medium rounded-lg flex items-center gap-2 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-contrast)',
                  }}
                >
                  <Shield className="w-4 h-4" />
                  <span>Ouvrir la console Administrateur</span>
                </button>
              )}

              <button
                type="button"
                onClick={async () => {
                  await logout();
                  onClose();
                }}
                className="w-full py-2.5 px-4 text-sm font-medium text-[#DC2626] border border-[#DC2626]/30 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
