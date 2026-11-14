import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../firebase';
import {
  CartItem,
  CategoryId,
  Conversation,
  CustomGiftBoxDetails,
  FestiveSeason,
  LoyaltyAccount,
  LoyaltyTransaction,
  NotificationLog,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  ProductColor,
  PromoCode,
  Referral,
  Review,
  SizeGuideCategory,
  StoreSettings,
} from '../types/store';
import {
  DEFAULT_STORE_SETTINGS,
  INITIAL_PRODUCTS,
  resolveProductImageUrl,
} from '../data/seedCatalog';
import { resolveActiveSeason } from '../utils/festiveCalendar';
import {
  buildOrderNotificationMessage,
  calculateEarnedPoints,
  calculateMaxRedeemablePoints,
  formatXof,
  generateOrderNumber,
  generateReferralCode,
} from '../utils/formatters';

const BOOTSTRAPPED_ADMIN_EMAIL = 'pacmanghoster@gmail.com';
const CART_STORAGE_KEY = 'chez_loulou_cart_v2';
const REFERRAL_STORAGE_KEY = 'chez_loulou_parrain_v1';

interface CheckoutPayload {
  customerName: string;
  customerPhone: string;
  city: string;
  commune: string;
  addressDetails: string;
  paymentMethod: PaymentMethod;
  notes: string;
  pointsToRedeem?: number;
  promoCode?: string | null;
  promoDiscountXof?: number;
  referralCodeUsed?: string | null;
}

interface ProductInput {
  title: string;
  category: CategoryId;
  description: string;
  priceXof: number;
  compareAtPriceXof: number | null;
  imageUrl: string;
  galleryUrls?: string[];
  colors?: ProductColor[];
  sizeGuideCategory?: SizeGuideCategory | null;
  available: boolean;
  stock: number;
  sizes: string[];
  festiveTags: string[];
  featured: boolean;
}

interface PromoCodeInput {
  code: string;
  description: string;
  partnerName: string;
  discountType: 'percent' | 'fixed_xof';
  discountValue: number;
  minOrderXof: number;
  maxUses: number;
  active: boolean;
  seasonTag?: string | null;
  expiresAt?: string | null;
}

interface ToastMessage {
  id: number;
  text: string;
  tone: 'neutral' | 'success' | 'error';
}

