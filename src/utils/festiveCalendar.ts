import { FestiveSeason, StoreSettings } from '../types/store';

export const FESTIVE_SEASONS: Record<string, FestiveSeason> = {
  permanent: {
    id: 'permanent',
    name: 'Signature Chez LouLou',
    kind: 'signature',
    periodLabel: 'Collection Permanente',
    bannerText:
      'Chez LouLou Abidjan · Livraison en 24h et Points LouLou gagnés sur chaque commande.',
    heroEyebrow: 'Boutique Chez LouLou · Abidjan, Côte d’Ivoire',
    heroHeadline: 'L’art d’habiller toute la famille et d’offrir avec cœur.',
    heroSubtitle:
      'Une maison ivoirienne dédiée aux pièces choisies pour femme, homme, enfants, jeunes et aux coffrets cadeaux prêts à offrir.',
    ctaLabel: 'Parcourir la boutique',
    featuredCategories: ['femme', 'homme', 'enfants', 'jeunes', 'cadeaux'],
    canvasHex: '#FDF9FB',
    surfaceHex: '#FFFFFF',
    surfaceSubtleHex: '#F7ECF2',
    inkHex: '#23121E',
    inkMutedHex: '#624C5A',
    borderHex: 'rgba(84, 11, 59, 0.12)',
    accentHex: '#540B3B',
    accentHoverHex: '#3D062A',
    accentSoftHex: '#FCE7F3',
    accentContrastHex: '#FFFFFF',
    bannerBgHex: '#540B3B',
    bannerInkHex: '#FDF9FB',
    suggestedDiscountPercent: 0,
  },
  nouvel_an: {
    id: 'nouvel_an',
    name: 'Nouvel An & Vœux',
    kind: 'event',
    periodLabel: '1er – 10 Janvier',
    bannerText:
      'Bonne année chez LouLou : Coffrets vœux, tenues de cérémonie et double plaisir fidélité.',
    heroEyebrow: 'Édition Nouvel An · Chez LouLou Abidjan',
    heroHeadline: 'Commencez l’année avec éclat et attention.',
    heroSubtitle:
      'Sélection raffinée pour femme, homme, enfants, jeunes et coffrets cadeaux prêts à offrir pour vos vœux.',
    ctaLabel: 'Explorer l’édition Nouvel An',
    featuredCategories: ['cadeaux', 'femme', 'homme'],
    canvasHex: '#FCF9F2',
    surfaceHex: '#FFFFFF',
    surfaceSubtleHex: '#F5EFE0',
    inkHex: '#1F1A12',
    inkMutedHex: '#5E5341',
    borderHex: 'rgba(133, 77, 14, 0.14)',
    accentHex: '#854D0E',
    accentHoverHex: '#663B0A',
    accentSoftHex: '#FEF3C7',
    accentContrastHex: '#FFFFFF',
    bannerBgHex: '#2B1F0B',
    bannerInkHex: '#FEF9EC',
    suggestedDiscountPercent: 10,
  },
  harmattan: {
    id: 'harmattan',
    name: 'Saison Sèche & Harmattan',
    kind: 'season',
    periodLabel: 'Janvier – Février & Novembre',
    bannerText:
      'Saison Harmattan : Matières douces, lin respirant et soins parfumés chez LouLou.',
    heroEyebrow: 'Saison Sèche · Côte d’Ivoire',
    heroHeadline: 'Matières nobles et confort sous le soleil d’Abidjan.',
    heroSubtitle:
      'Lin naturel, coton peigné pour enfants, fragrances ambrées et sacs en cuir tanné.',
    ctaLabel: 'Découvrir la saison',
    featuredCategories: ['femme', 'homme', 'cadeaux'],
    canvasHex: '#FBF7F2',
    surfaceHex: '#FFFFFF',
    surfaceSubtleHex: '#F3EAE0',
    inkHex: '#241811',
    inkMutedHex: '#665245',
    borderHex: 'rgba(154, 52, 18, 0.12)',
    accentHex: '#9A3412',
    accentHoverHex: '#7C2D12',
    accentSoftHex: '#FFEDD5',
    accentContrastHex: '#FFFFFF',
    bannerBgHex: '#431407',
    bannerInkHex: '#FFF7ED',
    suggestedDiscountPercent: 0,
  },
  saint_valentin: {
    id: 'saint_valentin',
    name: 'Saint-Valentin',
    kind: 'event',
    periodLabel: '1er – 15 Février',
    bannerText:
      'Saint-Valentin Chez LouLou : Coffrets duo, parfums et emballage cœur offert à Abidjan.',
    heroEyebrow: 'Édition Saint-Valentin · Chez LouLou',
    heroHeadline: 'Des présents choisis pour faire battre les cœurs.',
    heroSubtitle:
      'Parfums ambrés, maroquinerie rose & prune, tenues de soirée et coffrets romantiques livrés en 24h.',
    ctaLabel: 'Choisir un cadeau d’amour',
    featuredCategories: ['cadeaux', 'femme', 'homme'],
    canvasHex: '#FFF6F8',
    surfaceHex: '#FFFFFF',
    surfaceSubtleHex: '#FCE7EE',
    inkHex: '#2A0F1A',
    inkMutedHex: '#6E4556',
    borderHex: 'rgba(157, 23, 77, 0.14)',
    accentHex: '#9D174D',
    accentHoverHex: '#831843',
    accentSoftHex: '#FCE7F3',
    accentContrastHex: '#FFFFFF',
    bannerBgHex: '#500724',
    bannerInkHex: '#FFF1F5',
    suggestedDiscountPercent: 10,
  },
  fete_femme: {
    id: 'fete_femme',
    name: 'Journée de la Femme · 8 Mars',
    kind: 'event',
    periodLabel: '1er – 10 Mars',
    bannerText:
      '8 Mars · Célébrons toutes les femmes chez LouLou avec -15% sur la sélection Femme.',
    heroEyebrow: 'Édition 8 Mars · Chez LouLou Abidjan',
    heroHeadline: 'Honorer la grâce et la force des femmes.',
    heroSubtitle:
      'Robes en soie, sacs en cuir véritable et coffrets bien-être pensés pour célébrer le 8 Mars.',
    ctaLabel: 'Voir la collection Femme',
    featuredCategories: ['femme', 'cadeaux'],
    canvasHex: '#FCF7FA',
    surfaceHex: '#FFFFFF',
    surfaceSubtleHex: '#F5E6F0',
    inkHex: '#241022',
    inkMutedHex: '#634760',
    borderHex: 'rgba(107, 33, 168, 0.14)',
    accentHex: '#6B21A8',
    accentHoverHex: '#581C87',
    accentSoftHex: '#F3E8FF',
    accentContrastHex: '#FFFFFF',
    bannerBgHex: '#3B0764',
    bannerInkHex: '#FAF5FF',
    suggestedDiscountPercent: 15,
  },
  paquinou: {
    id: 'paquinou',
    name: 'Pâques & Paquinou',
    kind: 'event',
    periodLabel: 'Période de Pâques',
    bannerText:
      'Paquinou & Pâques : Tenues de famille assorties, enfants et coffrets de retrouvailles.',
    heroEyebrow: 'Spécial Pâques & Paquinou · Côte d’Ivoire',
    heroHeadline: 'Des retrouvailles familiales tout en couleur.',
    heroSubtitle:
      'Préparez vos voyages et célébrations avec nos collections femme, homme, enfants et présents de famille.',
    ctaLabel: 'Préparer Paquinou',
    featuredCategories: ['enfants', 'femme', 'homme', 'cadeaux'],
    canvasHex: '#F7FBF8',
    surfaceHex: '#FFFFFF',
    surfaceSubtleHex: '#E8F5EC',
    inkHex: '#102418',
    inkMutedHex: '#476152',
    borderHex: 'rgba(22, 101, 52, 0.14)',
    accentHex: '#166534',
    accentHoverHex: '#14532D',
    accentSoftHex: '#DCFCE7',
    accentContrastHex: '#FFFFFF',
    bannerBgHex: '#052E16',
    bannerInkHex: '#F0FDF4',
    suggestedDiscountPercent: 10,
  },
  korite_tabaski: {
    id: 'korite_tabaski',
    name: 'Korité & Tabaski',
    kind: 'event',
    periodLabel: 'Fêtes de l’Aïd',
    bannerText:
      'Célébrations de l’Aïd : Tenues d’apparat, parfums et coffrets cadeaux livrés avant le jour J.',
    heroEyebrow: 'Collection Célébrations & Partage',
    heroHeadline: 'Partagez la joie de la fête avec distinction.',
    heroSubtitle:
      'Chemises en lin, robes de cérémonie, tenues enfants et coffrets parfumés prêts à offrir.',
    ctaLabel: 'Découvrir la sélection fête',
    featuredCategories: ['homme', 'femme', 'enfants', 'cadeaux'],
    canvasHex: '#F4FBFB',
    surfaceHex: '#FFFFFF',
    surfaceSubtleHex: '#E3F4F3',
    inkHex: '#0F2423',
    inkMutedHex: '#436260',
    borderHex: 'rgba(15, 118, 110, 0.14)',
    accentHex: '#0F766E',
    accentHoverHex: '#115E59',
    accentSoftHex: '#CCFBF1',
    accentContrastHex: '#FFFFFF',
    bannerBgHex: '#042F2E',
    bannerInkHex: '#F0FDFA',
    suggestedDiscountPercent: 10,
  },
  fete_meres: {
    id: 'fete_meres',
    name: 'Fête des Mères',
    kind: 'event',
    periodLabel: '15 – 31 Mai',
    bannerText:
      'Fête des Mères en Côte d’Ivoire : Offrez-lui l’exception avec nos coffrets LouLou et sacs en cuir.',
    heroEyebrow: 'Spécial Fête des Mères · Chez LouLou',
    heroHeadline: 'Un hommage tendre à la hauteur de son amour.',
    heroSubtitle:
      'Coffrets bougies & foulards en soie, maroquinerie et pièces féminines avec mot personnalisé.',
    ctaLabel: 'Trouver le cadeau de Maman',
    featuredCategories: ['cadeaux', 'femme'],
    canvasHex: '#FFF7FA',
    surfaceHex: '#FFFFFF',
    surfaceSubtleHex: '#FCE8F0',
    inkHex: '#28111D',
    inkMutedHex: '#694757',
    borderHex: 'rgba(190, 24, 93, 0.14)',
    accentHex: '#BE185D',
    accentHoverHex: '#9D174D',
    accentSoftHex: '#FCE7F3',
    accentContrastHex: '#FFFFFF',
    bannerBgHex: '#500724',
    bannerInkHex: '#FFF1F7',
    suggestedDiscountPercent: 10,
  },
  fete_peres: {
    id: 'fete_peres',
    name: 'Fête des Pères',
    kind: 'event',
    periodLabel: '10 – 22 Juin',
    bannerText:
      'Fête des Pères Chez LouLou : Chemises en lin, montres et eaux de parfum sélectionnés pour lui.',
    heroEyebrow: 'Spécial Fête des Pères · Abidjan',
    heroHeadline: 'Des pièces sobres et durables pour Papa.',
    heroSubtitle:
      'Chemises taillées pour le climat ivoirien, horlogerie épurée et coffrets masculins.',
    ctaLabel: 'Voir la sélection Homme',
    featuredCategories: ['homme', 'cadeaux'],
    canvasHex: '#F5F8FC',
    surfaceHex: '#FFFFFF',
    surfaceSubtleHex: '#E6EEF8',
    inkHex: '#101C2E',
    inkMutedHex: '#465873',
    borderHex: 'rgba(30, 58, 138, 0.14)',
    accentHex: '#1E3A8A',
    accentHoverHex: '#172554',
    accentSoftHex: '#DBEAFE',
    accentContrastHex: '#FFFFFF',
    bannerBgHex: '#0F172A',
    bannerInkHex: '#F8FAFC',
    suggestedDiscountPercent: 10,
  },
  saison_pluies: {
    id: 'saison_pluies',
    name: 'Saison des Pluies & Cocooning',
    kind: 'season',
    periodLabel: 'Juin – Juillet',
    bannerText:
      'Saison fraîche à Abidjan : Hoodies jeunes, tenues chaudes enfants et bougies parfumées.',
    heroEyebrow: 'Saison des Pluies · Côte d’Ivoire',
    heroHeadline: 'Douceur et élégance pour les journées pluvieuses.',
    heroSubtitle:
      'Coton épais pour jeunes et enfants, bougies d’intérieur ambrées et livraison abritée en 24h.',
    ctaLabel: 'Explorer la sélection cocooning',
    featuredCategories: ['jeunes', 'enfants', 'cadeaux'],
    canvasHex: '#F5F9FA',
    surfaceHex: '#FFFFFF',
    surfaceSubtleHex: '#E5EFF2',
    inkHex: '#112126',
    inkMutedHex: '#486067',
    borderHex: 'rgba(21, 94, 117, 0.14)',
    accentHex: '#155E75',
    accentHoverHex: '#164E63',
    accentSoftHex: '#CFFAFE',
    accentContrastHex: '#FFFFFF',
    bannerBgHex: '#083344',
    bannerInkHex: '#ECFEFF',
    suggestedDiscountPercent: 5,
  },
  independance_ci: {
    id: 'independance_ci',
    name: 'Fête Nationale · 7 Août',
    kind: 'event',
    periodLabel: '1er – 10 Août',
    bannerText:
      '7 Août · Bonne fête d’Indépendance à toute la Côte d’Ivoire ! Livraison express nationale.',
    heroEyebrow: 'Édition 7 Août · Côte d’Ivoire',
    heroHeadline: 'Savoir-faire et allure aux couleurs d’ici.',
    heroSubtitle:
      'Célébrez le 7 Août avec des créations soignées pour toute la famille, d’Abidjan à Korhogo.',
    ctaLabel: 'Explorer la boutique',
    featuredCategories: ['femme', 'homme', 'enfants', 'jeunes'],
    canvasHex: '#FFFBF5',
    surfaceHex: '#FFFFFF',
    surfaceSubtleHex: '#FCEEE0',
    inkHex: '#1F160E',
    inkMutedHex: '#635041',
    borderHex: 'rgba(194, 65, 12, 0.14)',
    accentHex: '#C2410C',
    accentHoverHex: '#9A3412',
    accentSoftHex: '#FFEDD5',
    accentContrastHex: '#FFFFFF',
    bannerBgHex: '#14532D',
    bannerInkHex: '#FFFFFF',
    suggestedDiscountPercent: 10,
  },
  rentree_jeunes: {
    id: 'rentree_jeunes',
    name: 'Rentrée & Style Jeunes',
    kind: 'event',
    periodLabel: '24 Août – 20 Septembre',
    bannerText:
      'Rentrée & Campus Chez LouLou : Ensembles jeunes, tenues enfants durables et sacs du quotidien.',
    heroEyebrow: 'Collection Rentrée · Jeunes & Enfants',
    heroHeadline: 'Prêts pour une nouvelle année d’ambition.',
    heroSubtitle:
      'Streetwear respirant, tenues enfants en coton bio et essentiels pensés pour bouger.',
    ctaLabel: 'Voir Jeunes & Enfants',
    featuredCategories: ['jeunes', 'enfants'],
    canvasHex: '#F6F8FD',
    surfaceHex: '#FFFFFF',
    surfaceSubtleHex: '#E8EEFA',
    inkHex: '#11182C',
    inkMutedHex: '#4B5673',
    borderHex: 'rgba(29, 78, 216, 0.14)',
    accentHex: '#1D4ED8',
    accentHoverHex: '#1E40AF',
    accentSoftHex: '#DBEAFE',
    accentContrastHex: '#FFFFFF',
    bannerBgHex: '#172554',
    bannerInkHex: '#EFF6FF',
    suggestedDiscountPercent: 10,
  },
  black_friday: {
    id: 'black_friday',
    name: 'Black Friday · Nuit Privilège',
    kind: 'event',
    periodLabel: '12 – 30 Novembre',
    bannerText:
      'Black Friday Chez LouLou : Thème Privilège activé avec -15% et vos Points LouLou cumulables.',
    heroEyebrow: 'Édition Black Friday · Chez LouLou Abidjan',
    heroHeadline: 'Anticipez vos cadeaux à prix privilège.',
    heroSubtitle:
      'Profitez des sélections Femme, Homme, Enfants, Jeunes et Coffrets Cadeaux dans notre ambiance Nuit Privilège.',
    ctaLabel: 'Profiter des privilèges',
    featuredCategories: ['cadeaux', 'jeunes', 'femme', 'homme'],
    isDarkTheme: true,
    canvasHex: '#151016',
    surfaceHex: '#201922',
    surfaceSubtleHex: '#2C222F',
    inkHex: '#FAF5F8',
    inkMutedHex: '#C9B8C3',
    borderHex: 'rgba(244, 143, 177, 0.18)',
    accentHex: '#E11D48',
    accentHoverHex: '#BE123C',
    accentSoftHex: '#3B1224',
    accentContrastHex: '#FFFFFF',
    bannerBgHex: '#540B3B',
    bannerInkHex: '#FDF2F8',
    suggestedDiscountPercent: 15,
  },
  noel_fin_annee: {
    id: 'noel_fin_annee',
    name: 'Noël & Fêtes de Fin d’Année',
    kind: 'event',
    periodLabel: '1er – 31 Décembre',
    bannerText:
      'Noël Chez LouLou : Coffrets cadeaux de fête, tenues enfants et tenues de gala livrés à temps.',
    heroEyebrow: 'Collection Noël & Réveillon',
    heroHeadline: 'La magie des fêtes dans chaque coffret LouLou.',
    heroSubtitle:
      'Cadeaux sur mesure, tenues de cérémonie pour grands et petits, et livraison prioritaire partout en Côte d’Ivoire.',
    ctaLabel: 'Découvrir les cadeaux de Noël',
    featuredCategories: ['cadeaux', 'enfants', 'femme', 'homme'],
    canvasHex: '#F7FAF7',
    surfaceHex: '#FFFFFF',
    surfaceSubtleHex: '#EBF3EB',
    inkHex: '#1A1313',
    inkMutedHex: '#5B4C4C',
    borderHex: 'rgba(153, 27, 27, 0.14)',
    accentHex: '#991B1B',
    accentHoverHex: '#7F1D1D',
    accentSoftHex: '#FEE2E2',
    accentContrastHex: '#FFFFFF',
    bannerBgHex: '#14532D',
    bannerInkHex: '#FEFCE8',
    suggestedDiscountPercent: 15,
  },
};

