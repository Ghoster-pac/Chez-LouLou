import React, { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { CategoryId } from '../types/store';
import {
  CATEGORY_LABELS,
  ORDER_STATUS_LABELS,
  formatDateTimeFr,
  formatXof,
  toJsDate,
} from '../utils/formatters';

export const AdminAnalyticsPanel: React.FC = () => {
  const { orders, products } = useStore();
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

  const metrics = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'cancelled');
    const totalRevenueXof = validOrders.reduce((s, o) => s + (o.totalXof || 0), 0);
    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
    const avgBasketXof =
      validOrders.length > 0 ? Math.round(totalRevenueXof / validOrders.length) : 0;

    const availableProducts = products.filter((p) => p.available && p.stock > 0).length;
    const unavailableProducts = products.length - availableProducts;

    // 7-day revenue series (ending today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: Array<{ key: string; label: string; revenueXof: number; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const label = new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
      }).format(d);
      days.push({ key, label, revenueXof: 0, count: 0 });
    }

    for (const o of validOrders) {
      const d = toJsDate(o.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const slot = days.find((x) => x.key === key);
      if (slot) {
        slot.revenueXof += o.totalXof || 0;
        slot.count += 1;
      }
    }

    // Category revenue breakdown
    const catTotals: Record<CategoryId, { revenueXof: number; units: number }> = {
      femme: { revenueXof: 0, units: 0 },
      homme: { revenueXof: 0, units: 0 },
      enfants: { revenueXof: 0, units: 0 },
      jeunes: { revenueXof: 0, units: 0 },
      cadeaux: { revenueXof: 0, units: 0 },
    };

    for (const o of validOrders) {
      for (const item of o.items || []) {
        const cat = item.category || 'cadeaux';
        if (catTotals[cat]) {
          catTotals[cat].revenueXof += (item.priceXof || 0) * (item.quantity || 1);
          catTotals[cat].units += item.quantity || 1;
        }
      }
    }

    const totalCatRevenue = Object.values(catTotals).reduce(
      (s, c) => s + c.revenueXof,
      0
    );

    const topProducts = [...products]
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 5);

    return {
      totalRevenueXof,
      validOrderCount: validOrders.length,
      pendingCount,
      deliveredCount,
      avgBasketXof,
      availableProducts,
      unavailableProducts,
      days,
      catTotals,
      totalCatRevenue,
      topProducts,
    };
  }, [orders, products]);

  const maxDayRevenue = Math.max(1, ...metrics.days.map((d) => d.revenueXof));

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--surface)',
    borderColor: 'var(--border-hairline)',
  };

  return (
    <div className="space-y-6">
      {/* 4 KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border p-5" style={cardStyle}>
          <p className="text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>
            Chiffre d’affaires en direct
          </p>
          <p className="text-2xl font-semibold font-mono-num" style={{ color: 'var(--ink)' }}>
            {formatXof(metrics.totalRevenueXof)}
          </p>
          <p className="text-xs mt-1.5 tabular-nums" style={{ color: 'var(--ink-muted)' }}>
            Sur {metrics.validOrderCount} commande(s) validée(s)
          </p>
        </div>

        <div className="rounded-xl border p-5" style={cardStyle}>
          <p className="text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>
            Commandes à traiter
          </p>
          <p className="text-2xl font-semibold font-mono-num" style={{ color: 'var(--ink)' }}>
            {metrics.pendingCount}
          </p>
          <p className="text-xs mt-1.5 tabular-nums" style={{ color: 'var(--ink-muted)' }}>
            {metrics.deliveredCount} livrée(s) au total
          </p>
        </div>

        <div className="rounded-xl border p-5" style={cardStyle}>
          <p className="text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>
            Panier moyen
          </p>
          <p className="text-2xl font-semibold font-mono-num" style={{ color: 'var(--ink)' }}>
            {formatXof(metrics.avgBasketXof)}
          </p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--ink-muted)' }}>
            Toutes communes CI
          </p>
        </div>

        <div className="rounded-xl border p-5" style={cardStyle}>
          <p className="text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>
            État du catalogue
          </p>
          <p className="text-2xl font-semibold font-mono-num" style={{ color: 'var(--ink)' }}>
            {metrics.availableProducts} / {products.length}
          </p>
          <p className="text-xs mt-1.5 tabular-nums" style={{ color: 'var(--ink-muted)' }}>
            {metrics.unavailableProducts} indisponible(s) ou épuisé(s)
          </p>
        </div>
      </div>

      {/* Revenue Chart + Category Share */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-xl border p-6" style={cardStyle}>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
                Ventes des 7 derniers jours
              </h3>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                Synchronisé en temps réel à chaque nouvelle commande
              </p>
            </div>
            {hoveredDayIndex !== null && (
              <div className="text-right text-xs">
                <p className="font-semibold" style={{ color: 'var(--ink)' }}>
                  {metrics.days[hoveredDayIndex].label}
                </p>
                <p className="font-mono-num" style={{ color: 'var(--ink-muted)' }}>
                  {formatXof(metrics.days[hoveredDayIndex].revenueXof)} ·{' '}
                  {metrics.days[hoveredDayIndex].count} cmd
                </p>
              </div>
            )}
          </div>

          <div
            className="h-56 flex items-end gap-3 pt-4 border-b pb-2"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            {metrics.days.map((day, idx) => {
              const heightPct = Math.max(
                4,
                Math.round((day.revenueXof / maxDayRevenue) * 100)
              );
              const isHovered = hoveredDayIndex === idx;
              return (
                <div
                  key={day.key}
                  onMouseEnter={() => setHoveredDayIndex(idx)}
                  onMouseLeave={() => setHoveredDayIndex(null)}
                  className="flex-1 h-full flex flex-col justify-end items-center gap-2 group cursor-pointer"
                >
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-md transition-opacity"
                      style={{
                        height: `${day.revenueXof === 0 ? 4 : heightPct}%`,
                        backgroundColor:
                          day.revenueXof === 0
                            ? 'var(--surface-subtle)'
                            : isHovered
                            ? 'var(--ink)'
                            : 'var(--accent)',
                      }}
                    />
                  </div>
                  <span
                    className="text-[11px] whitespace-nowrap"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl border p-6" style={cardStyle}>
          <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--ink)' }}>
            Revenus par rayon
          </h3>
          <p className="text-xs mb-5" style={{ color: 'var(--ink-muted)' }}>
            Répartition en temps réel des ventes commandées
          </p>

          <div className="space-y-4">
            {(Object.keys(CATEGORY_LABELS) as CategoryId[]).map((cat) => {
              const info = metrics.catTotals[cat];
              const pct =
                metrics.totalCatRevenue > 0
                  ? Math.round((info.revenueXof / metrics.totalCatRevenue) * 100)
                  : 0;
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium" style={{ color: 'var(--ink)' }}>
                      {CATEGORY_LABELS[cat]}
                    </span>
                    <span className="font-mono-num" style={{ color: 'var(--ink-muted)' }}>
                      {formatXof(info.revenueXof)} ({pct}%)
                    </span>
                  </div>
                  <div
                    className="h-2 w-full rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--surface-subtle)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: 'var(--accent)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Products & Latest Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-xl border p-6" style={cardStyle}>
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--ink)' }}>
            Articles les plus demandés
          </h3>
          <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
            {metrics.topProducts.map((p) => (
              <div
                key={p.id}
                className="py-3 flex items-center justify-between gap-4 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate" style={{ color: 'var(--ink)' }}>
                    {p.title}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    {CATEGORY_LABELS[p.category]} · Stock {p.stock}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono-num font-semibold" style={{ color: 'var(--ink)' }}>
                    {p.salesCount} vendus
                  </p>
                  <p className="text-xs font-mono-num" style={{ color: 'var(--ink-muted)' }}>
                    {formatXof(p.priceXof)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 rounded-xl border p-6" style={cardStyle}>
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--ink)' }}>
            Dernières commandes en direct
          </h3>
          {orders.length === 0 ? (
            <p className="text-sm py-6" style={{ color: 'var(--ink-muted)' }}>
              Aucune commande enregistrée pour l’instant. Elles apparaîtront ici dès qu’un client validera son panier.
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
              {orders.slice(0, 5).map((o) => (
                <div
                  key={o.id}
                  className="py-3 flex items-center justify-between gap-4 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--ink)' }}>
                      {o.orderNumber} · {o.customerName}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                      {o.commune}, {o.city} · {formatDateTimeFr(o.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono-num font-semibold" style={{ color: 'var(--ink)' }}>
                      {formatXof(o.totalXof)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                      {ORDER_STATUS_LABELS[o.status]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