interface StoreContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  products: Product[];
  productsLoading: boolean;
  lowStockProducts: Product[];
  isCatalogSeeded: boolean;
  settings: StoreSettings;
  activeSeason: FestiveSeason;
  previewSeasonId: string | null;
  setPreviewSeasonId: (id: string | null) => void;
  orders: Order[];
  ordersLoading: boolean;
  loyaltyAccount: LoyaltyAccount | null;
  allLoyaltyAccounts: LoyaltyAccount[];
  loyaltyTransactions: LoyaltyTransaction[];
  myReferral: Referral | null;
  capturedReferralCode: string;
  setCapturedReferralCode: (code: string) => void;
  promoCodes: PromoCode[];
  reviews: Review[];
  notifications: NotificationLog[];
  conversations: Conversation[];
  wishlistIds: string[];
  cart: CartItem[];
  cartCount: number;
  cartSubtotalXof: number;
  addToCart: (
    product: Product,
    size: string,
    quantity?: number,
    color?: string | null,
    customGiftDetails?: CustomGiftBoxDetails | null
  ) => void;
  updateCartQuantity: (
    productId: string,
    size: string,
    quantity: number,
    color?: string | null
  ) => void;
  removeFromCart: (productId: string, size: string, color?: string | null) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => Promise<void>;
  signInWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  validatePromoCode: (code: string, subtotalXof: number) => Promise<PromoCode>;
  validateReferralCode: (code: string) => Promise<Referral | null>;
  placeOrder: (payload: CheckoutPayload) => Promise<Order>;
  verifyOrderPayment: (
    orderId: string,
    reference: string,
    provider: string
  ) => Promise<{ status: PaymentStatus; message?: string }>;
  adminMarkOrderPaid: (orderId: string, paid: boolean) => Promise<void>;
  cancelCustomerOrder: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus, notes?: string) => Promise<void>;
  grantLoyaltyBonus: (customerId: string, points: number, description: string) => Promise<void>;
  saveProduct: (input: ProductInput, existingId?: string) => Promise<void>;
  restockProduct: (productId: string, addUnits: number) => Promise<void>;
  toggleProductAvailability: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  savePromoCode: (input: PromoCodeInput) => Promise<void>;
  togglePromoCode: (code: string, active: boolean) => Promise<void>;
  deletePromoCode: (code: string) => Promise<void>;
  submitVerifiedReview: (input: {
    productId: string;
    orderId: string;
    rating: number;
    comment: string;
    photoUrl?: string | null;
  }) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  sendWhatsAppNotification: (
    phone: string,
    message: string,
    channel: 'whatsapp' | 'sms',
    meta?: { orderId?: string; orderNumber?: string; recipientRole?: 'customer' | 'admin'; event?: string }
  ) => Promise<{ whatsappUrl: string; smsUrl: string; status: 'sent' | 'manual_link' }>;
  saveStoreSettings: (next: Partial<StoreSettings>) => Promise<void>;
  seedDemoCatalog: () => Promise<void>;
  sendMessageToConversation: (
    conversationId: string,
    text: string,
    productContext?: Product | null
  ) => Promise<void>;
  markConversationRead: (conversationId: string, role: 'customer' | 'admin') => Promise<void>;
  toasts: ToastMessage[];
  pushToast: (text: string, tone?: 'neutral' | 'success' | 'error') => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function makeCartKey(productId: string, size: string, color?: string | null): string {
  return `${productId}__${size}__${color || ''}`;
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [firestoreProducts, setFirestoreProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [settingsDocExists, setSettingsDocExists] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [previewSeasonId, setPreviewSeasonId] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [loyaltyAccount, setLoyaltyAccount] = useState<LoyaltyAccount | null>(null);
  const [allLoyaltyAccounts, setAllLoyaltyAccounts] = useState<LoyaltyAccount[]>([]);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [myReferral, setMyReferral] = useState<Referral | null>(null);
  const [capturedReferralCode, setCapturedReferralCodeState] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = (params.get('parrain') || '').trim().toUpperCase();
      if (fromUrl) {
        localStorage.setItem(REFERRAL_STORAGE_KEY, fromUrl);
        return fromUrl;
      }
      return localStorage.getItem(REFERRAL_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as CartItem[];
    } catch {
      // Ignore storage errors
    }
    return [];
  });

  const setCapturedReferralCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    setCapturedReferralCodeState(clean);
    try {
      if (clean) localStorage.setItem(REFERRAL_STORAGE_KEY, clean);
      else localStorage.removeItem(REFERRAL_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const pushToast = (text: string, tone: 'neutral' | 'success' | 'error' = 'neutral') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev.slice(-3), { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }, [cart]);

  // Auth listener & Admin resolution
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser || !nextUser.emailVerified) {
        setIsAdmin(false);
        setAuthReady(true);
        return;
      }

      if (nextUser.email === BOOTSTRAPPED_ADMIN_EMAIL) {
        setIsAdmin(true);
        setAuthReady(true);
        return;
      }

      try {
        const adminSnap = await getDoc(doc(db, 'admins', nextUser.uid));
        setIsAdmin(adminSnap.exists());
      } catch {
        setIsAdmin(false);
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, []);

  // Public products listener
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Product[] = snap.docs.map((d) => {
          const data = d.data() as Omit<Product, 'id'>;
          return {
            ...data,
            id: d.id,
            imageUrl: resolveProductImageUrl(data.imageUrl),
            galleryUrls: Array.isArray(data.galleryUrls)
              ? data.galleryUrls.map(resolveProductImageUrl)
              : undefined,
          };
        });
        setFirestoreProducts(list);
        setProductsLoading(false);
      },
      (err) => {
        setProductsLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'products');
      }
    );
    return () => unsub();
  }, []);

  // Public reviews listener
  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setReviews(
          snap.docs.map((d) => ({
            ...(d.data() as Omit<Review, 'id'>),
            id: d.id,
          }))
        );
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'reviews');
      }
    );
    return () => unsub();
  }, []);

  // Public store settings listener
  useEffect(() => {
    const ref = doc(db, 'settings', 'store');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setSettingsDocExists(true);
          setSettings({
            ...DEFAULT_STORE_SETTINGS,
            ...(snap.data() as Partial<StoreSettings>),
          });
        } else {
          setSettingsDocExists(false);
          setSettings(DEFAULT_STORE_SETTINGS);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'settings/store');
      }
    );
    return () => unsub();
  }, []);

  // Auto-seed initial catalog once when admin logs in on a fresh database
  useEffect(() => {
    if (!authReady || !isAdmin || productsLoading) return;
    if (!settingsDocExists && firestoreProducts.length === 0) {
      seedDemoCatalogInternal().catch(() => {
        // Handled cleanly
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isAdmin, productsLoading, settingsDocExists, firestoreProducts.length]);

  // Orders real-time listener (Admin sees all, Customer sees own)
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);
    const q = isAdmin
      ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'orders'),
          where('customerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Order[] = snap.docs.map((d) => ({
          ...(d.data() as Omit<Order, 'id'>),
          id: d.id,
        }));
        setOrders(list);
        setOrdersLoading(false);
      },
      (err) => {
        setOrdersLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'orders');
      }
    );
    return () => unsub();
  }, [authReady, user, isAdmin]);

  // Loyalty Account & Referral Code real-time listener
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setLoyaltyAccount(null);
      setMyReferral(null);
      return;
    }

    const ref = doc(db, 'loyaltyAccounts', user.uid);
    const unsub = onSnapshot(
      ref,
      async (snap) => {
        if (snap.exists()) {
          const data = {
            ...(snap.data() as Omit<LoyaltyAccount, 'id'>),
            id: snap.id,
          };
          setLoyaltyAccount(data);

          // Ensure customer has a referral code document
          const expectedCode =
            data.referralCode ||
            generateReferralCode(user.displayName || user.email || 'LOULOU', user.uid);
          if (!data.referralCode) {
            try {
              const batch = writeBatch(db);
              batch.update(ref, {
                referralCode: expectedCode,
                updatedAt: serverTimestamp(),
              });
              const refDocRef = doc(db, 'referrals', expectedCode);
              const existingRef = await getDoc(refDocRef);
              if (!existingRef.exists()) {
                batch.set(refDocRef, {
                  code: expectedCode,
                  ownerId: user.uid,
                  ownerName: (user.displayName || 'Client Chez LouLou').slice(0, 100),
                  successfulCount: 0,
                  totalBonusPoints: 0,
                  createdAt: serverTimestamp(),
                });
              }
              await batch.commit();
            } catch {
              // Non-blocking if already set
            }
          }
        } else {
          // Initialize welcome account with 50 Points LouLou + referral code atomically
          const code = generateReferralCode(
            user.displayName || user.email || 'LOULOU',
            user.uid
          );
          try {
            const batch = writeBatch(db);
            batch.set(ref, {
              customerId: user.uid,
              customerName: (user.displayName || 'Client Chez LouLou').slice(0, 100),
              customerEmail: (user.email || 'client@chezloulou.ci').slice(0, 150),
              pointsBalance: 50,
              totalEarned: 50,
              totalRedeemed: 0,
              referralCode: code,
              updatedAt: serverTimestamp(),
            });
            const txRef = doc(collection(db, 'loyaltyTransactions'));
            batch.set(txRef, {
              customerId: user.uid,
              type: 'welcome',
              pointsDelta: 50,
              description: 'Bonus de bienvenue Chez LouLou (50 points offerts)',
              createdAt: serverTimestamp(),
            });
            batch.set(doc(db, 'referrals', code), {
              code,
              ownerId: user.uid,
              ownerName: (user.displayName || 'Client Chez LouLou').slice(0, 100),
              successfulCount: 0,
              totalBonusPoints: 0,
              createdAt: serverTimestamp(),
            });
            await batch.commit();
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `loyaltyAccounts/${user.uid}`);
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `loyaltyAccounts/${user.uid}`);
      }
    );

    return () => unsub();
  }, [authReady, user]);

  // Listen to own referral document
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified || !loyaltyAccount?.referralCode) {
      setMyReferral(null);
      return;
    }
    const ref = doc(db, 'referrals', loyaltyAccount.referralCode);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setMyReferral({
            ...(snap.data() as Omit<Referral, 'id'>),
            id: snap.id,
          });
        }
      },
      (err) => {
        handleFirestoreError(
          err,
          OperationType.GET,
          `referrals/${loyaltyAccount.referralCode}`
        );
      }
    );
    return () => unsub();
  }, [authReady, user, loyaltyAccount?.referralCode]);

  // Admin: listen to all loyalty accounts, promo codes & notifications
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified || !isAdmin) {
      setAllLoyaltyAccounts([]);
      setPromoCodes([]);
      setNotifications([]);
      return;
    }
    const unsubAcc = onSnapshot(
      query(collection(db, 'loyaltyAccounts'), orderBy('pointsBalance', 'desc')),
      (snap) => {
        setAllLoyaltyAccounts(
          snap.docs.map((d) => ({
            ...(d.data() as Omit<LoyaltyAccount, 'id'>),
            id: d.id,
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'loyaltyAccounts')
    );

    const unsubPromo = onSnapshot(
      query(collection(db, 'promoCodes'), orderBy('createdAt', 'desc')),
      (snap) => {
        setPromoCodes(
          snap.docs.map((d) => ({
            ...(d.data() as Omit<PromoCode, 'id'>),
            id: d.id,
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'promoCodes')
    );

    const unsubNotif = onSnapshot(
      query(collection(db, 'notifications'), orderBy('createdAt', 'desc')),
      (snap) => {
        setNotifications(
          snap.docs.map((d) => ({
            ...(d.data() as Omit<NotificationLog, 'id'>),
            id: d.id,
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
    );

    return () => {
      unsubAcc();
      unsubPromo();
      unsubNotif();
    };
  }, [authReady, user, isAdmin]);

  // Loyalty Transactions real-time listener
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setLoyaltyTransactions([]);
      return;
    }

    const q = isAdmin
      ? query(collection(db, 'loyaltyTransactions'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'loyaltyTransactions'),
          where('customerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setLoyaltyTransactions(
          snap.docs.map((d) => ({
            ...(d.data() as Omit<LoyaltyTransaction, 'id'>),
            id: d.id,
          }))
        );
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'loyaltyTransactions');
      }
    );
    return () => unsub();
  }, [authReady, user, isAdmin]);

  // Conversations real-time listener
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setConversations([]);
      return;
    }

    if (isAdmin) {
      const q = query(collection(db, 'conversations'), orderBy('updatedAt', 'desc'));
      const unsub = onSnapshot(
        q,
        (snap) => {
          setConversations(
            snap.docs.map((d) => ({
              ...(d.data() as Omit<Conversation, 'id'>),
              id: d.id,
            }))
          );
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, 'conversations');
        }
      );
      return () => unsub();
    } else {
      const ref = doc(db, 'conversations', user.uid);
      const unsub = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            setConversations([
              {
                ...(snap.data() as Omit<Conversation, 'id'>),
                id: snap.id,
              },
            ]);
          } else {
            setConversations([]);
          }
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, `conversations/${user.uid}`);
        }
      );
      return () => unsub();
    }
  }, [authReady, user, isAdmin]);

  // Wishlist real-time listener
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setWishlistIds([]);
      return;
    }

    const ref = doc(db, 'wishlists', user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { productIds?: string[] };
          setWishlistIds(Array.isArray(data.productIds) ? data.productIds : []);
        } else {
          setWishlistIds([]);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `wishlists/${user.uid}`);
      }
    );
    return () => unsub();
  }, [authReady, user]);

  const products = useMemo(() => {
    if (firestoreProducts.length > 0) return firestoreProducts;
    if (!productsLoading && !settingsDocExists) return INITIAL_PRODUCTS;
    return firestoreProducts;
  }, [firestoreProducts, productsLoading, settingsDocExists]);

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock < 3),
    [products]
  );

  const activeSeason = useMemo(
    () => resolveActiveSeason(settings, previewSeasonId),
    [settings, previewSeasonId]
  );

  // Sync full site CSS custom properties to active seasonal/event theme
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--canvas', activeSeason.canvasHex);
    root.style.setProperty('--surface', activeSeason.surfaceHex);
    root.style.setProperty('--surface-subtle', activeSeason.surfaceSubtleHex);
    root.style.setProperty('--ink', activeSeason.inkHex);
    root.style.setProperty('--ink-muted', activeSeason.inkMutedHex);
    root.style.setProperty('--border-hairline', activeSeason.borderHex);
    root.style.setProperty('--accent', activeSeason.accentHex);
    root.style.setProperty('--accent-hover', activeSeason.accentHoverHex);
    root.style.setProperty('--accent-soft', activeSeason.accentSoftHex);
    root.style.setProperty('--accent-contrast', activeSeason.accentContrastHex);
    root.style.setProperty('--banner-bg', activeSeason.bannerBgHex);
    root.style.setProperty('--banner-ink', activeSeason.bannerInkHex);
  }, [activeSeason]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartSubtotalXof = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.priceXof * item.quantity, 0),
    [cart]
  );

  const addToCart = (
    product: Product,
    size: string,
    quantity = 1,
    color: string | null = null,
    customGiftDetails: CustomGiftBoxDetails | null = null
  ) => {
    if (!customGiftDetails && (!product.available || product.stock <= 0)) {
      pushToast('Cet article est actuellement indisponible.', 'error');
      return;
    }
    const chosenColor = color || product.colors?.[0]?.name || null;
    const targetKey = makeCartKey(product.id, size, chosenColor);
    setCart((prev) => {
      const idx = prev.findIndex(
        (c) => makeCartKey(c.product.id, c.size, c.color) === targetKey
      );
      if (idx >= 0 && !customGiftDetails) {
        const next = [...prev];
        const nextQty = Math.min(product.stock, next[idx].quantity + quantity);
        next[idx] = { ...next[idx], quantity: nextQty, product };
        return next;
      }
      return [
        ...prev,
        {
          product,
          size,
          color: chosenColor,
          quantity: customGiftDetails ? quantity : Math.min(product.stock, quantity),
          customGiftDetails,
        },
      ];
    });
    pushToast(`${product.title} ajouté au panier`, 'success');
  };

  const updateCartQuantity = (
    productId: string,
    size: string,
    quantity: number,
    color: string | null = null
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    const targetKey = makeCartKey(productId, size, color);
    setCart((prev) =>
      prev.map((item) =>
        makeCartKey(item.product.id, item.size, item.color) === targetKey
          ? {
              ...item,
              quantity: item.customGiftDetails
                ? Math.min(10, quantity)
                : Math.min(item.product.stock || 99, quantity),
            }
          : item
      )
    );
  };

  const removeFromCart = (
    productId: string,
    size: string,
    color: string | null = null
  ) => {
    const targetKey = makeCartKey(productId, size, color);
    setCart((prev) =>
      prev.filter((item) => makeCartKey(item.product.id, item.size, item.color) !== targetKey)
    );
  };

  const clearCart = () => setCart([]);

  const signInWithGoogle = async (): Promise<User | null> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      pushToast(`Bienvenue chez LouLou, ${cred.user.displayName || cred.user.email}`, 'success');
      return cred.user;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connexion annulée';
      if (!msg.includes('popup-closed-by-user')) {
        pushToast('Impossible de finaliser la connexion Google.', 'error');
      }
      return null;
    }
  };

  const logout = async () => {
    await signOut(auth);
    pushToast('Vous êtes déconnecté.', 'neutral');
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      pushToast('Connectez-vous avec Google pour enregistrer vos favoris.', 'neutral');
      await signInWithGoogle();
      return;
    }
    const nextIds = wishlistIds.includes(productId)
      ? wishlistIds.filter((id) => id !== productId)
      : [...wishlistIds, productId].slice(0, 50);

    try {
      await setDoc(doc(db, 'wishlists', user.uid), {
        customerId: user.uid,
        productIds: nextIds,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `wishlists/${user.uid}`);
    }
  };

  const validatePromoCode = async (
    rawCode: string,
    subtotalXof: number
  ): Promise<PromoCode> => {
    const clean = rawCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (clean.length < 3) {
      throw new Error('Code promo invalide.');
    }
    const snap = await getDoc(doc(db, 'promoCodes', clean));
    if (!snap.exists()) {
      throw new Error(`Le code promo « ${clean} » n’existe pas.`);
    }
    const promo = { ...(snap.data() as Omit<PromoCode, 'id'>), id: snap.id };
    if (!promo.active) {
      throw new Error(`Le code promo « ${clean} » n’est plus actif.`);
    }
    if (promo.usedCount >= promo.maxUses) {
      throw new Error(`Le code promo « ${clean} » a atteint sa limite d’utilisation.`);
    }
    if (promo.expiresAt) {
      const exp = new Date(`${promo.expiresAt}T23:59:59`);
      if (!Number.isNaN(exp.getTime()) && new Date() > exp) {
        throw new Error(`Le code promo « ${clean} » est expiré.`);
      }
    }
    if (subtotalXof < promo.minOrderXof) {
      throw new Error(
        `Commande minimum de ${formatXof(promo.minOrderXof)} requise pour ce code.`
      );
    }
    return promo;
  };

  const validateReferralCode = async (rawCode: string): Promise<Referral | null> => {
    const clean = rawCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (clean.length < 4) return null;
    try {
      const snap = await getDoc(doc(db, 'referrals', clean));
      if (!snap.exists()) return null;
      const refData = { ...(snap.data() as Omit<Referral, 'id'>), id: snap.id };
      if (user && refData.ownerId === user.uid) return null;
      return refData;
    } catch {
      return null;
    }
  };

  const sendWhatsAppNotification = async (
    phone: string,
    message: string,
    channel: 'whatsapp' | 'sms',
    meta?: {
      orderId?: string;
      orderNumber?: string;
      recipientRole?: 'customer' | 'admin';
      event?: string;
    }
  ): Promise<{ whatsappUrl: string; smsUrl: string; status: 'sent' | 'manual_link' }> => {
    let status: 'sent' | 'manual_link' = 'manual_link';
    let whatsappUrl = '';
    let smsUrl = '';
    try {
      const resp = await fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message, channel }),
      });
      if (resp.ok) {
        const data = (await resp.json()) as {
          status: 'sent' | 'manual_link';
          whatsappUrl: string;
          smsUrl: string;
        };
        status = data.status;
        whatsappUrl = data.whatsappUrl;
        smsUrl = data.smsUrl;
      }
    } catch {
      // Fall back to manual_link logging
    }

    if (isAdmin) {
      try {
        await setDoc(doc(collection(db, 'notifications')), {
          orderId: meta?.orderId || null,
          orderNumber: meta?.orderNumber || null,
          recipientRole: meta?.recipientRole || 'customer',
          recipientPhone: phone.slice(0, 32),
          channel,
          event: (meta?.event || 'order_status').slice(0, 64),
          message: message.slice(0, 1000),
          status,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'notifications');
      }
    }

    return { whatsappUrl, smsUrl, status };
  };

  const placeOrder = async (payload: CheckoutPayload): Promise<Order> => {
    if (!user || !user.emailVerified) {
      throw new Error('Veuillez vous connecter avec Google avant de valider la commande.');
    }
    if (cart.length === 0) {
      throw new Error('Votre panier est vide.');
    }

    const subtotal = cartSubtotalXof;
    const discountPercent = settings.festiveDiscountPercent || 0;
    const discountXof = Math.round((subtotal * discountPercent) / 100);
    const afterFestiveDiscount = Math.max(0, subtotal - discountXof);

    // Promo code check
    let appliedPromo: PromoCode | null = null;
    let promoDiscountXof = 0;
    if (payload.promoCode) {
      try {
        appliedPromo = await validatePromoCode(payload.promoCode, afterFestiveDiscount);
        promoDiscountXof =
          appliedPromo.discountType === 'percent'
            ? Math.round((afterFestiveDiscount * appliedPromo.discountValue) / 100)
            : Math.min(afterFestiveDiscount, appliedPromo.discountValue);
      } catch {
        appliedPromo = null;
        promoDiscountXof = 0;
      }
    }

    const afterPromoDiscount = Math.max(0, afterFestiveDiscount - promoDiscountXof);

    // Loyalty Points Redemption check
    const currentBalance = loyaltyAccount?.pointsBalance || 0;
    const maxAllowedPts = calculateMaxRedeemablePoints(
      currentBalance,
      afterPromoDiscount,
      settings
    );
    const requestedPts = Math.max(0, Math.floor(payload.pointsToRedeem || 0));
    const pointsRedeemed =
      requestedPts >= (settings.loyaltyMinRedeemPoints || 100) && requestedPts <= maxAllowedPts
        ? requestedPts
        : 0;
    const pointsDiscountXof = pointsRedeemed * (settings.loyaltyPointValueXof || 25);

    const netMerchandiseXof = Math.max(100, afterPromoDiscount - pointsDiscountXof);
    const pointsEarned = calculateEarnedPoints(netMerchandiseXof, settings);

    // Referral validation (first valid order of user)
    let cleanReferralCode: string | null = null;
    if (payload.referralCodeUsed && orders.length === 0) {
      const validRef = await validateReferralCode(payload.referralCodeUsed);
      if (validRef) cleanReferralCode = validRef.code;
    }

    const baseDelivery =
      payload.city === 'Abidjan'
        ? settings.standardDeliveryFeeXof
        : Math.max(settings.standardDeliveryFeeXof, 4000);
    const deliveryFeeXof =
      payload.city === 'Abidjan' && netMerchandiseXof >= settings.freeDeliveryThresholdXof
        ? 0
        : baseDelivery;
    const totalXof = Math.max(100, netMerchandiseXof + deliveryFeeXof);
    const orderNumber = generateOrderNumber();

    const orderRef = doc(collection(db, 'orders'));
    const orderDocData = {
      orderNumber,
      customerId: user.uid,
      customerName: payload.customerName.trim().slice(0, 100),
      customerEmail: (user.email || 'client@chezloulou.ci').slice(0, 150),
      customerPhone: payload.customerPhone.trim().slice(0, 32),
      city: payload.city.trim().slice(0, 64),
      commune: payload.commune.trim().slice(0, 80),
      addressDetails: payload.addressDetails.trim().slice(0, 300),
      paymentMethod: payload.paymentMethod,
      paymentStatus: 'unpaid' as PaymentStatus,
      paymentReference: null,
      paymentProvider: payload.paymentMethod === 'cash_on_delivery' ? 'cash' : payload.paymentMethod,
      items: cart.slice(0, 20).map((c) => ({
        productId: c.product.id,
        title: c.product.title.slice(0, 140),
        category: c.product.category,
        priceXof: c.product.priceXof,
        quantity: c.quantity,
        size: c.size.slice(0, 24),
        color: c.color ? c.color.slice(0, 32) : null,
        imageUrl: c.product.imageUrl.slice(0, 350000),
        customGiftDetails: c.customGiftDetails || null,
      })),
      subtotalXof: subtotal,
      deliveryFeeXof,
      discountXof,
      promoCode: appliedPromo ? appliedPromo.code : null,
      promoDiscountXof,
      pointsRedeemed,
      pointsDiscountXof,
      pointsEarned,
      pointsCredited: false,
      referralCodeUsed: cleanReferralCode,
      referralRewarded: false,
      totalXof,
      status: 'pending' as OrderStatus,
      notes: payload.notes.trim().slice(0, 400),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const batch = writeBatch(db);
      batch.set(orderRef, orderDocData);

      if (pointsRedeemed > 0 && loyaltyAccount) {
        const loyaltyRef = doc(db, 'loyaltyAccounts', user.uid);
        batch.update(loyaltyRef, {
          pointsBalance: loyaltyAccount.pointsBalance - pointsRedeemed,
          totalRedeemed: loyaltyAccount.totalRedeemed + pointsRedeemed,
          lastOrderId: orderRef.id,
          updatedAt: serverTimestamp(),
        });

        const txRef = doc(collection(db, 'loyaltyTransactions'));
        batch.set(txRef, {
          customerId: user.uid,
          type: 'redeem',
          pointsDelta: -pointsRedeemed,
          orderId: orderRef.id,
          orderNumber,
          description: `Remise fidélité utilisée sur la commande ${orderNumber}`,
          createdAt: serverTimestamp(),
        });
      }

      if (appliedPromo) {
        batch.update(doc(db, 'promoCodes', appliedPromo.code), {
          usedCount: appliedPromo.usedCount + 1,
          lastOrderId: orderRef.id,
          updatedAt: serverTimestamp(),
        });
      }

      // Log seller alert notification atomically
      const sellerPhone = settings.whatsappPhone || settings.storePhone;
      const alertText = `Nouvelle commande ${orderNumber} de ${orderDocData.customerName} (${formatXof(
        totalXof
      )}) à ${orderDocData.commune}, ${orderDocData.city}.`;
      batch.set(doc(collection(db, 'notifications')), {
        orderId: orderRef.id,
        orderNumber,
        recipientRole: 'admin',
        recipientPhone: sellerPhone.slice(0, 32),
        channel: 'whatsapp',
        event: 'new_order',
        message: alertText.slice(0, 1000),
        status: 'queued',
        createdAt: serverTimestamp(),
      });

      await batch.commit();

      // Fire-and-forget WhatsApp API relay for seller if configured
      if (settings.whatsappAutoNotify && sellerPhone) {
        fetch('/api/notifications/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: sellerPhone,
            message: alertText,
            channel: 'whatsapp',
          }),
        }).catch(() => {});
      }

      clearCart();
      setCapturedReferralCode('');
      pushToast(`Commande ${orderNumber} enregistrée.`, 'success');
      return {
        ...orderDocData,
        id: orderRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'orders');
    }
  };

  const verifyOrderPayment = async (
    orderId: string,
    reference: string,
    provider: string
  ): Promise<{ status: PaymentStatus; message?: string }> => {
    const resp = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, provider }),
    });
    const data = (await resp.json()) as {
      verified?: boolean;
      status?: PaymentStatus;
      error?: string;
      message?: string;
    };
    if (!resp.ok) {
      throw new Error(data.error || 'Vérification impossible.');
    }
    const nextPaymentStatus: PaymentStatus = data.status || 'pending_verification';
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: nextPaymentStatus,
        paymentReference: reference.trim().slice(0, 128),
        paymentProvider: provider.slice(0, 64),
        updatedAt: serverTimestamp(),
      });
      pushToast(
        nextPaymentStatus === 'paid'
          ? 'Paiement en ligne vérifié et confirmé.'
          : 'Référence de paiement enregistrée pour vérification.',
        'success'
      );
      return { status: nextPaymentStatus, message: data.message };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const adminMarkOrderPaid = async (orderId: string, paid: boolean) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: paid ? 'paid' : 'unpaid',
        updatedAt: serverTimestamp(),
      });
      pushToast(
        paid ? 'Paiement marqué comme vérifié et encaissé.' : 'Paiement remis en attente.',
        'success'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const cancelCustomerOrder = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!user || !order || order.status !== 'pending') return;

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'orders', orderId), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });

      if (order.pointsRedeemed > 0 && loyaltyAccount) {
        batch.update(doc(db, 'loyaltyAccounts', user.uid), {
          pointsBalance: loyaltyAccount.pointsBalance + order.pointsRedeemed,
          totalRedeemed: Math.max(0, loyaltyAccount.totalRedeemed - order.pointsRedeemed),
          lastOrderId: orderId,
          updatedAt: serverTimestamp(),
        });
        batch.set(doc(collection(db, 'loyaltyTransactions')), {
          customerId: user.uid,
          type: 'refund',
          pointsDelta: order.pointsRedeemed,
          orderId,
          orderNumber: order.orderNumber,
          description: `Points remboursés suite à l’annulation de ${order.orderNumber}`,
          createdAt: serverTimestamp(),
        });
      }

      await batch.commit();
      pushToast('Commande annulée.', 'neutral');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    notes?: string
  ) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    try {
      const batch = writeBatch(db);
      const orderRef = doc(db, 'orders', orderId);
      const updatePayload: Record<string, unknown> = {
        status,
        updatedAt: serverTimestamp(),
      };
      if (typeof notes === 'string') {
        updatePayload.notes = notes.slice(0, 400);
      }

      // Décrémenter le stock lors du passage de pending à confirmed
      if (order.status === 'pending' && status === 'confirmed') {
        for (const item of order.items) {
          if (item.customGiftDetails?.includedItems) {
            for (const sub of item.customGiftDetails.includedItems) {
              const liveSub = firestoreProducts.find((p) => p.id === sub.productId);
              if (liveSub) {
                const nextStock = Math.max(0, liveSub.stock - item.quantity);
                batch.update(doc(db, 'products', liveSub.id), {
                  stock: nextStock,
                  available: nextStock > 0 ? liveSub.available : false,
                  salesCount: liveSub.salesCount + item.quantity,
                  updatedAt: serverTimestamp(),
                });
              }
            }
          } else {
            const liveProduct = firestoreProducts.find((p) => p.id === item.productId);
            if (liveProduct) {
              const nextStock = Math.max(0, liveProduct.stock - item.quantity);
              batch.update(doc(db, 'products', liveProduct.id), {
                stock: nextStock,
                available: nextStock > 0 ? liveProduct.available : false,
                salesCount: liveProduct.salesCount + item.quantity,
                updatedAt: serverTimestamp(),
              });
            }
          }
        }
      }

      const isConfirmOrDeliver = status === 'confirmed' || status === 'delivered';
      const earnedFromOrder =
        isConfirmOrDeliver && !order.pointsCredited && (order.pointsEarned || 0) > 0
          ? order.pointsEarned
          : 0;

      // Check referral reward (+100 pts parrain & +100 pts filleul)
      let referralBonusForBuyer = 0;
      let referrerAccountData: LoyaltyAccount | null = null;
      let referralDoc: Referral | null = null;

      if (isConfirmOrDeliver && !order.referralRewarded && order.referralCodeUsed) {
        const refSnap = await getDoc(doc(db, 'referrals', order.referralCodeUsed));
        if (refSnap.exists()) {
          const rData = { ...(refSnap.data() as Omit<Referral, 'id'>), id: refSnap.id };
          if (rData.ownerId !== order.customerId) {
            referralDoc = rData;
            referralBonusForBuyer = 100;
            updatePayload.referralRewarded = true;
            const referrerAccSnap = await getDoc(doc(db, 'loyaltyAccounts', rData.ownerId));
            if (referrerAccSnap.exists()) {
              referrerAccountData = {
                ...(referrerAccSnap.data() as Omit<LoyaltyAccount, 'id'>),
                id: referrerAccSnap.id,
              };
            }
          }
        }
      }

      const totalBuyerDelta = earnedFromOrder + referralBonusForBuyer;
      if (earnedFromOrder > 0) {
        updatePayload.pointsCredited = true;
      }

      if (totalBuyerDelta > 0) {
        const buyerLoyaltyRef = doc(db, 'loyaltyAccounts', order.customerId);
        const existingSnap = await getDoc(buyerLoyaltyRef);
        if (existingSnap.exists()) {
          const cur = existingSnap.data() as LoyaltyAccount;
          batch.update(buyerLoyaltyRef, {
            pointsBalance: (cur.pointsBalance || 0) + totalBuyerDelta,
            totalEarned: (cur.totalEarned || 0) + totalBuyerDelta,
            ...(referralBonusForBuyer > 0 && order.referralCodeUsed
              ? { referredByCode: order.referralCodeUsed }
              : {}),
            lastOrderId: orderId,
            updatedAt: serverTimestamp(),
          });
        } else {
          batch.set(buyerLoyaltyRef, {
            customerId: order.customerId,
            customerName: order.customerName.slice(0, 100),
            customerEmail: order.customerEmail.slice(0, 150),
            pointsBalance: totalBuyerDelta,
            totalEarned: totalBuyerDelta,
            totalRedeemed: 0,
            ...(referralBonusForBuyer > 0 && order.referralCodeUsed
              ? { referredByCode: order.referralCodeUsed }
              : {}),
            lastOrderId: orderId,
            updatedAt: serverTimestamp(),
          });
        }

        if (earnedFromOrder > 0) {
          batch.set(doc(collection(db, 'loyaltyTransactions')), {
            customerId: order.customerId,
            type: 'earn',
            pointsDelta: earnedFromOrder,
            orderId,
            orderNumber: order.orderNumber,
            description: `Points gagnés sur commande ${order.orderNumber}`,
            createdAt: serverTimestamp(),
          });
        }
        if (referralBonusForBuyer > 0 && referralDoc) {
          batch.set(doc(collection(db, 'loyaltyTransactions')), {
            customerId: order.customerId,
            type: 'referral',
            pointsDelta: 100,
            orderId,
            orderNumber: order.orderNumber,
            description: `Bonus filleul (code ${referralDoc.code})`,
            createdAt: serverTimestamp(),
          });
        }
      }

      // Credit referrer +100 pts atomically
      if (referralDoc) {
        batch.update(doc(db, 'referrals', referralDoc.code), {
          successfulCount: (referralDoc.successfulCount || 0) + 1,
          totalBonusPoints: (referralDoc.totalBonusPoints || 0) + 200,
        });
        const referrerRef = doc(db, 'loyaltyAccounts', referralDoc.ownerId);
        if (referrerAccountData) {
          batch.update(referrerRef, {
            pointsBalance: (referrerAccountData.pointsBalance || 0) + 100,
            totalEarned: (referrerAccountData.totalEarned || 0) + 100,
            updatedAt: serverTimestamp(),
          });
        } else {
          batch.set(referrerRef, {
            customerId: referralDoc.ownerId,
            customerName: referralDoc.ownerName.slice(0, 100),
            customerEmail: 'parrain@chezloulou.ci',
            pointsBalance: 100,
            totalEarned: 100,
            totalRedeemed: 0,
            referralCode: referralDoc.code,
            updatedAt: serverTimestamp(),
          });
        }
        batch.set(doc(collection(db, 'loyaltyTransactions')), {
          customerId: referralDoc.ownerId,
          type: 'referral',
          pointsDelta: 100,
          orderId,
          orderNumber: order.orderNumber,
          description: `Bonus parrain pour l’invitation de ${order.customerName}`,
          createdAt: serverTimestamp(),
        });
      }

      // Rembourser les points utilisés si l'admin annule une commande non livrée
      if (status === 'cancelled' && order.status !== 'cancelled' && order.pointsRedeemed > 0) {
        const loyaltyRef = doc(db, 'loyaltyAccounts', order.customerId);
        const existingSnap = await getDoc(loyaltyRef);
        if (existingSnap.exists()) {
          const cur = existingSnap.data() as LoyaltyAccount;
          batch.update(loyaltyRef, {
            pointsBalance: (cur.pointsBalance || 0) + order.pointsRedeemed,
            totalRedeemed: Math.max(0, (cur.totalRedeemed || 0) - order.pointsRedeemed),
            lastOrderId: orderId,
            updatedAt: serverTimestamp(),
          });
          batch.set(doc(collection(db, 'loyaltyTransactions')), {
            customerId: order.customerId,
            type: 'refund',
            pointsDelta: order.pointsRedeemed,
            orderId,
            orderNumber: order.orderNumber,
            description: `Points remboursés (${order.orderNumber} annulée)`,
            createdAt: serverTimestamp(),
          });
        }
      }

      batch.update(orderRef, updatePayload);
      await batch.commit();

      // Dispatch WhatsApp / SMS status notification log
      if (
        settings.whatsappAutoNotify &&
        (status === 'confirmed' || status === 'delivering' || status === 'delivered')
      ) {
        const msg = buildOrderNotificationMessage(order, status);
        await sendWhatsAppNotification(order.customerPhone, msg, 'whatsapp', {
          orderId,
          orderNumber: order.orderNumber,
          recipientRole: 'customer',
          event: `status_${status}`,
        });
      }

      pushToast(
        earnedFromOrder > 0
          ? `Statut mis à jour (+${earnedFromOrder} pts${
              referralDoc ? ' + bonus parrainage 100 pts' : ''
            }).`
          : 'Statut de commande mis à jour.',
        'success'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const grantLoyaltyBonus = async (
    customerId: string,
    points: number,
    description: string
  ) => {
    if (!isAdmin) return;
    const cleanPts = Math.round(points);
    if (cleanPts === 0) return;

    const acc = allLoyaltyAccounts.find((a) => a.customerId === customerId);
    if (!acc) return;

    try {
      const batch = writeBatch(db);
      const nextBalance = Math.max(0, acc.pointsBalance + cleanPts);
      const nextEarned = cleanPts > 0 ? acc.totalEarned + cleanPts : acc.totalEarned;
      batch.update(doc(db, 'loyaltyAccounts', customerId), {
        pointsBalance: nextBalance,
        totalEarned: nextEarned,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(collection(db, 'loyaltyTransactions')), {
        customerId,
        type: 'bonus',
        pointsDelta: cleanPts,
        description: description.trim().slice(0, 200) || 'Bonus attribué par Chez LouLou',
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      pushToast(`Bonus de ${cleanPts} pts appliqué à ${acc.customerName}.`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `loyaltyAccounts/${customerId}`);
    }
  };

  const saveProduct = async (input: ProductInput, existingId?: string) => {
    if (!isAdmin) throw new Error('Action réservée à l’administrateur.');
    const sanitized = {
      title: input.title.trim().slice(0, 140),
      category: input.category,
      description: input.description.trim().slice(0, 2000),
      priceXof: Math.max(100, Math.round(input.priceXof)),
      compareAtPriceXof:
        input.compareAtPriceXof && input.compareAtPriceXof > 0
          ? Math.round(input.compareAtPriceXof)
          : null,
      imageUrl: input.imageUrl.trim().slice(0, 350000),
      galleryUrls: (input.galleryUrls || [])
        .map((u) => u.trim().slice(0, 350000))
        .filter(Boolean)
        .slice(0, 6),
      colors: (input.colors || [])
        .map((c) => ({
          name: c.name.trim().slice(0, 40),
          hex: c.hex.trim().slice(0, 16),
        }))
        .filter((c) => c.name.length > 0)
        .slice(0, 8),
      sizeGuideCategory: input.sizeGuideCategory || null,
      available: Boolean(input.available),
      stock: Math.max(0, Math.round(input.stock)),
      sizes: input.sizes.slice(0, 10).map((s) => s.trim().slice(0, 24)).filter(Boolean),
      festiveTags: input.festiveTags
        .slice(0, 10)
        .map((t) => t.trim().slice(0, 40))
        .filter(Boolean),
      featured: Boolean(input.featured),
    };

    try {
      if (existingId && firestoreProducts.some((p) => p.id === existingId)) {
        await updateDoc(doc(db, 'products', existingId), {
          ...sanitized,
          updatedAt: serverTimestamp(),
        });
        pushToast('Article mis à jour.', 'success');
      } else {
        const docRef = existingId
          ? doc(db, 'products', existingId)
          : doc(collection(db, 'products'));
        await setDoc(docRef, {
          ...sanitized,
          salesCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        pushToast('Article ajouté au catalogue.', 'success');
      }
    } catch (err) {
      handleFirestoreError(
        err,
        existingId ? OperationType.UPDATE : OperationType.CREATE,
        existingId ? `products/${existingId}` : 'products'
      );
    }
  };

  const restockProduct = async (productId: string, addUnits: number) => {
    if (!isAdmin) return;
    const prod = firestoreProducts.find((p) => p.id === productId);
    if (!prod) return;
    const nextStock = Math.max(0, prod.stock + Math.round(addUnits));
    try {
      await updateDoc(doc(db, 'products', productId), {
        stock: nextStock,
        available: nextStock > 0 ? true : prod.available,
        updatedAt: serverTimestamp(),
      });
      pushToast(`Stock de ${prod.title} mis à jour (${nextStock} unités).`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const toggleProductAvailability = async (product: Product) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'products', product.id), {
        available: !product.available,
        updatedAt: serverTimestamp(),
      });
      pushToast(
        !product.available
          ? `${product.title} marqué disponible.`
          : `${product.title} marqué indisponible.`,
        'neutral'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${product.id}`);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
      pushToast('Article supprimé du catalogue.', 'neutral');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
    }
  };

  const savePromoCode = async (input: PromoCodeInput) => {
    if (!isAdmin) return;
    const cleanCode = input.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32);
    if (cleanCode.length < 3) {
      pushToast('Le code promo doit contenir au moins 3 caractères alphanumériques.', 'error');
      return;
    }
    const existing = promoCodes.find((p) => p.code === cleanCode);
    try {
      await setDoc(doc(db, 'promoCodes', cleanCode), {
        code: cleanCode,
        description: input.description.trim().slice(0, 160),
        partnerName: input.partnerName.trim().slice(0, 100),
        discountType: input.discountType,
        discountValue: Math.max(1, Math.round(input.discountValue)),
        minOrderXof: Math.max(0, Math.round(input.minOrderXof)),
        maxUses: Math.max(1, Math.round(input.maxUses)),
        usedCount: existing ? existing.usedCount : 0,
        active: Boolean(input.active),
        seasonTag: input.seasonTag ? input.seasonTag.slice(0, 64) : null,
        expiresAt: input.expiresAt ? input.expiresAt.slice(0, 32) : null,
        createdAt: existing ? existing.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      pushToast(`Code promo ${cleanCode} enregistré.`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `promoCodes/${cleanCode}`);
    }
  };

  const togglePromoCode = async (code: string, active: boolean) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'promoCodes', code), {
        active,
        updatedAt: serverTimestamp(),
      });
      pushToast(`Code ${code} ${active ? 'activé' : 'désactivé'}.`, 'neutral');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `promoCodes/${code}`);
    }
  };

  const deletePromoCode = async (code: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'promoCodes', code));
      pushToast(`Code ${code} supprimé.`, 'neutral');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `promoCodes/${code}`);
    }
  };

  const submitVerifiedReview = async (input: {
    productId: string;
    orderId: string;
    rating: number;
    comment: string;
    photoUrl?: string | null;
  }) => {
    if (!user || !user.emailVerified) {
      throw new Error('Connexion requise pour publier un avis.');
    }
    const cleanComment = input.comment.trim().slice(0, 1000);
    if (cleanComment.length < 3) {
      throw new Error('Votre avis doit contenir au moins 3 caractères.');
    }
    try {
      await setDoc(doc(collection(db, 'reviews')), {
        productId: input.productId,
        orderId: input.orderId,
        customerId: user.uid,
        customerName: (user.displayName || 'Client Chez LouLou').slice(0, 100),
        rating: Math.min(5, Math.max(1, Math.round(input.rating))),
        comment: cleanComment,
        photoUrl: input.photoUrl ? input.photoUrl.slice(0, 350000) : null,
        verifiedPurchase: true,
        createdAt: serverTimestamp(),
      });
      pushToast('Merci ! Votre avis vérifié a été publié.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reviews');
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      pushToast('Avis supprimé.', 'neutral');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reviews/${reviewId}`);
    }
  };

  const saveStoreSettings = async (next: Partial<StoreSettings>) => {
    if (!isAdmin) return;
    const merged: StoreSettings = {
      ...settings,
      ...next,
    };
    const payload = {
      festiveMode: merged.festiveMode,
      manualSeasonId: merged.manualSeasonId.slice(0, 64),
      customBannerText: (merged.customBannerText || '').slice(0, 200),
      festiveDiscountPercent: Math.min(80, Math.max(0, Math.round(merged.festiveDiscountPercent || 0))),
      freeDeliveryThresholdXof: Math.max(0, Math.round(merged.freeDeliveryThresholdXof || 0)),
      standardDeliveryFeeXof: Math.max(0, Math.round(merged.standardDeliveryFeeXof || 0)),
      storePhone: (merged.storePhone || '').slice(0, 32),
      whatsappPhone: (merged.whatsappPhone || merged.storePhone || '').slice(0, 32),
      whatsappAutoNotify: Boolean(merged.whatsappAutoNotify),
      preferredPaymentGateway: merged.preferredPaymentGateway || 'wave_direct',
      loyaltyEarnStepXof: Math.max(100, Math.round(merged.loyaltyEarnStepXof || 500)),
      loyaltyPointValueXof: Math.max(1, Math.round(merged.loyaltyPointValueXof || 25)),
      loyaltyMinRedeemPoints: Math.max(10, Math.round(merged.loyaltyMinRedeemPoints || 100)),
      loyaltyMinOrderXof: Math.max(0, Math.round(merged.loyaltyMinOrderXof || 10000)),
      loyaltyMaxDiscountPercent: Math.min(
        90,
        Math.max(5, Math.round(merged.loyaltyMaxDiscountPercent || 50))
      ),
      updatedAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, 'settings', 'store'), payload);
      pushToast('Paramètres de la boutique enregistrés.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/store');
    }
  };

  const seedDemoCatalogInternal = async () => {
    const batch = writeBatch(db);
    for (const prod of INITIAL_PRODUCTS) {
      const ref = doc(db, 'products', prod.id);
      batch.set(ref, {
        title: prod.title,
        category: prod.category,
        description: prod.description,
        priceXof: prod.priceXof,
        compareAtPriceXof: prod.compareAtPriceXof ?? null,
        imageUrl: prod.imageUrl,
        galleryUrls: prod.galleryUrls || [prod.imageUrl],
        colors: prod.colors || [],
        sizeGuideCategory: prod.sizeGuideCategory || null,
        available: prod.available,
        stock: prod.stock,
        sizes: prod.sizes,
        festiveTags: prod.festiveTags,
        featured: prod.featured,
        salesCount: prod.salesCount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    batch.set(doc(db, 'settings', 'store'), {
      ...DEFAULT_STORE_SETTINGS,
      updatedAt: serverTimestamp(),
    });
    // Seed an example seasonal promo code
    batch.set(doc(db, 'promoCodes', 'LOULOU10'), {
      code: 'LOULOU10',
      description: 'Bienvenue Chez LouLou — -10% sur votre commande dès 15 000 FCFA',
      partnerName: 'Campagne Chez LouLou',
      discountType: 'percent',
      discountValue: 10,
      minOrderXof: 15000,
      maxUses: 500,
      usedCount: 0,
      active: true,
      seasonTag: 'permanent',
      expiresAt: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  };

  const seedDemoCatalog = async () => {
    if (!isAdmin) return;
    try {
      await seedDemoCatalogInternal();
      pushToast('Catalogue initial restauré dans Firestore.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const sendMessageToConversation = async (
    conversationId: string,
    text: string,
    productContext?: Product | null
  ) => {
    if (!user || !user.emailVerified) {
      throw new Error('Connexion Google requise pour envoyer un message.');
    }
    const cleanText = text.trim().slice(0, 1500);
    if (!cleanText) return;

    const senderRole: 'admin' | 'customer' =
      isAdmin && conversationId !== user.uid ? 'admin' : 'customer';

    const convRef = doc(db, 'conversations', conversationId);
    const msgRef = doc(collection(db, 'conversations', conversationId, 'messages'));
    const existingConv = conversations.find((c) => c.id === conversationId);

    const batch = writeBatch(db);
    if (!existingConv) {
      batch.set(convRef, {
        customerId: user.uid,
        customerName: (user.displayName || 'Client').slice(0, 100),
        customerEmail: (user.email || 'client@chezloulou.ci').slice(0, 150),
        lastMessage: cleanText.slice(0, 500),
        lastSenderRole: 'customer',
        unreadByAdmin: true,
        unreadByCustomer: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const updateConv: Record<string, unknown> = {
        lastMessage: cleanText.slice(0, 500),
        lastSenderRole: senderRole,
        unreadByAdmin: senderRole === 'customer',
        unreadByCustomer: senderRole === 'admin',
        updatedAt: serverTimestamp(),
      };
      if (senderRole === 'customer') {
        updateConv.customerName = (user.displayName || existingConv.customerName).slice(0, 100);
        updateConv.customerEmail = (user.email || existingConv.customerEmail).slice(0, 150);
      }
      batch.update(convRef, updateConv);
    }

    const msgPayload: Record<string, unknown> = {
      senderId: user.uid,
      senderName: (
        senderRole === 'admin' ? 'Chez LouLou (Vendeur)' : user.displayName || 'Client'
      ).slice(0, 100),
      senderRole,
      text: cleanText,
      createdAt: serverTimestamp(),
    };
    if (productContext) {
      msgPayload.productId = productContext.id.slice(0, 128);
      msgPayload.productTitle = productContext.title.slice(0, 140);
      msgPayload.productPriceXof = productContext.priceXof;
    }

    batch.set(msgRef, msgPayload);

    if (senderRole === 'customer') {
      const sellerPhone = settings.whatsappPhone || settings.storePhone;
      batch.set(doc(collection(db, 'notifications')), {
        recipientRole: 'admin',
        recipientPhone: sellerPhone.slice(0, 32),
        channel: 'whatsapp',
        event: 'new_message',
        message: `Nouveau message client de ${user.displayName || user.email}: "${cleanText.slice(
          0,
          120
        )}"`,
        status: 'queued',
        createdAt: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
      if (senderRole === 'customer' && settings.whatsappAutoNotify) {
        const sellerPhone = settings.whatsappPhone || settings.storePhone;
        fetch('/api/notifications/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: sellerPhone,
            message: `Nouveau message client sur Chez LouLou (${user.displayName || user.email}): ${cleanText.slice(0, 180)}`,
            channel: 'whatsapp',
          }),
        }).catch(() => {});
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `conversations/${conversationId}/messages`);
    }
  };

  const markConversationRead = async (
    conversationId: string,
    role: 'customer' | 'admin'
  ) => {
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    if (role === 'admin' && !conv.unreadByAdmin) return;
    if (role === 'customer' && !conv.unreadByCustomer) return;

    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        ...(role === 'admin' ? { unreadByAdmin: false } : { unreadByCustomer: false }),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `conversations/${conversationId}`);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        authReady,
        isAdmin,
        products,
        productsLoading,
        lowStockProducts,
        isCatalogSeeded: firestoreProducts.length > 0,
        settings,
        activeSeason,
        previewSeasonId,
        setPreviewSeasonId,
        orders,
        ordersLoading,
        loyaltyAccount,
        allLoyaltyAccounts,
        loyaltyTransactions,
        myReferral,
        capturedReferralCode,
        setCapturedReferralCode,
        promoCodes,
        reviews,
        notifications,
        conversations,
        wishlistIds,
        cart,
        cartCount,
        cartSubtotalXof,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        signInWithGoogle,
        logout,
        validatePromoCode,
        validateReferralCode,
        placeOrder,
        verifyOrderPayment,
        adminMarkOrderPaid,
        cancelCustomerOrder,
        updateOrderStatus,
        grantLoyaltyBonus,
        saveProduct,
        restockProduct,
        toggleProductAvailability,
        deleteProduct,
        savePromoCode,
        togglePromoCode,
        deletePromoCode,
        submitVerifiedReview,
        deleteReview,
        sendWhatsAppNotification,
        saveStoreSettings,
        seedDemoCatalog,
        sendMessageToConversation,
        markConversationRead,
        toasts,
        pushToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
