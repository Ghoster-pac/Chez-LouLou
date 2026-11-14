import heroBoutiqueImg from '../assets/images/hero_boutique_eburnie_1794560070181.jpg';
import robeFemmeImg from '../assets/images/product_femme_robe_1794560070279.jpg';
import chemiseHommeImg from '../assets/images/product_homme_chemise_1794560070321.jpg';
import ensembleEnfantImg from '../assets/images/product_enfant_ensemble_1794560071318.jpg';
import streetwearJeuneImg from '../assets/images/product_jeune_streetwear_1794560071227.jpg';
import coffretCadeauImg from '../assets/images/product_cadeau_coffret_1794560072026.jpg';
import sacFemmeImg from '../assets/images/product_femme_sac_1794560072928.jpg';
import parfumCadeauImg from '../assets/images/product_cadeau_parfum_1794560072467.jpg';
import { Product, StoreSettings } from '../types/store';

export const HERO_BOUTIQUE_IMAGE = heroBoutiqueImg;

export const STUDIO_ASSET_GALLERY: Array<{ label: string; url: string }> = [
  { label: 'Robe Terracotta', url: robeFemmeImg },
  { label: 'Sac Cuir Cognac', url: sacFemmeImg },
  { label: 'Chemise Lin & Montre', url: chemiseHommeImg },
  { label: 'Ensemble Enfant Ocre', url: ensembleEnfantImg },
  { label: 'Pack Streetwear Jeune', url: streetwearJeuneImg },
  { label: 'Coffret Cadeau Satin', url: coffretCadeauImg },
  { label: 'Parfum Ambre Nocturne', url: parfumCadeauImg },
];

const ASSET_PATH_MAP: Record<string, string> = {
  '/src/assets/images/hero_boutique_eburnie_1794560070181.jpg': heroBoutiqueImg,
  '/src/assets/images/product_femme_robe_1794560070279.jpg': robeFemmeImg,
  '/src/assets/images/product_homme_chemise_1794560070321.jpg': chemiseHommeImg,
  '/src/assets/images/product_enfant_ensemble_1794560071318.jpg': ensembleEnfantImg,
  '/src/assets/images/product_jeune_streetwear_1794560071227.jpg': streetwearJeuneImg,
  '/src/assets/images/product_cadeau_coffret_1794560072026.jpg': coffretCadeauImg,
  '/src/assets/images/product_femme_sac_1794560072928.jpg': sacFemmeImg,
  '/src/assets/images/product_cadeau_parfum_1794560072467.jpg': parfumCadeauImg,
};

