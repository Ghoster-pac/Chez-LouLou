import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileDown,
  Lock,
  MessageCircle,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  ShoppingCart,
  Tag,
  Trash2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CategoryId, OrderStatus, Product } from '../types/store';
import { FESTIVE_SEASONS, detectAutoSeasonForDate } from '../utils/festiveCalendar';
import {
  CATEGORY_LABELS,
  CHEZ_LOULOU_LOGO_URL,
  LOYALTY_TX_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  buildOrderNotificationMessage,
  buildSmsUrl,
  buildWhatsAppUrl,
  formatDateTimeFr,
  formatXof,
  getLoyaltyTier,
} from '../utils/formatters';
import { downloadCustomerReceiptPdf, downloadDeliverySlipPdf } from '../utils/pdfGenerator';
import { AdminAnalyticsPanel } from './AdminAnalyticsPanel';
import { AdminInboxPanel } from './AdminInboxPanel';
import { AdminProductModal } from './AdminProductModal';
import { ProductImage } from './ProductImage';

type AdminTab = 'analytics' | 'products' | 'orders' | 'loyalty' | 'messages' | 'festivals';

interface AdminDashboardProps {
  onBackToStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToStore }) => {
  const {
    user,
    authReady,
    isAdmin,
    signInWithGoogle,
    logout,
    products,
    lowStockProducts,
    isCatalogSeeded,
    seedDemoCatalog,
    restockProduct,
    toggleProductAvailability,
    deleteProduct,
    orders,
    updateOrderStatus,
    adminMarkOrderPaid,
    allLoyaltyAccounts,
    loyaltyTransactions,
    grantLoyaltyBonus,
    promoCodes,
    savePromoCode,
    togglePromoCode,
    deletePromoCode,
    notifications,
    conversations,
    settings,
    saveStoreSettings,
    previewSeasonId,
    setPreviewSeasonId,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState<CategoryId | 'all'>('all');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all');

  // Loyalty bonus grant state
  const [bonusTargetUid, setBonusTargetUid] = useState<string | null>(null);
  const [bonusPoints, setBonusPoints] = useState<number>(50);
  const [bonusReason, setBonusReason] = useState<string>('Geste commercial Chez LouLou');

  // Promo code creation state
  const [promoCodeStr, setPromoCodeStr] = useState('');
  const [promoPartner, setPromoPartner] = useState('');
  const [promoDesc, setPromoDesc] = useState('');
  const [promoType, setPromoType] = useState<'percent' | 'fixed_xof'>('percent');
  const [promoValue, setPromoValue] = useState(15);
  const [promoMinOrder, setPromoMinOrder] = useState(15000);
  const [promoMaxUses, setPromoMaxUses] = useState(100);
  const [promoSeasonTag, setPromoSeasonTag] = useState('permanent');
  const [promoExpiresAt, setPromoExpiresAt] = useState('');

  // Store & Loyalty settings state
  const [festiveMode, setFestiveMode] = useState<'auto' | 'manual'>(settings.festiveMode);
  const [manualSeasonId, setManualSeasonId] = useState(settings.manualSeasonId);
  const [customBannerText, setCustomBannerText] = useState(settings.customBannerText);
  const [festiveDiscountPercent, setFestiveDiscountPercent] = useState(
    settings.festiveDiscountPercent
  );
  const [freeDeliveryThresholdXof, setFreeDeliveryThresholdXof] = useState(
    settings.freeDeliveryThresholdXof
  );
  const [standardDeliveryFeeXof, setStandardDeliveryFeeXof] = useState(
    settings.standardDeliveryFeeXof
  );
  const [storePhone, setStorePhone] = useState(settings.storePhone);
  const [whatsappPhone, setWhatsappPhone] = useState(
    settings.whatsappPhone || settings.storePhone
  );
  const [whatsappAutoNotify, setWhatsappAutoNotify] = useState(settings.whatsappAutoNotify);
  const [preferredPaymentGateway, setPreferredPaymentGateway] = useState<
    'wave_direct' | 'paystack' | 'cinetpay' | 'manual'
  >(settings.preferredPaymentGateway || 'wave_direct');

  const [loyaltyEarnStepXof, setLoyaltyEarnStepXof] = useState(settings.loyaltyEarnStepXof);
  const [loyaltyPointValueXof, setLoyaltyPointValueXof] = useState(
    settings.loyaltyPointValueXof
  );
  const [loyaltyMinRedeemPoints, setLoyaltyMinRedeemPoints] = useState(
    settings.loyaltyMinRedeemPoints
  );
  const [loyaltyMinOrderXof, setLoyaltyMinOrderXof] = useState(settings.loyaltyMinOrderXof);
  const [loyaltyMaxDiscountPercent, setLoyaltyMaxDiscountPercent] = useState(
    settings.loyaltyMaxDiscountPercent
  );

  useEffect(() => {
    setFestiveMode(settings.festiveMode);
    setManualSeasonId(settings.manualSeasonId);
    setCustomBannerText(settings.customBannerText);
    setFestiveDiscountPercent(settings.festiveDiscountPercent);
    setFreeDeliveryThresholdXof(settings.freeDeliveryThresholdXof);
    setStandardDeliveryFeeXof(settings.standardDeliveryFeeXof);
    setStorePhone(settings.storePhone);
    setWhatsappPhone(settings.whatsappPhone || settings.storePhone);
    setWhatsappAutoNotify(Boolean(settings.whatsappAutoNotify));
    setPreferredPaymentGateway(settings.preferredPaymentGateway || 'wave_direct');
    setLoyaltyEarnStepXof(settings.loyaltyEarnStepXof);
    setLoyaltyPointValueXof(settings.loyaltyPointValueXof);
    setLoyaltyMinRedeemPoints(settings.loyaltyMinRedeemPoints);
    setLoyaltyMinOrderXof(settings.loyaltyMinOrderXof);
    setLoyaltyMaxDiscountPercent(settings.loyaltyMaxDiscountPercent);
  }, [settings]);

  const autoDetectedSeason = useMemo(() => detectAutoSeasonForDate(), []);

  const unreadMessagesCount = useMemo(
    () => conversations.filter((c) => c.unreadByAdmin).length,
    [conversations]
  );

  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'pending').length,
    [orders]
  );

  const loyaltySummary = useMemo(() => {
    const totalPointsInCirculation = allLoyaltyAccounts.reduce(
      (sum, acc) => sum + (acc.pointsBalance || 0),
      0
    );
    const totalRedeemedPoints = allLoyaltyAccounts.reduce(
      (sum, acc) => sum + (acc.totalRedeemed || 0),
      0
    );
    return {
      membersCount: allLoyaltyAccounts.length,
      totalPointsInCirculation,
      liabilityXof: totalPointsInCirculation * (settings.loyaltyPointValueXof || 25),
      totalRedeemedPoints,
    };
  }, [allLoyaltyAccounts, settings.loyaltyPointValueXof]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (productCatFilter !== 'all' && p.category !== productCatFilter) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [products, productSearch, productCatFilter]);

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === 'all') return orders;
    return orders.filter((o) => o.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  const surfaceStyle: React.CSSProperties = {
    backgroundColor: 'var(--surface)',
    borderColor: 'var(--border-hairline)',
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--canvas)',
    color: 'var(--ink)',
    borderColor: 'var(--border-hairline)',
  };

  if (!authReady) {
    return (
      <div
        className="max-w-3xl mx-auto px-4 py-16 text-center text-sm"
        style={{ color: 'var(--ink-muted)' }}
      >
        Vérification de la session administrateur...
      </div>
    );
  }

  // Strict Admin Access Gate
  if (!user || !isAdmin) {
    return (
      <section className="max-w-xl mx-auto px-4 py-16">
        <div className="rounded-2xl border p-8 sm:p-10 text-center space-y-5" style={surfaceStyle}>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto"
            style={{
              backgroundColor: 'var(--surface-subtle)',
              color: 'var(--ink)',
            }}
          >
            <Lock className="w-6 h-6" strokeWidth={1.6} />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold mb-2" style={{ color: 'var(--ink)' }}>
              Espace réservé à l’administrateur
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
              {!user
                ? 'Connectez-vous avec le compte Google administrateur de Chez LouLou pour gérer les articles, les prix, les points fidélité, les commandes et consulter les statistiques en temps réel.'
                : `Le compte ${user.email} est connecté en tant que client et ne dispose pas des droits d’administration.`}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {!user ? (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="px-5 py-2.5 text-sm font-medium rounded-lg cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                }}
              >
                Connexion Administrateur Google
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  await signInWithGoogle();
                }}
                className="px-5 py-2.5 text-sm font-medium rounded-lg cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                }}
              >
                Changer de compte Google
              </button>
            )}
            <button
              type="button"
              onClick={onBackToStore}
              className="px-5 py-2.5 text-sm font-medium rounded-lg cursor-pointer"
              style={{
                backgroundColor: 'var(--surface-subtle)',
                color: 'var(--ink)',
              }}
            >
              Retour à la boutique
            </button>
          </div>
        </div>
      </section>
    );
  }

  const navItems: Array<{
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }> = [
    {
      id: 'analytics',
      label: 'Statistiques temps réel',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'products',
      label: 'Articles & Images',
      icon: <Package className="w-4 h-4" />,
      count: lowStockProducts.length > 0 ? lowStockProducts.length : products.length,
    },
    {
      id: 'orders',
      label: 'Commandes',
      icon: <ShoppingCart className="w-4 h-4" />,
      count: pendingOrdersCount,
    },
    {
      id: 'loyalty',
      label: 'Fidélité & Promos',
      icon: <Award className="w-4 h-4" />,
      count: promoCodes.length,
    },
    {
      id: 'messages',
      label: 'Messagerie clients',
      icon: <MessageSquare className="w-4 h-4" />,
      count: unreadMessagesCount,
    },
    {
      id: 'festivals',
      label: 'Saisons & Paramètres',
      icon: <CalendarDays className="w-4 h-4" />,
    },
  ];

  const handleGrantBonusSubmit = async (e: React.FormEvent, customerId: string) => {
    e.preventDefault();
    if (!bonusPoints) return;
    await grantLoyaltyBonus(customerId, bonusPoints, bonusReason);
    setBonusTargetUid(null);
    setBonusPoints(50);
  };

  const handleCreatePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePromoCode({
      code: promoCodeStr,
      partnerName: promoPartner || 'Campagne Chez LouLou',
      description: promoDesc || `Remise code ${promoCodeStr}`,
      discountType: promoType,
      discountValue: promoValue,
      minOrderXof: promoMinOrder,
      maxUses: promoMaxUses,
      active: true,
      seasonTag: promoSeasonTag,
      expiresAt: promoExpiresAt || null,
    });
    setPromoCodeStr('');
    setPromoPartner('');
    setPromoDesc('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 rounded-xl border p-4 space-y-4" style={surfaceStyle}>
          <div
            className="pb-3 border-b flex items-center gap-3"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <img
              src={CHEZ_LOULOU_LOGO_URL}
              alt="Logo Chez LouLou"
              className="h-10 w-10 rounded-lg object-contain bg-white p-0.5 border shrink-0"
              style={{ borderColor: 'var(--border-hairline)' }}
            />
            <div className="min-w-0">
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                Console Chez LouLou
              </p>
              <p className="text-sm font-semibold truncate mt-0.5" style={{ color: 'var(--ink)' }}>
                {user.displayName || user.email}
              </p>
            </div>
          </div>

          <nav className="space-y-1" aria-label="Menu administration">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                  style={
                    active
                      ? {
                          backgroundColor: 'var(--accent)',
                          color: 'var(--accent-contrast)',
                        }
                      : {
                          color: 'var(--ink-muted)',
                        }
                  }
                >
                  <span className="flex items-center gap-2.5 truncate">
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </span>
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span
                      className="text-xs font-mono-num"
                      style={{
                        color: active ? 'var(--accent-contrast)' : 'var(--ink)',
                        opacity: active ? 0.85 : 1,
                      }}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--border-hairline)' }}>
            <button
              type="button"
              onClick={onBackToStore}
              className="w-full py-2 px-3 text-xs font-medium rounded-lg cursor-pointer"
              style={{
                backgroundColor: 'var(--surface-subtle)',
                color: 'var(--ink)',
              }}
            >
              Voir la boutique client
            </button>
          </div>
        </aside>

        {/* Main Workspace Viewport */}
        <main className="lg:col-span-9 space-y-6 min-w-0">
          {/* Top Breadcrumb Header */}
          <div
            className="rounded-xl border px-6 py-4 flex flex-wrap items-center justify-between gap-4"
            style={surfaceStyle}
          >
            <div>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                Administration / {navItems.find((n) => n.id === activeTab)?.label}
              </p>
              <h1
                className="font-display text-2xl sm:text-3xl font-semibold"
                style={{ color: 'var(--ink)' }}
              >
                {navItems.find((n) => n.id === activeTab)?.label}
              </h1>
            </div>

            {activeTab === 'products' && (
              <div className="flex items-center gap-2">
                {!isCatalogSeeded && (
                  <button
                    type="button"
                    onClick={seedDemoCatalog}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg cursor-pointer"
                    style={{
                      backgroundColor: 'var(--surface-subtle)',
                      color: 'var(--ink)',
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Initialiser le catalogue</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setProductModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-contrast)',
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un article</span>
                </button>
              </div>
            )}
          </div>

          {/* Low-Stock Alert Banner on Analytics & Products */}
          {(activeTab === 'analytics' || activeTab === 'products') &&
            lowStockProducts.length > 0 && (
              <div
                className="rounded-xl border p-4 space-y-3"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: '#D97706',
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#B45309]">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      Alerte réapprovisionnement : {lowStockProducts.length} article(s) sous 3 unités en stock
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {lowStockProducts.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg border flex items-center justify-between gap-3 text-xs"
                      style={inputStyle}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold truncate" style={{ color: 'var(--ink)' }}>
                          {p.title}
                        </p>
                        <p className="font-mono-num text-[#DC2626]">
                          Reste {p.stock} unité(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => restockProduct(p.id, 5)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded cursor-pointer"
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: 'var(--accent-contrast)',
                          }}
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => restockProduct(p.id, 10)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded border cursor-pointer"
                          style={{
                            borderColor: 'var(--border-hairline)',
                            color: 'var(--ink)',
                          }}
                        >
                          +10
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Tab 1: Real-Time Analytics */}
          {activeTab === 'analytics' && <AdminAnalyticsPanel />}

          {/* Tab 2: Products CRUD & Availability */}
          {activeTab === 'products' && (
            <div className="rounded-xl border overflow-hidden" style={surfaceStyle}>
              <div
                className="p-4 border-b flex flex-col sm:flex-row gap-3 justify-between"
                style={{ borderColor: 'var(--border-hairline)' }}
              >
                <input
                  type="search"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Rechercher par nom ou description..."
                  className="px-3 py-2 text-sm border rounded-lg sm:w-72"
                  style={inputStyle}
                />

                <select
                  value={productCatFilter}
                  onChange={(e) =>
                    setProductCatFilter(e.target.value as CategoryId | 'all')
                  }
                  className="px-3 py-2 text-sm border rounded-lg"
                  style={inputStyle}
                >
                  <option value="all">Toutes catégories</option>
                  {(Object.keys(CATEGORY_LABELS) as CategoryId[]).map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className="border-b text-xs"
                      style={{
                        borderColor: 'var(--border-hairline)',
                        color: 'var(--ink-muted)',
                        backgroundColor: 'var(--canvas)',
                      }}
                    >
                      <th className="py-3 px-4 font-medium">Article</th>
                      <th className="py-3 px-4 font-medium">Rayon</th>
                      <th className="py-3 px-4 font-medium text-right">Prix</th>
                      <th className="py-3 px-4 font-medium text-right">Stock</th>
                      <th className="py-3 px-4 font-medium">Disponibilité</th>
                      <th className="py-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm" style={{ borderColor: 'var(--border-hairline)' }}>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div
                              className="w-11 h-11 rounded-md overflow-hidden shrink-0"
                              style={{ backgroundColor: 'var(--surface-subtle)' }}
                            >
                              <ProductImage
                                src={product.imageUrl}
                                alt={product.title}
                              />
                            </div>
                            <div className="min-w-0">
                              <p
                                className="font-medium truncate max-w-[220px]"
                                style={{ color: 'var(--ink)' }}
                              >
                                {product.title}
                              </p>
                              <p
                                className="text-xs font-mono-num"
                                style={{ color: 'var(--ink-muted)' }}
                              >
                                {product.salesCount} vendus
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs" style={{ color: 'var(--ink-muted)' }}>
                          {CATEGORY_LABELS[product.category]}
                        </td>
                        <td
                          className="py-3 px-4 text-right font-mono-num font-medium whitespace-nowrap"
                          style={{ color: 'var(--ink)' }}
                        >
                          {formatXof(product.priceXof)}
                        </td>
                        <td
                          className="py-3 px-4 text-right font-mono-num"
                          style={{ color: 'var(--ink)' }}
                        >
                          {product.stock}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => toggleProductAvailability(product)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md border cursor-pointer whitespace-nowrap ${
                              product.available
                                ? 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]'
                                : 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]'
                            }`}
                          >
                            {product.available ? 'Disponible' : 'Indisponible'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(product);
                                setProductModalOpen(true);
                              }}
                              aria-label={`Modifier ${product.title}`}
                              className="p-1.5 rounded-lg cursor-pointer"
                              style={{ color: 'var(--ink-muted)' }}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {confirmDeleteId === product.id ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteProduct(product.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2 py-1 text-xs font-medium bg-[#991B1B] text-white rounded cursor-pointer"
                                >
                                  Confirmer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 text-xs cursor-pointer"
                                  style={{ color: 'var(--ink-muted)' }}
                                >
                                  Non
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(product.id)}
                                aria-label={`Supprimer ${product.title}`}
                                className="p-1.5 rounded-lg cursor-pointer hover:text-[#DC2626]"
                                style={{ color: 'var(--ink-muted)' }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Orders Management */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3" style={surfaceStyle}>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      'all',
                      'pending',
                      'confirmed',
                      'preparing',
                      'delivering',
                      'delivered',
                      'cancelled',
                    ] as const
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOrderStatusFilter(st)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      style={
                        orderStatusFilter === st
                          ? {
                              backgroundColor: 'var(--accent)',
                              color: 'var(--accent-contrast)',
                            }
                          : {
                              backgroundColor: 'var(--surface-subtle)',
                              color: 'var(--ink-muted)',
                            }
                      }
                    >
                      {st === 'all' ? 'Toutes' : ORDER_STATUS_LABELS[st]}
                    </button>
                  ))}
                </div>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  Passer une commande à « Confirmée » ou « Livrée » crédite automatiquement ses Points LouLou.
                </p>
              </div>

              {filteredOrders.length === 0 ? (
                <div
                  className="rounded-xl border p-10 text-center text-sm"
                  style={{ ...surfaceStyle, color: 'var(--ink-muted)' }}
                >
                  Aucune commande dans cette catégorie pour le moment.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const statusMsg = buildOrderNotificationMessage(order, order.status);
                    const isPaid = order.paymentStatus === 'paid';
                    return (
                      <div key={order.id} className="rounded-xl border p-5 space-y-4" style={surfaceStyle}>
                        <div
                          className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b"
                          style={{ borderColor: 'var(--border-hairline)' }}
                        >
                          <div>
                            <div
                              className="flex flex-wrap items-center gap-2 text-xs mb-1"
                              style={{ color: 'var(--ink-muted)' }}
                            >
                              <span
                                className="font-mono-num font-semibold"
                                style={{ color: 'var(--ink)' }}
                              >
                                {order.orderNumber}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{formatDateTimeFr(order.createdAt)}</span>
                              <span aria-hidden="true">·</span>
                              <span>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={`font-semibold ${
                                  isPaid ? 'text-[#16A34A]' : 'text-[#B45309]'
                                }`}
                              >
                                {PAYMENT_STATUS_LABELS[order.paymentStatus || 'unpaid']}
                              </span>
                            </div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                              {order.customerName} · {order.customerPhone}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                              {order.city}, {order.commune} — {order.addressDetails}
                            </p>
                            <p className="text-xs font-mono-num mt-1" style={{ color: 'var(--ink-muted)' }}>
                              Fidélité : +{order.pointsEarned || 0} pts{' '}
                              {order.pointsCredited ? '(crédités)' : '(en attente)'}
                              {order.promoCode
                                ? ` · Promo ${order.promoCode} (-${formatXof(
                                    order.promoDiscountXof || 0
                                  )})`
                                : ''}
                              {order.referralCodeUsed
                                ? ` · Parrain ${order.referralCodeUsed}${
                                    order.referralRewarded ? ' (+100/+100 crédités)' : ' (en attente)'
                                  }`
                                : ''}
                              {order.pointsRedeemed > 0
                                ? ` · ${order.pointsRedeemed} pts utilisés (-${formatXof(
                                    order.pointsDiscountXof
                                  )})`
                                : ''}
                            </p>
                            {order.paymentReference && (
                              <p className="text-xs font-mono-num mt-0.5" style={{ color: 'var(--ink)' }}>
                                Réf. transaction : {order.paymentReference}
                              </p>
                            )}
                            {order.notes && (
                              <p className="text-xs mt-1" style={{ color: 'var(--ink)' }}>
                                Note client : {order.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span
                              className="text-lg font-semibold font-mono-num"
                              style={{ color: 'var(--ink)' }}
                            >
                              {formatXof(order.totalXof)}
                            </span>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => adminMarkOrderPaid(order.id, !isPaid)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                                  isPaid
                                    ? 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]'
                                    : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{isPaid ? 'Payé' : 'Marquer payé'}</span>
                              </button>

                              <select
                                value={order.status}
                                onChange={(e) =>
                                  updateOrderStatus(
                                    order.id,
                                    e.target.value as OrderStatus
                                  )
                                }
                                aria-label={`Statut de la commande ${order.orderNumber}`}
                                className="px-3 py-1.5 text-xs font-medium border rounded-lg"
                                style={inputStyle}
                              >
                                {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map(
                                  (st) => (
                                    <option key={st} value={st}>
                                      {ORDER_STATUS_LABELS[st]}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--ink-muted)' }}>
                          {order.items.map((item, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 border rounded-md"
                              style={inputStyle}
                            >
                              {item.quantity}x {item.title} ({item.size}
                              {item.color ? ` · ${item.color}` : ''}) ·{' '}
                              <span className="font-mono-num">
                                {formatXof(item.priceXof * item.quantity)}
                              </span>
                            </span>
                          ))}
                        </div>

                        {/* PDF Documents & Direct WhatsApp / SMS Notification Actions */}
                        <div
                          className="pt-3 border-t flex flex-wrap items-center justify-between gap-2"
                          style={{ borderColor: 'var(--border-hairline)' }}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => downloadCustomerReceiptPdf(order, settings)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer"
                              style={inputStyle}
                            >
                              <FileDown className="w-3.5 h-3.5" />
                              <span>Reçu PDF Client</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadDeliverySlipPdf(order, settings)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer"
                              style={inputStyle}
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Bon de Livraison PDF</span>
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={buildWhatsAppUrl(order.customerPhone, statusMsg)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#16A34A] text-white"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp client</span>
                            </a>
                            <a
                              href={buildSmsUrl(order.customerPhone, statusMsg)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border"
                              style={inputStyle}
                            >
                              <span>SMS client</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Loyalty Program & Members Management */}
          {activeTab === 'loyalty' && (
            <div className="space-y-6">
              {/* Loyalty KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border p-5" style={surfaceStyle}>
                  <p className="text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>
                    Membres Fidélité LouLou
                  </p>
                  <p className="text-2xl font-semibold font-mono-num" style={{ color: 'var(--ink)' }}>
                    {loyaltySummary.membersCount}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>
                    50 pts offerts à l’inscription
                  </p>
                </div>

                <div className="rounded-xl border p-5" style={surfaceStyle}>
                  <p className="text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>
                    Points en circulation
                  </p>
                  <p className="text-2xl font-semibold font-mono-num" style={{ color: 'var(--ink)' }}>
                    {loyaltySummary.totalPointsInCirculation} pts
                  </p>
                  <p className="text-xs mt-1 font-mono-num" style={{ color: 'var(--ink-muted)' }}>
                    Valeur : {formatXof(loyaltySummary.liabilityXof)}
                  </p>
                </div>

                <div className="rounded-xl border p-5" style={surfaceStyle}>
                  <p className="text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>
                    Points utilisés en remise
                  </p>
                  <p className="text-2xl font-semibold font-mono-num" style={{ color: 'var(--ink)' }}>
                    {loyaltySummary.totalRedeemedPoints} pts
                  </p>
                  <p className="text-xs mt-1 font-mono-num" style={{ color: 'var(--ink-muted)' }}>
                    1 pt = {formatXof(settings.loyaltyPointValueXof)}
                  </p>
                </div>
              </div>

              {/* Loyalty Rules Configuration */}
              <div className="rounded-xl border p-6 space-y-4" style={surfaceStyle}>
                <div>
                  <h2 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
                    Règles de conversion et conditions de fidélité
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                    Par défaut : 1 pt gagné par 500 FCFA dépensés · 1 pt = 25 FCFA de remise (soit 5% de retour) · minimum 100 pts et commande ≥ 10 000 FCFA.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                      Palier gain 1 pt (FCFA)
                    </label>
                    <input
                      type="number"
                      min={100}
                      step={100}
                      value={loyaltyEarnStepXof}
                      onChange={(e) => setLoyaltyEarnStepXof(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono-num border rounded-lg"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                      Valeur 1 point (FCFA)
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={5}
                      value={loyaltyPointValueXof}
                      onChange={(e) => setLoyaltyPointValueXof(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono-num border rounded-lg"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                      Seuil min utilisation (pts)
                    </label>
                    <input
                      type="number"
                      min={10}
                      step={10}
                      value={loyaltyMinRedeemPoints}
                      onChange={(e) => setLoyaltyMinRedeemPoints(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono-num border rounded-lg"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                      Panier min remise (FCFA)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={loyaltyMinOrderXof}
                      onChange={(e) => setLoyaltyMinOrderXof(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono-num border rounded-lg"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                      Plafond remise (%)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={90}
                      value={loyaltyMaxDiscountPercent}
                      onChange={(e) => setLoyaltyMaxDiscountPercent(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono-num border rounded-lg"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      saveStoreSettings({
                        loyaltyEarnStepXof,
                        loyaltyPointValueXof,
                        loyaltyMinRedeemPoints,
                        loyaltyMinOrderXof,
                        loyaltyMaxDiscountPercent,
                      })
                    }
                    className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg cursor-pointer"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-contrast)',
                    }}
                  >
                    Enregistrer les règles fidélité
                  </button>
                </div>
              </div>

              {/* Members Directory + Grant Bonus */}
              <div className="rounded-xl border overflow-hidden" style={surfaceStyle}>
                <div
                  className="p-4 border-b"
                  style={{ borderColor: 'var(--border-hairline)' }}
                >
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                    Soldes clients &amp; attribution de bonus
                  </h3>
                </div>

                {allLoyaltyAccounts.length === 0 ? (
                  <p className="p-8 text-sm text-center" style={{ color: 'var(--ink-muted)' }}>
                    Aucun compte fidélité enregistré pour l’instant. Les comptes sont créés automatiquement dès qu’un client se connecte.
                  </p>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                    {allLoyaltyAccounts.map((acc) => {
                      const tier = getLoyaltyTier(acc.totalEarned);
                      const isGranting = bonusTargetUid === acc.customerId;
                      return (
                        <div key={acc.id} className="p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                                {acc.customerName}{' '}
                                <span
                                  className="text-xs font-normal"
                                  style={{ color: 'var(--ink-muted)' }}
                                >
                                  · {tier.name}
                                </span>
                              </p>
                              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                                {acc.customerEmail}
                              </p>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p
                                  className="text-sm font-semibold font-mono-num"
                                  style={{ color: 'var(--ink)' }}
                                >
                                  {acc.pointsBalance} pts (
                                  {formatXof(acc.pointsBalance * settings.loyaltyPointValueXof)})
                                </p>
                                <p
                                  className="text-[11px] font-mono-num"
                                  style={{ color: 'var(--ink-muted)' }}
                                >
                                  Gagnés : {acc.totalEarned} · Utilisés : {acc.totalRedeemed}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setBonusTargetUid(isGranting ? null : acc.customerId)
                                }
                                className="px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
                                style={{
                                  backgroundColor: 'var(--surface-subtle)',
                                  color: 'var(--ink)',
                                }}
                              >
                                {isGranting ? 'Fermer' : 'Offrir / Ajuster'}
                              </button>
                            </div>
                          </div>

                          {isGranting && (
                            <form
                              onSubmit={(e) => handleGrantBonusSubmit(e, acc.customerId)}
                              className="p-3 rounded-lg border grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                              style={{
                                backgroundColor: 'var(--canvas)',
                                borderColor: 'var(--border-hairline)',
                              }}
                            >
                              <input
                                type="number"
                                value={bonusPoints}
                                onChange={(e) => setBonusPoints(Number(e.target.value))}
                                className="sm:col-span-3 px-3 py-1.5 text-xs font-mono-num border rounded-md"
                                style={inputStyle}
                                placeholder="Points (+ ou -)"
                              />
                              <input
                                type="text"
                                value={bonusReason}
                                onChange={(e) => setBonusReason(e.target.value)}
                                className="sm:col-span-6 px-3 py-1.5 text-xs border rounded-md"
                                style={inputStyle}
                                placeholder="Motif (ex. Bonus fidélité fête)"
                              />
                              <button
                                type="submit"
                                className="sm:col-span-3 px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer"
                                style={{
                                  backgroundColor: 'var(--accent)',
                                  color: 'var(--accent-contrast)',
                                }}
                              >
                                Appliquer
                              </button>
                            </form>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Promo Codes Saisonniers & Influenceurs */}
              <div className="rounded-xl border p-6 space-y-5" style={surfaceStyle}>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <div>
                    <h3 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
                      Codes promo saisonniers &amp; influenceurs locaux
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                      Créez des codes dédiés aux campagnes Côte d’Ivoire (Tabaski, Noël, Saint-Valentin) ou à vos partenaires/influenceurs.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleCreatePromoSubmit}
                  className="p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-12 gap-3"
                  style={{
                    backgroundColor: 'var(--canvas)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  <input
                    type="text"
                    required
                    value={promoCodeStr}
                    onChange={(e) => setPromoCodeStr(e.target.value.toUpperCase())}
                    placeholder="Code (ex. TABASKI15)"
                    className="sm:col-span-3 px-3 py-2 text-xs font-mono-num uppercase border rounded-lg"
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    value={promoPartner}
                    onChange={(e) => setPromoPartner(e.target.value)}
                    placeholder="Influenceur / Campagne"
                    className="sm:col-span-3 px-3 py-2 text-xs border rounded-lg"
                    style={inputStyle}
                  />
                  <select
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value as 'percent' | 'fixed_xof')}
                    className="sm:col-span-2 px-2.5 py-2 text-xs border rounded-lg"
                    style={inputStyle}
                  >
                    <option value="percent">% Remise</option>
                    <option value="fixed_xof">FCFA Fixe</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    required
                    value={promoValue}
                    onChange={(e) => setPromoValue(Number(e.target.value))}
                    placeholder="Valeur"
                    className="sm:col-span-2 px-3 py-2 text-xs font-mono-num border rounded-lg"
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={promoMinOrder}
                    onChange={(e) => setPromoMinOrder(Number(e.target.value))}
                    placeholder="Panier min"
                    className="sm:col-span-2 px-3 py-2 text-xs font-mono-num border rounded-lg"
                    style={inputStyle}
                  />

                  <input
                    type="text"
                    value={promoDesc}
                    onChange={(e) => setPromoDesc(e.target.value)}
                    placeholder="Description client (optionnel)"
                    className="sm:col-span-4 px-3 py-2 text-xs border rounded-lg"
                    style={inputStyle}
                  />
                  <select
                    value={promoSeasonTag}
                    onChange={(e) => setPromoSeasonTag(e.target.value)}
                    className="sm:col-span-3 px-2.5 py-2 text-xs border rounded-lg"
                    style={inputStyle}
                  >
                    {Object.values(FESTIVE_SEASONS).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={promoMaxUses}
                    onChange={(e) => setPromoMaxUses(Number(e.target.value))}
                    placeholder="Max utilisations"
                    className="sm:col-span-2 px-3 py-2 text-xs font-mono-num border rounded-lg"
                    style={inputStyle}
                  />
                  <input
                    type="date"
                    value={promoExpiresAt}
                    onChange={(e) => setPromoExpiresAt(e.target.value)}
                    aria-label="Date d'expiration"
                    className="sm:col-span-3 px-2.5 py-2 text-xs border rounded-lg"
                    style={inputStyle}
                  />
                  <button
                    type="submit"
                    className="sm:col-span-12 py-2 px-4 text-xs font-medium rounded-lg cursor-pointer"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-contrast)',
                    }}
                  >
                    Créer / Mettre à jour le code promo
                  </button>
                </form>

                {promoCodes.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Aucun code promo créé pour le moment.
                  </p>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                    {promoCodes.map((pc) => (
                      <div
                        key={pc.code}
                        className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold" style={{ color: 'var(--ink)' }}>
                            <span className="font-mono-num">{pc.code}</span> ·{' '}
                            {pc.discountType === 'percent'
                              ? `-${pc.discountValue}%`
                              : `-${formatXof(pc.discountValue)}`}{' '}
                            <span className="font-normal" style={{ color: 'var(--ink-muted)' }}>
                              ({pc.partnerName})
                            </span>
                          </p>
                          <p style={{ color: 'var(--ink-muted)' }}>
                            Min {formatXof(pc.minOrderXof)} · Utilisé {pc.usedCount}/{pc.maxUses}
                            {pc.expiresAt ? ` · Expire ${pc.expiresAt}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => togglePromoCode(pc.code, !pc.active)}
                            className={`px-2.5 py-1 rounded-md border font-medium cursor-pointer ${
                              pc.active
                                ? 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]'
                                : 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]'
                            }`}
                          >
                            {pc.active ? 'Actif' : 'Inactif'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePromoCode(pc.code)}
                            aria-label={`Supprimer ${pc.code}`}
                            className="p-1.5 text-[#DC2626] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Loyalty Ledger */}
              <div className="rounded-xl border p-6" style={surfaceStyle}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>
                  Derniers mouvements de points
                </h3>
                {loyaltyTransactions.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Aucun mouvement enregistré pour le moment.
                  </p>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                    {loyaltyTransactions.slice(0, 12).map((tx) => (
                      <div key={tx.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                        <div className="min-w-0">
                          <p className="font-medium truncate" style={{ color: 'var(--ink)' }}>
                            {LOYALTY_TX_LABELS[tx.type]} · {tx.description}
                          </p>
                          <p style={{ color: 'var(--ink-muted)' }}>
                            {formatDateTimeFr(tx.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`font-mono-num font-semibold shrink-0 ${
                            tx.pointsDelta >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                          }`}
                        >
                          {tx.pointsDelta >= 0 ? `+${tx.pointsDelta}` : tx.pointsDelta} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 5: Customer Messaging Inbox */}
          {activeTab === 'messages' && <AdminInboxPanel />}

          {/* Tab 6: Seasonal Calendar & Store Settings */}
          {activeTab === 'festivals' && (
            <div className="space-y-6">
              <div className="rounded-xl border p-6 space-y-5" style={surfaceStyle}>
                <div>
                  <h2 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
                    Adaptation automatique aux saisons et fêtes de Côte d’Ivoire
                  </h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>
                    Aujourd’hui, le calendrier détecte automatiquement :{' '}
                    <strong style={{ color: 'var(--ink)' }}>
                      {autoDetectedSeason.name} ({autoDetectedSeason.periodLabel})
                    </strong>
                    . Le site adapte dynamiquement son fond, ses surfaces, ses textes et ses boutons.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                      Mode d’adaptation du thème
                    </label>
                    <select
                      value={festiveMode}
                      onChange={(e) =>
                        setFestiveMode(e.target.value as 'auto' | 'manual')
                      }
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                      style={inputStyle}
                    >
                      <option value="auto">
                        Automatique selon les saisons et fêtes
                      </option>
                      <option value="manual">
                        Manuel (forcer un thème précis)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                      Thème si mode manuel activé
                    </label>
                    <select
                      value={manualSeasonId}
                      disabled={festiveMode === 'auto'}
                      onChange={(e) => setManualSeasonId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg disabled:opacity-50"
                      style={inputStyle}
                    >
                      {Object.values(FESTIVE_SEASONS).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.periodLabel})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                      Remise festive globale (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={80}
                      value={festiveDiscountPercent}
                      onChange={(e) =>
                        setFestiveDiscountPercent(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 text-sm font-mono-num border rounded-lg"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                      Seuil livraison gratuite Abidjan (FCFA)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={freeDeliveryThresholdXof}
                      onChange={(e) =>
                        setFreeDeliveryThresholdXof(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 text-sm font-mono-num border rounded-lg"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                      Tarif livraison Abidjan (FCFA)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={standardDeliveryFeeXof}
                      onChange={(e) =>
                        setStandardDeliveryFeeXof(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 text-sm font-mono-num border rounded-lg"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                      Message personnalisé sur la bannière (optionnel)
                    </label>
                    <input
                      type="text"
                      value={customBannerText}
                      onChange={(e) => setCustomBannerText(e.target.value)}
                      placeholder="Laissez vide pour utiliser le message automatique"
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                      Téléphone boutique Côte d’Ivoire
                    </label>
                    <input
                      type="text"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div
                  className="pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
                  style={{ borderColor: 'var(--border-hairline)' }}
                >
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                      Numéro WhatsApp Business / Vendeur
                    </label>
                    <input
                      type="text"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="+225 07 00 00 00 00"
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                      Passerelle Mobile Money prioritaire
                    </label>
                    <select
                      value={preferredPaymentGateway}
                      onChange={(e) =>
                        setPreferredPaymentGateway(
                          e.target.value as 'wave_direct' | 'paystack' | 'cinetpay' | 'manual'
                        )
                      }
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                      style={inputStyle}
                    >
                      <option value="wave_direct">Wave / Orange / MTN Direct CI</option>
                      <option value="paystack">Paystack (Wave / MoMo / Carte)</option>
                      <option value="cinetpay">CinetPay Côte d’Ivoire</option>
                      <option value="manual">Vérification manuelle</option>
                    </select>
                  </div>

                  <label
                    className="inline-flex items-center gap-2 text-xs font-medium pb-2 cursor-pointer"
                    style={{ color: 'var(--ink)' }}
                  >
                    <input
                      type="checkbox"
                      checked={whatsappAutoNotify}
                      onChange={(e) => setWhatsappAutoNotify(e.target.checked)}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span>Alertes automatiques WhatsApp &amp; SMS</span>
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      saveStoreSettings({
                        festiveMode,
                        manualSeasonId,
                        customBannerText,
                        festiveDiscountPercent,
                        freeDeliveryThresholdXof,
                        standardDeliveryFeeXof,
                        storePhone,
                        whatsappPhone,
                        whatsappAutoNotify,
                        preferredPaymentGateway,
                      })
                    }
                    className="px-5 py-2.5 text-sm font-medium rounded-lg cursor-pointer"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-contrast)',
                    }}
                  >
                    Enregistrer la configuration
                  </button>
                </div>
              </div>

              {/* Recent WhatsApp & SMS Notifications Log */}
              <div className="rounded-xl border p-6" style={surfaceStyle}>
                <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--ink)' }}>
                  Journal des alertes &amp; notifications WhatsApp / SMS
                </h3>
                <p className="text-xs mb-4" style={{ color: 'var(--ink-muted)' }}>
                  Chaque nouvelle commande, message client ou changement de statut génère une notification prête à l’envoi automatique ou en 1 clic.
                </p>

                {notifications.length === 0 ? (
                  <p className="text-xs py-4" style={{ color: 'var(--ink-muted)' }}>
                    Aucune notification enregistrée pour le moment.
                  </p>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                    {notifications.slice(0, 12).map((n) => (
                      <div
                        key={n.id}
                        className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate" style={{ color: 'var(--ink)' }}>
                            [{n.channel.toUpperCase()}] {n.recipientRole === 'admin' ? 'Alerte Vendeur' : 'Client'} ·{' '}
                            {n.orderNumber || n.event}
                          </p>
                          <p className="truncate" style={{ color: 'var(--ink-muted)' }}>
                            {n.message} · {formatDateTimeFr(n.createdAt)}
                          </p>
                        </div>
                        <a
                          href={buildWhatsAppUrl(n.recipientPhone, n.message)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md bg-[#16A34A] text-white shrink-0"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Ouvrir WhatsApp</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 14 Seasonal & Event Palette Preview Cards */}
              <div className="rounded-xl border p-6" style={surfaceStyle}>
                <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--ink)' }}>
                  Aperçu des 14 thèmes saisonniers et événements
                </h3>
                <p className="text-xs mb-5" style={{ color: 'var(--ink-muted)' }}>
                  Chaque thème ajuste automatiquement l’arrière-plan, les cartes, les textes et la couleur d’action de Chez LouLou.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.values(FESTIVE_SEASONS).map((season) => {
                    const isPreviewing = previewSeasonId === season.id;
                    const kindLabel =
                      season.kind === 'season'
                        ? 'Saison CI'
                        : season.kind === 'event'
                        ? 'Événement'
                        : 'Signature';
                    return (
                      <div
                        key={season.id}
                        className="rounded-xl border p-4 flex flex-col justify-between gap-3"
                        style={{
                          backgroundColor: season.canvasHex,
                          borderColor: season.borderHex,
                          color: season.inkHex,
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-4 h-4 rounded-sm border"
                                style={{
                                  backgroundColor: season.accentHex,
                                  borderColor: season.borderHex,
                                }}
                                title="Couleur d’accent"
                              />
                              <span
                                className="w-4 h-4 rounded-sm border"
                                style={{
                                  backgroundColor: season.bannerBgHex,
                                  borderColor: season.borderHex,
                                }}
                                title="Bannière"
                              />
                              <span
                                className="w-4 h-4 rounded-sm border"
                                style={{
                                  backgroundColor: season.surfaceSubtleHex,
                                  borderColor: season.borderHex,
                                }}
                                title="Surface"
                              />
                            </div>
                            <span
                              className="text-[11px]"
                              style={{ color: season.inkMutedHex }}
                            >
                              {kindLabel} · {season.periodLabel}
                            </span>
                          </div>
                          <p className="text-sm font-semibold" style={{ color: season.inkHex }}>
                            {season.name}
                          </p>
                          <p
                            className="text-xs mt-1 line-clamp-2"
                            style={{ color: season.inkMutedHex }}
                          >
                            {season.heroHeadline}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setPreviewSeasonId(isPreviewing ? null : season.id);
                            if (!isPreviewing) onBackToStore();
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
                          style={{
                            backgroundColor: season.accentHex,
                            color: season.accentContrastHex,
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>
                            {isPreviewing ? 'Arrêter l’aperçu' : 'Tester ce thème'}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <AdminProductModal
        open={productModalOpen}
        editingProduct={editingProduct}
        onClose={() => setProductModalOpen(false)}
      />
    </div>
  );
};
