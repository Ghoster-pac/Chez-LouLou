import React, { useEffect, useRef, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { MessageSquare, Send, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OperationType, db, handleFirestoreError } from '../firebase';
import { ChatMessage, Product } from '../types/store';
import { formatDateTimeFr, formatXof } from '../utils/formatters';

interface MessagingDrawerProps {
  open: boolean;
  onClose: () => void;
  attachedProduct: Product | null;
  onClearAttachedProduct: () => void;
}

export const MessagingDrawer: React.FC<MessagingDrawerProps> = ({
  open,
  onClose,
  attachedProduct,
  onClearAttachedProduct,
}) => {
  const {
    user,
    signInWithGoogle,
    sendMessageToConversation,
    markConversationRead,
    conversations,
  } = useStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const conversationId = user?.uid || null;

  useEffect(() => {
    if (!open || !user || !user.emailVerified || !conversationId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(
          snap.docs.map((d) => ({
            ...(d.data() as Omit<ChatMessage, 'id'>),
            id: d.id,
          }))
        );
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `conversations/${conversationId}/messages`);
      }
    );

    return () => unsub();
  }, [open, user, conversationId]);

  useEffect(() => {
    if (open && conversationId) {
      const conv = conversations.find((c) => c.id === conversationId);
      if (conv?.unreadByCustomer) {
        markConversationRead(conversationId, 'customer');
      }
    }
  }, [open, conversationId, conversations, markConversationRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, open]);

  if (!open) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !conversationId || !draft.trim()) return;
    setSending(true);
    try {
      await sendMessageToConversation(conversationId, draft, attachedProduct);
      setDraft('');
      onClearAttachedProduct();
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Messagerie client-vendeur"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full flex flex-col border-l shadow-2xl"
        style={{
          backgroundColor: 'var(--canvas)',
          borderColor: 'var(--border-hairline)',
          color: 'var(--ink)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div>
            <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--ink)' }}>
              Messagerie Chez LouLou
            </h2>
            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
              Réponse directe de la boutique · Abidjan
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la messagerie"
            className="p-2 rounded-lg cursor-pointer"
            style={{ color: 'var(--ink-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <MessageSquare className="w-10 h-10" style={{ color: 'var(--ink)' }} strokeWidth={1.5} />
            <h3 className="font-display text-2xl font-semibold" style={{ color: 'var(--ink)' }}>
              Discutez directement avec Chez LouLou
            </h3>
            <p className="text-sm max-w-xs" style={{ color: 'var(--ink-muted)' }}>
              Connectez-vous avec Google pour poser vos questions sur les tailles, disponibilités ou coffrets sur mesure.
            </p>
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
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.length === 0 ? (
                <div
                  className="rounded-xl border p-5 text-sm"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-hairline)',
                    color: 'var(--ink-muted)',
                  }}
                >
                  Bonjour {user.displayName || ''} ! Posez-nous votre question ci-dessous (tailles, délais de livraison en Côte d’Ivoire, coffrets cadeaux).
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderRole === 'customer';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className="max-w-[85%] rounded-xl px-4 py-2.5 text-sm border"
                        style={
                          isMine
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
                        {msg.productTitle && (
                          <div className="mb-2 pb-2 border-b border-current/20 text-xs opacity-90">
                            Article : {msg.productTitle}
                            {msg.productPriceXof
                              ? ` · ${formatXof(msg.productPriceXof)}`
                              : ''}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      </div>
                      <span className="text-[11px] mt-1 px-1" style={{ color: 'var(--ink-muted)' }}>
                        {msg.senderRole === 'admin' ? 'Chez LouLou · ' : ''}
                        {formatDateTimeFr(msg.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="p-4 border-t space-y-2.5"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              {attachedProduct && (
                <div
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{
                    backgroundColor: 'var(--surface-subtle)',
                    color: 'var(--ink)',
                  }}
                >
                  <span className="truncate">
                    Article concerné : <strong>{attachedProduct.title}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={onClearAttachedProduct}
                    aria-label="Retirer l'article"
                    className="p-1 hover:text-[#DC2626] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Écrivez votre message au vendeur..."
                  className="flex-1 px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none"
                  style={{
                    backgroundColor: 'var(--surface-subtle)',
                    borderColor: 'var(--border-hairline)',
                    color: 'var(--ink)',
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  aria-label="Envoyer le message"
                  className="p-2.5 rounded-lg disabled:opacity-45 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-contrast)',
                  }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
