import {
  CategoryId,
  LoyaltyTransactionType,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  SizeGuideCategory,
  StoreSettings,
} from '../types/store';

export const CHEZ_LOULOU_LOGO_URL =
  '/assets/aistudio/06877444-E4EF-4E1C-97BF-2A13244E950C_5e857c0b.png';

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  femme: 'Femme',
  homme: 'Homme',
  enfants: 'Enfants',
  jeunes: 'Jeunes',
  cadeaux: 'Cadeaux',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  delivering: 'En livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  wave: 'Wave Côte d’Ivoire',
  orange_money: 'Orange Money',
  mtn_momo: 'MTN MoMo',
  card: 'Carte Bancaire (Visa / Mastercard)',
  cash_on_delivery: 'Paiement à la livraison',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'À régler',
  pending_verification: 'Vérification en cours',
  paid: 'Payé et vérifié',
  failed: 'Échec paiement',
};

export const LOYALTY_TX_LABELS: Record<LoyaltyTransactionType, string> = {
  welcome: 'Cadeau de bienvenue',
  earn: 'Achat validé',
  redeem: 'Remise utilisée',
  refund: 'Remboursement annulation',
  bonus: 'Bonus Chez LouLou',
  referral: 'Bonus parrainage',
};

export const ABIDJAN_COMMUNES = [
  'Cocody',
  'Plateau',
  'Marcory / Zone 4',
  'Treichville',
  'Koumassi',
  'Port-Bouët',
  'Yopougon',
  'Abobo',
  'Adjamé',
  'Attécoubé',
  'Bingerville',
  'Anyama',
  'Songon',
];

export const INTERIOR_CITIES = [
  'Abidjan',
  'Grand-Bassam',
  'Assinie',
  'Yamoussoukro',
  'Bouaké',
  'San-Pedro',
  'Daloa',
  'Korhogo',
  'Man',
  'Gagnoa',
  'Abengourou',
];

export const SIZE_GUIDES: Record<
  SizeGuideCategory,
  { title: string; columns: string[]; rows: string[][] }
> = {
  vetements: {
    title: 'Guide des tailles Adultes & Jeunes',
    columns: ['Taille', 'Poitrine (cm)', 'Taille (cm)', 'Hanches (cm)'],
    rows: [
      ['XS', '80 - 84', '62 - 66', '86 - 90'],
      ['S', '85 - 90', '67 - 72', '91 - 96'],
      ['M', '91 - 96', '73 - 78', '97 - 102'],
      ['L', '97 - 104', '79 - 86', '103 - 110'],
      ['XL', '105 - 112', '87 - 94', '111 - 118'],
      ['XXL', '113 - 122', '95 - 104', '119 - 128'],
    ],
  },
  enfants: {
    title: 'Guide des tailles Enfants',
    columns: ['Âge', 'Stature (cm)', 'Poitrine (cm)', 'Tour de taille (cm)'],
    rows: [
      ['2-3 ans', '92 - 98', '53 - 55', '50 - 52'],
      ['4-5 ans', '104 - 110', '56 - 58', '53 - 55'],
      ['6-8 ans', '116 - 128', '60 - 64', '56 - 59'],
      ['9-10 ans', '134 - 140', '66 - 70', '60 - 63'],
    ],
  },
  chaussures: {
    title: 'Pointures Chaussures (EU / CI)',
    columns: ['Pointure', 'Longueur pied (cm)'],
    rows: [
      ['36', '23.0 cm'],
      ['38', '24.3 cm'],
      ['40', '25.5 cm'],
      ['42', '26.8 cm'],
      ['44', '28.0 cm'],
    ],
  },
  accessoires: {
    title: 'Dimensions Maroquinerie & Coffrets',
    columns: ['Format', 'Dimensions approximatives'],
    rows: [
      ['Sac structuré', '28 × 21 × 11 cm (bandoulière réglable)'],
      ['Coffret Cadeau Standard', '26 × 20 × 10 cm (ruban satin)'],
      ['Flacon Parfum 100 ml', 'Hauteur 13 cm · pochon lin inclus'],
    ],
  },
};

export function resolveSizeGuideCategory(
  category: CategoryId,
  explicit?: SizeGuideCategory | null
): SizeGuideCategory {
  if (explicit) return explicit;
  if (category === 'enfants') return 'enfants';
  if (category === 'cadeaux') return 'accessoires';
  return 'vetements';
}