function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

const EID_WINDOWS: Array<{ year: number; startMonth: number; startDay: number; endMonth: number; endDay: number }> = [
  { year: 2025, startMonth: 3, startDay: 24, endMonth: 4, endDay: 2 },
  { year: 2025, startMonth: 5, startDay: 30, endMonth: 6, endDay: 9 },
  { year: 2026, startMonth: 3, startDay: 14, endMonth: 3, endDay: 22 },
  { year: 2026, startMonth: 5, startDay: 20, endMonth: 5, endDay: 29 },
  { year: 2027, startMonth: 3, startDay: 3, endMonth: 3, endDay: 12 },
  { year: 2027, startMonth: 5, startDay: 9, endMonth: 5, endDay: 18 },
  { year: 2028, startMonth: 2, startDay: 20, endMonth: 2, endDay: 29 },
  { year: 2028, startMonth: 4, startDay: 28, endMonth: 5, endDay: 7 },
  { year: 2029, startMonth: 2, startDay: 8, endMonth: 2, endDay: 17 },
  { year: 2029, startMonth: 4, startDay: 17, endMonth: 4, endDay: 26 },
  { year: 2030, startMonth: 1, startDay: 28, endMonth: 2, endDay: 6 },
  { year: 2030, startMonth: 4, startDay: 6, endMonth: 4, endDay: 15 },
];

