import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { STUDIO_ASSET_GALLERY } from '../data/seedCatalog';
import { CategoryId, Product, ProductColor, SizeGuideCategory } from '../types/store';
import { FESTIVE_SEASONS } from '../utils/festiveCalendar';
import { CATEGORY_LABELS, compressImageToDataUrl } from '../utils/formatters';
import { ProductImage } from './ProductImage';

interface AdminProductModalProps {
  open: boolean;
  editingProduct: Product | null;
  onClose: () => void;
}

const COLOR_PRESETS: ProductColor[] = [
  { name: 'Prune Royal', hex: '#540B3B' },
  { name: 'Rose Poudré', hex: '#EC4899' },
  { name: 'Or Satiné', hex: '#D4AF37' },
  { name: 'Noir Ébène', hex: '#1E1B18' },
  { name: 'Ivoire Crème', hex: '#F5EFEA' },
  { name: 'Vert Émeraude', hex: '#0F766E' },
];

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  open,
  editingProduct,
  onClose,
}) => {
  const { saveProduct, pushToast } = useStore();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryId>('femme');
  const [sizeGuideCategory, setSizeGuideCategory] = useState<SizeGuideCategory>('vetements');
  const [description, setDescription] = useState('');
  const [priceXof, setPriceXof] = useState(25000);
  const [compareAtPriceXof, setCompareAtPriceXof] = useState<string>('');
  const [stock, setStock] = useState(10);
  const [sizesText, setSizesText] = useState('S, M, L, XL');
  const [imageUrl, setImageUrl] = useState(STUDIO_ASSET_GALLERY[0].url);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [extraUrlInput, setExtraUrlInput] = useState('');
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#540B3B');
  const [available, setAvailable] = useState(true);
  const [featured, setFeatured] = useState(true);
  const [festiveTags, setFestiveTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setTitle(editingProduct.title);
      setCategory(editingProduct.category);
      setSizeGuideCategory(
        editingProduct.sizeGuideCategory ||
          (editingProduct.category === 'enfants'
            ? 'enfants'
            : editingProduct.category === 'cadeaux'
            ? 'accessoires'
            : 'vetements')
      );
      setDescription(editingProduct.description);
      setPriceXof(editingProduct.priceXof);
      setCompareAtPriceXof(
        editingProduct.compareAtPriceXof ? String(editingProduct.compareAtPriceXof) : ''
      );
      setStock(editingProduct.stock);
      setSizesText(editingProduct.sizes.join(', '));
      setImageUrl(editingProduct.imageUrl);
      setGalleryUrls(
        (editingProduct.galleryUrls || []).filter((u) => u && u !== editingProduct.imageUrl)
      );
      setColors(editingProduct.colors || []);
      setAvailable(editingProduct.available);
      setFeatured(editingProduct.featured);
      setFestiveTags(editingProduct.festiveTags || []);
    } else {
      setTitle('');
      setCategory('femme');
      setSizeGuideCategory('vetements');
      setDescription('');
      setPriceXof(25000);
      setCompareAtPriceXof('');
      setStock(10);
      setSizesText('S, M, L');
      setImageUrl(STUDIO_ASSET_GALLERY[0].url);
      setGalleryUrls([]);
      setColors([]);
      setAvailable(true);
      setFeatured(true);
      setFestiveTags([]);
    }
    setExtraUrlInput('');
    setNewColorName('');
  }, [editingProduct, open]);

  if (!open) return null;

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    asGalleryExtra = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataUrl(file, 900, 0.8);
      if (dataUrl.length > 340000) {
        pushToast('Image trop lourde après compression. Utilisez une photo plus légère.', 'error');
        return;
      }
      if (asGalleryExtra) {
        setGalleryUrls((prev) => [...prev, dataUrl].slice(0, 5));
        pushToast('Photo supplémentaire ajoutée à la galerie.', 'success');
      } else {
        setImageUrl(dataUrl);
        pushToast('Image principale importée et optimisée.', 'success');
      }
    } catch {
      pushToast('Impossible de charger cette image.', 'error');
    }
  };

  const handleAddExtraUrl = () => {
    const trimmed = extraUrlInput.trim();
    if (!trimmed) return;
    setGalleryUrls((prev) => Array.from(new Set([...prev, trimmed])).slice(0, 5));
    setExtraUrlInput('');
  };

  const handleAddColor = () => {
    const name = newColorName.trim();
    if (!name) return;
    setColors((prev) => {
      if (prev.some((c) => c.name.toLowerCase() === name.toLowerCase())) return prev;
      return [...prev, { name: name.slice(0, 32), hex: newColorHex }].slice(0, 8);
    });
    setNewColorName('');
  };

  const togglePresetColor = (preset: ProductColor) => {
    setColors((prev) => {
      const exists = prev.some((c) => c.name === preset.name);
      if (exists) return prev.filter((c) => c.name !== preset.name);
      return [...prev, preset].slice(0, 8);
    });
  };

  const toggleFestiveTag = (seasonId: string) => {
    setFestiveTags((prev) =>
      prev.includes(seasonId)
        ? prev.filter((id) => id !== seasonId)
        : [...prev, seasonId].slice(0, 10)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2 || description.trim().length < 2) {
      pushToast('Veuillez renseigner un titre et une description valides.', 'error');
      return;
    }

    setSaving(true);
    try {
      const parsedSizes = sizesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);

      const fullGallery = Array.from(new Set([imageUrl, ...galleryUrls].filter(Boolean))).slice(
        0,
        6
      );

      await saveProduct(
        {
          title,
          category,
          sizeGuideCategory,
          description,
          priceXof: Number(priceXof) || 1000,
          compareAtPriceXof: compareAtPriceXof ? Number(compareAtPriceXof) : null,
          imageUrl,
          galleryUrls: fullGallery,
          colors,
          available,
          stock: Number(stock) || 0,
          sizes: parsedSizes.length > 0 ? parsedSizes : ['Unique'],
          festiveTags,
          featured,
        },
        editingProduct?.id
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--canvas)',
    color: 'var(--ink)',
    borderColor: 'var(--border-hairline)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={editingProduct ? 'Modifier un article' : 'Ajouter un article'}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-2xl border shadow-2xl max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border-hairline)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-4 border-b flex items-center justify-between sticky top-0 z-10"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--ink)' }}>
            {editingProduct ? 'Modifier l’article' : 'Nouvel article'}
          </h2>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Image & Multi-Photo Gallery Column */}
            <div className="md:col-span-5 space-y-3">
              <div
                className="aspect-[4/3] rounded-xl overflow-hidden border"
                style={{
                  backgroundColor: 'var(--surface-subtle)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <ProductImage src={imageUrl} alt={title || 'Aperçu article'} />
              </div>

              <label
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-subtle)',
                  color: 'var(--ink)',
                }}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Photo principale</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, false)}
                  className="hidden"
                />
              </label>

              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>
                  Ou URL photo principale
                </label>
                <input
                  type="text"
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... ou galerie studio"
                  className="w-full px-3 py-1.5 text-xs border rounded-lg"
                  style={inputStyle}
                />
              </div>

              <div>
                <p className="text-[11px] mb-1.5" style={{ color: 'var(--ink-muted)' }}>
                  Photos studio rapides :
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {STUDIO_ASSET_GALLERY.map((asset) => (
                    <button
                      key={asset.label}
                      type="button"
                      onClick={() => setImageUrl(asset.url)}
                      className="px-2 py-1 text-[11px] border rounded cursor-pointer"
                      style={inputStyle}
                    >
                      {asset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra Multi-Photo Gallery */}
              <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--border-hairline)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                    Galerie multi-photos ({galleryUrls.length}/5)
                  </p>
                  <label className="text-[11px] font-medium underline cursor-pointer" style={{ color: 'var(--ink)' }}>
                    + Téléverser
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, true)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={extraUrlInput}
                    onChange={(e) => setExtraUrlInput(e.target.value)}
                    placeholder="Coller URL vue portée / détail..."
                    className="flex-1 px-2.5 py-1.5 text-xs border rounded-lg"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={handleAddExtraUrl}
                    className="px-2.5 py-1.5 text-xs rounded-lg border cursor-pointer"
                    style={inputStyle}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {galleryUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {galleryUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative w-14 h-14 rounded-lg overflow-hidden border"
                        style={{ borderColor: 'var(--border-hairline)' }}
                      >
                        <ProductImage src={url} alt={`Galerie ${idx + 1}`} />
                        <button
                          type="button"
                          onClick={() =>
                            setGalleryUrls((prev) => prev.filter((_, i) => i !== idx))
                          }
                          aria-label="Retirer cette photo"
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded bg-black/70 text-white flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Fields Column */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                  Nom de l’article
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex. Robe Midi Soie Assouindé"
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                  style={inputStyle}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                    Catégorie
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryId)}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                    style={inputStyle}
                  >
                    {(Object.keys(CATEGORY_LABELS) as CategoryId[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                    Guide des tailles
                  </label>
                  <select
                    value={sizeGuideCategory}
                    onChange={(e) => setSizeGuideCategory(e.target.value as SizeGuideCategory)}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                    style={inputStyle}
                  >
                    <option value="vetements">Vêtements Adultes</option>
                    <option value="enfants">Enfants (Âge)</option>
                    <option value="chaussures">Chaussures (EU)</option>
                    <option value="accessoires">Sacs &amp; Coffrets</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                    Stock disponible
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-num border rounded-lg"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                    Prix de vente (FCFA)
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={500}
                    required
                    value={priceXof}
                    onChange={(e) => setPriceXof(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-num border rounded-lg"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                    Ancien prix barré (FCFA, opt.)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={compareAtPriceXof}
                    onChange={(e) => setCompareAtPriceXof(e.target.value)}
                    placeholder="Ex. 35000"
                    className="w-full px-3 py-2 text-sm font-mono-num border rounded-lg"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                  Tailles / formats (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={sizesText}
                  onChange={(e) => setSizesText(e.target.value)}
                  placeholder="S, M, L, XL"
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                  style={inputStyle}
                />
              </div>

              {/* Color Variants Editor */}
              <div className="space-y-2">
                <p className="text-xs font-medium" style={{ color: 'var(--ink)' }}>
                  Variantes couleurs (pastilles)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PRESETS.map((preset) => {
                    const active = colors.some((c) => c.name === preset.name);
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => togglePresetColor(preset)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-md border cursor-pointer"
                        style={{
                          backgroundColor: active ? 'var(--surface-subtle)' : 'var(--canvas)',
                          borderColor: active ? 'var(--accent)' : 'var(--border-hairline)',
                          color: 'var(--ink)',
                        }}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/20"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span>{preset.name}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    aria-label="Couleur personnalisée"
                    className="w-8 h-8 rounded border cursor-pointer"
                    style={{ borderColor: 'var(--border-hairline)' }}
                  />
                  <input
                    type="text"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    placeholder="Nom coloris personnalisé (ex. Terracotta)"
                    className="flex-1 px-3 py-1.5 text-xs border rounded-lg"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer"
                    style={inputStyle}
                  >
                    Ajouter
                  </button>
                </div>

                {colors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {colors.map((c) => (
                      <span
                        key={c.name}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] rounded border"
                        style={inputStyle}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setColors((prev) => prev.filter((x) => x.name !== c.name))
                          }
                          className="hover:text-[#DC2626] cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink)' }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                  style={inputStyle}
                />
              </div>

              <div className="flex flex-wrap gap-5 pt-1">
                <label
                  className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer"
                  style={{ color: 'var(--ink)' }}
                >
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Article disponible à la vente</span>
                </label>

                <label
                  className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer"
                  style={{ color: 'var(--ink)' }}
                >
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Mettre en vedette</span>
                </label>
              </div>
            </div>
          </div>

          {/* Festive Tags */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ink)' }}>
              Saisons &amp; fêtes associées (mise en avant automatique pendant ces périodes)
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.values(FESTIVE_SEASONS)
                .filter((s) => s.id !== 'permanent')
                .map((season) => {
                  const selected = festiveTags.includes(season.id);
                  return (
                    <button
                      key={season.id}
                      type="button"
                      onClick={() => toggleFestiveTag(season.id)}
                      className="px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer"
                      style={
                        selected
                          ? {
                              backgroundColor: 'var(--accent)',
                              color: 'var(--accent-contrast)',
                              borderColor: 'var(--accent)',
                            }
                          : {
                              backgroundColor: 'var(--canvas)',
                              color: 'var(--ink-muted)',
                              borderColor: 'var(--border-hairline)',
                            }
                      }
                    >
                      {season.name}
                    </button>
                  );
                })}
            </div>
          </div>

          <div
            className="pt-4 border-t flex justify-end gap-3"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg cursor-pointer"
              style={{
                backgroundColor: 'var(--surface-subtle)',
                color: 'var(--ink)',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)',
              }}
            >
              {saving
                ? 'Enregistrement...'
                : editingProduct
                ? 'Enregistrer les modifications'
                : 'Publier l’article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