export function formatXof(amount: number): string {
  const safe = Math.round(Number.isFinite(amount) ? amount : 0);
  return `${safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;
}

export function getLoyaltyTier(totalEarned: number): {
  name: string;
  nextTierName: string | null;
  nextThreshold: number | null;
} {
  if (totalEarned >= 1000) {
    return { name: 'VIP Étoile', nextTierName: null, nextThreshold: null };
  }
  if (totalEarned >= 300) {
    return { name: 'Membre Prune', nextTierName: 'VIP Étoile', nextThreshold: 1000 };
  }
  return { name: 'Membre Rose', nextTierName: 'Membre Prune', nextThreshold: 300 };
}

export function calculateEarnedPoints(netAmountXof: number, settings: StoreSettings): number {
  const step = Math.max(100, settings.loyaltyEarnStepXof || 500);
  return Math.max(0, Math.floor(netAmountXof / step));
}

export function calculateMaxRedeemablePoints(
  balance: number,
  subtotalAfterDiscountsXof: number,
  settings: StoreSettings
): number {
  const minRedeem = Math.max(10, settings.loyaltyMinRedeemPoints || 100);
  const minOrder = Math.max(0, settings.loyaltyMinOrderXof || 10000);
  const pointVal = Math.max(1, settings.loyaltyPointValueXof || 25);
  const maxPct = Math.min(90, Math.max(5, settings.loyaltyMaxDiscountPercent || 50));

  if (balance < minRedeem || subtotalAfterDiscountsXof < minOrder) return 0;

  const maxDiscountXof = Math.floor((subtotalAfterDiscountsXof * maxPct) / 100);
  const maxPtsByOrder = Math.floor(maxDiscountXof / pointVal);
  const maxPts = Math.min(balance, maxPtsByOrder);
  return maxPts >= minRedeem ? maxPts : 0;
}

export function generateReferralCode(nameOrEmail: string, uid: string): string {
  const cleanPrefix = (nameOrEmail || 'LOULOU')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 5);
  const suffix = uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
  return `LL-${cleanPrefix || 'VIP'}${suffix || '2026'}`;
}

export function normalizeCiPhoneDigits(phone: string): string {
  const digits = (phone || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('225')) return digits;
  if (digits.length === 10) return `225${digits}`;
  return digits;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = normalizeCiPhoneDigits(phone);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildSmsUrl(phone: string, message: string): string {
  const digits = normalizeCiPhoneDigits(phone);
  return `sms:+${digits}?body=${encodeURIComponent(message)}`;
}

export function buildOrderNotificationMessage(order: Order, nextStatus: OrderStatus): string {
  const statusMsg: Record<OrderStatus, string> = {
    pending: `Bonjour ${order.customerName}, votre commande ${order.orderNumber} (${formatXof(
      order.totalXof
    )}) a bien été enregistrée chez Chez LouLou Abidjan.`,
    confirmed: `Bonjour ${order.customerName}, bonne nouvelle ! Votre commande ${order.orderNumber} (${formatXof(
      order.totalXof
    )}) est CONFIRMÉE chez Chez LouLou. +${order.pointsEarned} Points LouLou ont été ajoutés à votre compte.`,
    preparing: `Bonjour ${order.customerName}, votre commande ${order.orderNumber} est en cours de préparation soignée dans notre boutique Chez LouLou.`,
    delivering: `Bonjour ${order.customerName}, votre livreur Chez LouLou est en route vers ${order.commune} (${order.city}) pour votre commande ${order.orderNumber}. Montant : ${
      order.paymentStatus === 'paid' ? 'Déjà payé en ligne' : formatXof(order.totalXof)
    }.`,
    delivered: `Merci ${order.customerName} ! Votre commande ${order.orderNumber} a été LIVRÉE. Partagez votre avis vérifié sur Chez LouLou et profitez de vos Points LouLou !`,
    cancelled: `Bonjour ${order.customerName}, votre commande ${order.orderNumber} chez Chez LouLou a été annulée.`,
  };
  return statusMsg[nextStatus];
}

export function toJsDate(ts: unknown): Date {
  if (!ts) return new Date();
  if (ts instanceof Date) return ts;
  if (
    typeof ts === 'object' &&
    ts !== null &&
    'toDate' in ts &&
    typeof (ts as { toDate: () => Date }).toDate === 'function'
  ) {
    return (ts as { toDate: () => Date }).toDate();
  }
  if (typeof ts === 'object' && ts !== null && 'seconds' in ts) {
    return new Date((ts as { seconds: number }).seconds * 1000);
  }
  if (typeof ts === 'string' || typeof ts === 'number') {
    const parsed = new Date(ts);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export function formatDateFr(ts: unknown): string {
  const d = toJsDate(ts);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatDateTimeFr(ts: unknown): string {
  const d = toJsDate(ts);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function generateOrderNumber(): string {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CL-${y}${m}${d}-${rand}`;
}

export function compressImageToDataUrl(
  file: File,
  maxDimension = 900,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format image invalide.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas indisponible.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