export function detectAutoSeasonForDate(date: Date = new Date()): FestiveSeason {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const inRange = (sm: number, sd: number, em: number, ed: number) => {
    const cur = month * 100 + day;
    return cur >= sm * 100 + sd && cur <= em * 100 + ed;
  };

  if (inRange(1, 1, 1, 10)) return FESTIVE_SEASONS.nouvel_an;
  if (inRange(2, 1, 2, 15)) return FESTIVE_SEASONS.saint_valentin;
  if (inRange(3, 1, 3, 10)) return FESTIVE_SEASONS.fete_femme;

  const easter = getEasterDate(year);
  const easterStart = new Date(easter);
  easterStart.setDate(easter.getDate() - 8);
  const easterEnd = new Date(easter);
  easterEnd.setDate(easter.getDate() + 2);
  if (date >= easterStart && date <= easterEnd) {
    return FESTIVE_SEASONS.paquinou;
  }

  for (const w of EID_WINDOWS) {
    if (w.year === year && inRange(w.startMonth, w.startDay, w.endMonth, w.endDay)) {
      return FESTIVE_SEASONS.korite_tabaski;
    }
  }

  if (inRange(5, 15, 5, 31)) return FESTIVE_SEASONS.fete_meres;
  if (inRange(6, 10, 6, 22)) return FESTIVE_SEASONS.fete_peres;
  if (inRange(6, 1, 7, 31)) return FESTIVE_SEASONS.saison_pluies;
  if (inRange(8, 1, 8, 10)) return FESTIVE_SEASONS.independance_ci;
  if (inRange(8, 24, 9, 20)) return FESTIVE_SEASONS.rentree_jeunes;
  if (inRange(11, 12, 11, 30)) return FESTIVE_SEASONS.black_friday;
  if (inRange(12, 1, 12, 31)) return FESTIVE_SEASONS.noel_fin_annee;
  if (inRange(1, 11, 1, 31) || inRange(11, 1, 11, 11)) return FESTIVE_SEASONS.harmattan;

  return FESTIVE_SEASONS.permanent;
}

export function resolveActiveSeason(
  settings: StoreSettings,
  previewSeasonId?: string | null,
  date: Date = new Date()
): FestiveSeason {
  if (previewSeasonId && FESTIVE_SEASONS[previewSeasonId]) {
    return FESTIVE_SEASONS[previewSeasonId];
  }
  if (settings.festiveMode === 'manual' && FESTIVE_SEASONS[settings.manualSeasonId]) {
    return FESTIVE_SEASONS[settings.manualSeasonId];
  }
  return detectAutoSeasonForDate(date);
}