export function resolveProductImageUrl(url: string): string {
  return ASSET_PATH_MAP[url] || url;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  festiveMode: 'auto',
  manualSeasonId: 'permanent',
  customBannerText: '',
  festiveDiscountPercent: 0,
  freeDeliveryThresholdXof: 50000,
  standardDeliveryFeeXof: 2000,
  storePhone: '+225 07 00 00 00 00',
  whatsappPhone: '+225 07 00 00 00 00',
  whatsappAutoNotify: true,
  preferredPaymentGateway: 'wave_direct',
  loyaltyEarnStepXof: 500,
  loyaltyPointValueXof: 25,
  loyaltyMinRedeemPoints: 100,
  loyaltyMinOrderXof: 10000,
  loyaltyMaxDiscountPercent: 50,
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_femme_robe_assouinde',
    title: 'Robe Midi Soie Assouindé',
    category: 'femme',
    description:
      'Robe midi coupée dans une soie lavée couleur terracotta avec galon tissé géométrique et ceinture amovible à boucle laiton. Légère et respirante pour le climat d’Abidjan.',
    priceXof: 38500,
    compareAtPriceXof: 45000,
    imageUrl: robeFemmeImg,
    galleryUrls: [robeFemmeImg, coffretCadeauImg],
    colors: [
      { name: 'Terracotta', hex: '#B45309' },
      { name: 'Prune', hex: '#540B3B' },
      { name: 'Ivoire', hex: '#EDE7DF' },
    ],
    sizeGuideCategory: 'vetements',
    available: true,
    stock: 14,
    sizes: ['S', 'M', 'L', 'XL'],
    festiveTags: ['fete_femme', 'fete_meres', 'noel_fin_annee', 'saint_valentin'],
    featured: true,
    salesCount: 28,
  },
  {
    id: 'prod_femme_sac_cocody',
    title: 'Sac Structuré Cuir Cocody',
    category: 'femme',
    description:
      'Sac à main en cuir pleine fleur tannage végétal teinte cognac, fermoir laiton brossé et bandoulière réglable. Idéal pour offrir ou accompagner vos tenues de ville.',
    priceXof: 54000,
    compareAtPriceXof: 62000,
    imageUrl: sacFemmeImg,
    galleryUrls: [sacFemmeImg, coffretCadeauImg],
    colors: [
      { name: 'Cognac', hex: '#9A3412' },
      { name: 'Prune', hex: '#540B3B' },
      { name: 'Noir', hex: '#181615' },
    ],
    sizeGuideCategory: 'accessoires',
    available: true,
    stock: 8,
    sizes: ['Unique'],
    festiveTags: ['fete_meres', 'saint_valentin', 'fete_femme', 'black_friday'],
    featured: true,
    salesCount: 19,
  },
  {
    id: 'prod_homme_chemise_plateau',
    title: 'Chemise Lin Pur Plateau',
    category: 'homme',
    description:
      'Chemise manches longues en lin naturel sable à coupe droite soignée. Tissu respirant haute tenue, boutons en nacre véritable, parfaite du bureau aux cérémonies.',
    priceXof: 29000,
    compareAtPriceXof: null,
    imageUrl: chemiseHommeImg,
    galleryUrls: [chemiseHommeImg],
    colors: [
      { name: 'Sable', hex: '#D6C7B2' },
      { name: 'Blanc Nacre', hex: '#F9FAFB' },
      { name: 'Bleu Nuit', hex: '#1E3A8A' },
    ],
    sizeGuideCategory: 'vetements',
    available: true,
    stock: 22,
    sizes: ['M', 'L', 'XL', 'XXL'],
    festiveTags: ['fete_peres', 'korite_tabaski', 'independance_ci', 'harmattan'],
    featured: true,
    salesCount: 34,
  },
  {
    id: 'prod_enfant_ensemble_assinie',
    title: 'Ensemble Coton Bio Assinie',
    category: 'enfants',
    description:
      'Ensemble deux pièces pour enfant en molleton léger 100 % coton peigné ocre et écru, broderie fine et finitions douces pour la peau.',
    priceXof: 18500,
    compareAtPriceXof: 22000,
    imageUrl: ensembleEnfantImg,
    galleryUrls: [ensembleEnfantImg],
    colors: [
      { name: 'Ocre & Écru', hex: '#C27803' },
      { name: 'Rose Poudré', hex: '#F48FB1' },
      { name: 'Sauge', hex: '#4D7C0F' },
    ],
    sizeGuideCategory: 'enfants',
    available: true,
    stock: 25,
    sizes: ['2-3 ans', '4-5 ans', '6-8 ans', '9-10 ans'],
    festiveTags: ['paquinou', 'noel_fin_annee', 'rentree_jeunes', 'korite_tabaski'],
    featured: true,
    salesCount: 41,
  },
  {
    id: 'prod_jeune_pack_marcory',
    title: 'Hoodie & Casquette Archive Urbaine',
    category: 'jeunes',
    description:
      'Ensemble streetwear jeune composé d’un hoodie coupe ample en coton épais vert olive et d’une casquette structurée ton sur ton.',
    priceXof: 32000,
    compareAtPriceXof: 38000,
    imageUrl: streetwearJeuneImg,
    galleryUrls: [streetwearJeuneImg],
    colors: [
      { name: 'Vert Olive', hex: '#3F6212' },
      { name: 'Anthracite', hex: '#27272A' },
      { name: 'Bordeaux', hex: '#7F1D1D' },
    ],
    sizeGuideCategory: 'vetements',
    available: true,
    stock: 16,
    sizes: ['XS', 'S', 'M', 'L'],
    festiveTags: ['rentree_jeunes', 'black_friday', 'noel_fin_annee', 'saison_pluies'],
    featured: true,
    salesCount: 25,
  },
  {
    id: 'prod_cadeau_coffret_eburnie',
    title: 'Coffret Privilège Bougie & Foulard Soie',
    category: 'cadeaux',
    description:
      'Coffret cadeau prêt à offrir : bougie artisanale bois de santal & vanille, foulard en soie imprimé bordeaux et ruban satin avec carte de vœux personnalisable.',
    priceXof: 27500,
    compareAtPriceXof: 32000,
    imageUrl: coffretCadeauImg,
    galleryUrls: [coffretCadeauImg, parfumCadeauImg],
    colors: [
      { name: 'Prune & Or', hex: '#540B3B' },
      { name: 'Rose Poudré', hex: '#F48FB1' },
    ],
    sizeGuideCategory: 'accessoires',
    available: true,
    stock: 19,
    sizes: ['Coffret Standard'],
    festiveTags: ['saint_valentin', 'fete_meres', 'noel_fin_annee', 'nouvel_an', 'black_friday'],
    featured: true,
    salesCount: 47,
  },
  {
    id: 'prod_cadeau_parfum_ambre',
    title: 'Eau de Parfum Ambre Nocturne 100ml',
    category: 'cadeaux',
    description:
      'Fragrance mixte ambrée aux notes de cardamome, cèdre chaud et fève tonka. Présentée dans son flacon facetté avec pochon en lin naturel.',
    priceXof: 42000,
    compareAtPriceXof: 48000,
    imageUrl: parfumCadeauImg,
    galleryUrls: [parfumCadeauImg, coffretCadeauImg],
    colors: [{ name: 'Ambre Doré', hex: '#92400E' }],
    sizeGuideCategory: 'accessoires',
    available: true,
    stock: 2,
    sizes: ['100 ml'],
    festiveTags: ['saint_valentin', 'fete_peres', 'korite_tabaski', 'noel_fin_annee', 'black_friday'],
    featured: true,
    salesCount: 31,
  },
];
