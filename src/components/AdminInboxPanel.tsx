import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { MessageSquare, Send } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OperationType, db, handleFirestoreError } from '../firebase';
import { ChatMessage } from '../types/store';
import { formatDateTimeFr, formatXof } from '../utils/formatters';

export const AdminInboxPanel: React.FC = () => {
  const { conversations, sendMessageToConversation, markConversationRead } = useStore();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!selectedConvId && conversations.length > 0) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations, selectedConvId]);

  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'conversations', selectedConvId, 'messages'),
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
        handleFirestoreError(err, OperationType.LIST, `conversations/${selectedConvId}/messages`);
      }
    );

    markConversationRead(selectedConvId, 'admin');
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConvId]);

  const selectedConv = conversations.find((c) => c.id === selectedConvId) || null;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !reply.trim()) return;
    setSending(true);
    try {
      await sendMessageToConversation(selectedConvId, reply);
      setReply('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="rounded-xl border overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[540px]"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border-hairline)',
      }}
    >
      {/* Left Thread List */}
      <div
        className="lg:col-span-4 border-b lg:border-b-0 lg:border-r flex flex-col"
        style={{ borderColor: 'var(--border-hairline)' }}
      >
        <div
          className="p-4 border-b"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            Conversations clients ({conversations.length})
          </h3>
        </div>

        {conversations.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
            Aucun message client pour le moment.
          </div>
        ) : (
          <div
            className="divide-y overflow-y-auto max-h-[480px]"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            {conversations.map((conv) => {
              const active = conv.id === selectedConvId;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setSelectedConvId(conv.id)}
                  className="w-full text-left p-4 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: active ? 'var(--surface-subtle)' : 'transparent',
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
                      {conv.customerName}
                    </span>
                    {conv.unreadByAdmin && (
                      <span
                        className="text-[11px] font-semibold shrink-0"
                        style={{ color: 'var(--accent)' }}
                      >
                        Nouveau
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--ink-muted)' }}>
                    {conv.lastMessage}
                  </p>
                  <p className="text-[11px] mt-1 opacity-80" style={{ color: 'var(--ink-muted)' }}>
                    {formatDateTimeFr(conv.updatedAt)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Active Thread */}
      <div
        className="lg:col-span-8 flex flex-col"
        style={{ backgroundColor: 'var(--canvas)' }}
      >
        {!selectedConv ? (
          <div
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
            style={{ color: 'var(--ink-muted)' }}
          >
            <MessageSquare className="w-8 h-8 mb-2 opacity-60" strokeWidth={1.5} />
            <p className="text-sm">Sélectionnez une conversation pour répondre au client.</p>
          </div>
        ) : (
          <>
            <div
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  {selectedConv.customerName}
                </p>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  {selectedConv.customerEmail}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3 max-h-[420px]">
              {messages.map((msg) => {
                const isSeller = msg.senderRole === 'admin';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSeller ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className="max-w-[80%] rounded-xl px-4 py-2.5 text-sm border"
                      style={
                        isSeller
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
                        <div
                          className="mb-2 pb-2 border-b text-xs opacity-85"
                          style={{
                            borderColor: isSeller
                              ? 'rgba(255,255,255,0.22)'
                              : 'var(--border-hairline)',
                          }}
                        >
                          Article : {msg.productTitle}
                          {msg.productPriceXof
                            ? ` · ${formatXof(msg.productPriceXof)}`
                            : ''}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <span className="text-[11px] mt-1" style={{ color: 'var(--ink-muted)' }}>
                      {msg.senderName} · {formatDateTimeFr(msg.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={handleReply}
              className="p-4 border-t flex items-center gap-2"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <input
                type="text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={`Répondre à ${selectedConv.customerName}...`}
                className="flex-1 px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none"
                style={{
                  backgroundColor: 'var(--canvas)',
                  color: 'var(--ink)',
                  borderColor: 'var(--border-hairline)',
                }}
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg disabled:opacity-45 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                }}
              >
                <Send className="w-4 h-4" />
                <span>Répondre</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
