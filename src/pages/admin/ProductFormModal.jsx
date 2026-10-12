import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { productService } from '../../services/productService.js';
import { uploadService } from '../../services/uploadService.js';
import { extractError } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { GENDERS } from '../../utils/constants.js';
import Modal from '../../components/admin/Modal.jsx';
import ImageUploader from '../../components/admin/ImageUploader.jsx';

const EMPTY = {
  name: '',
  slug: '',
  short_description: '',
  description: '',
  category_id: '',
  gender: 'unisex',
  price: '',
  old_price: '',
  stock: '',
  is_active: 1,
  is_promo: 0,
  meta_title: '',
  meta_description: '',
  variants: [],
};

function toForm(product) {
  if (!product) return { ...EMPTY, variants: [] };
  return {
    name: product.name || '',
    slug: product.slug || '',
    short_description: product.short_description || '',
    description: product.description || '',
    category_id: String(product.category_id || ''),
    gender: product.gender || 'unisex',
    price: product.price !== null && product.price !== undefined ? String(product.price) : '',
    old_price: product.old_price ? String(product.old_price) : '',
    stock: String(product.stock ?? 0),
    is_active: Number(product.is_active) ? 1 : 0,
    is_promo: Number(product.is_promo) ? 1 : 0,
    meta_title: product.meta_title || '',
    meta_description: product.meta_description || '',
    variants: (product.variants || []).map((v) => ({
      id: v.id,
      size: v.size || '',
      color: v.color || '',
      color_hex: v.color_hex || '',
      stock: String(v.stock ?? 0),
    })),
  };
}

export default function ProductFormModal({ open, product, categories, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]);
  // Fichiers choisis avant la création : le produit n'a pas encore d'ID, donc
  // on ne peut pas les téléverser tout de suite. Ils partent juste après.
  const [pending, setPending] = useState([]);
  const [saving, setSaving] = useState(false);
  const pendingRef = useRef([]);
  const [error, setError] = useState('');

  const isEdit = Boolean(product?.id);

  const clearPending = useCallback(() => {
    pendingRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    pendingRef.current = [];
    setPending([]);
  }, []);

  useEffect(() => {
    if (!open) return;
    setForm(toForm(product));
    setImages(product?.images || []);
    clearPending();
    setError('');
  }, [open, product, clearPending]);

  // pendingRef.current est l'unique source de vérité : il est écrit de façon
  // synchrone avant chaque setPending, donc le nettoyage au démontage dispose
  // toujours des URL d'objet à libérer.
  useEffect(() => {
    return () => {
      pendingRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  // Les catégories racines sont scopées par public, donc un même nom revient
  // plusieurs fois. On regroupe par racine et, dans chaque groupe, on ne
  // propose que les rayons réellement affectables à un produit.
  const rays = useMemo(() => {
    return categories
      .filter((c) => !c.parent_id)
      .map((root) => {
        const children = categories.filter((c) => Number(c.parent_id) === Number(root.id));
        const audience = GENDERS.find((g) => g.value === root.target_audience)?.label || '—';
        return {
          id: root.id,
          label: `${root.name} — ${audience}`,
          options: children.length ? children : [root],
        };
      });
  }, [categories]);

  const set = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const setVariant = (index, field) => (event) => {
    const value = event.target.value;
    setForm((f) => {
      const variants = f.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v));
      return { ...f, variants };
    });
  };

  const addVariant = () => {
    setForm((f) => ({ ...f, variants: [...f.variants, { size: '', color: '', color_hex: '', stock: '0' }] }));
  };

  const removeVariant = (index) => {
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== index) }));
  };

  const variantStockSum = form.variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
  const hasVariants = form.variants.some((v) => v.size.trim() || v.color.trim());

  const handleUpload = useCallback(async (files) => {
    if (!isEdit) {
      const added = files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        pending: true,
      }));
      const next = [...pendingRef.current, ...added];
      pendingRef.current = next;
      setPending(next);
      return;
    }
    try {
      const data = await uploadService.attachToProduct(product.id, files);
      setImages(data.images || []);
      toast.success(`${files.length} image(s) ajoutée(s)`);
    } catch (err) {
      toast.error(extractError(err, "Échec de l'envoi des images"));
    }
  }, [isEdit, product, toast]);

  const handleRemoveImage = useCallback(async (image) => {
    if (image.pending) {
      URL.revokeObjectURL(image.previewUrl);
      const next = pendingRef.current.filter((p) => p.previewUrl !== image.previewUrl);
      pendingRef.current = next;
      setPending(next);
      return;
    }
    try {
      const data = await uploadService.removeFromProduct(product.id, image.id);
      setImages(data.images || []);
      toast.success('Image retirée');
    } catch (err) {
      toast.error(extractError(err, "Échec de la suppression de l'image"));
    }
  }, [product, toast]);

  const handlePrimaryImage = useCallback(async (image) => {
    try {
      const data = await uploadService.setPrimary(product.id, image.id);
      setImages(data.images || []);
      toast.success('Image principale mise à jour');
    } catch (err) {
      toast.error(extractError(err, 'Échec de la mise à jour'));
    }
  }, [product, toast]);

  const validate = () => {
    if (!form.name.trim()) return 'Le nom est requis';
    if (form.price === '' || Number.isNaN(Number(form.price))) return 'Le prix est requis';
    if (Number(form.price) < 0) return 'Le prix ne peut pas être négatif';
    if (!form.category_id) return 'La catégorie est requise';
    if (form.old_price && Number(form.old_price) <= Number(form.price)) {
      return "L'ancien prix doit être supérieur au prix de vente";
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      short_description: form.short_description.trim(),
      description: form.description.trim(),
      category_id: Number(form.category_id),
      gender: form.gender,
      price: Number(form.price),
      old_price: form.old_price ? Number(form.old_price) : '',
      stock: hasVariants ? variantStockSum : parseInt(form.stock, 10) || 0,
      is_active: form.is_active ? 1 : 0,
      is_promo: form.is_promo ? 1 : 0,
      meta_title: form.meta_title.trim(),
      meta_description: form.meta_description.trim(),
      variants: form.variants
        .filter((v) => v.size.trim() || v.color.trim())
        .map((v) => ({
          id: v.id,
          size: v.size.trim(),
          color: v.color.trim(),
          color_hex: v.color_hex.trim(),
          stock: parseInt(v.stock, 10) || 0,
        })),
    };

    setSaving(true);
    setError('');
    try {
      const data = isEdit
        ? await productService.update(product.id, payload)
        : await productService.create(payload);

      // Les images choisies avant la création sont téléversées maintenant que
      // le produit existe. Un échec ici ne doit pas faire perdre le produit.
      const queued = pendingRef.current;
      if (!isEdit && queued.length) {
        const files = queued.map((p) => p.file);
        try {
          await uploadService.attachToProduct(data.id, files);
          toast.success(`${files.length} image(s) ajoutée(s) au produit`);
        } catch (uploadErr) {
          toast.error(`Produit créé, mais l'envoi des images a échoué : ${extractError(uploadErr, "Réessayez")}`);
        }
        clearPending();
      }

      toast.success(data.message || (isEdit ? 'Produit mis à jour' : 'Produit créé'));
      onSaved?.(data);
      onClose?.();
    } catch (err) {
      const message = extractError(err, "Erreur lors de l'enregistrement");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? `Modifier « ${product?.name} »` : 'Nouveau produit'}
      onClose={onClose}
      size="lg"
      footer={(
        <>
          <button type="button" className="btn btn-contour" onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button type="submit" form="product-form" className="btn btn-or" disabled={saving}>
            {saving ? 'Enregistrement...' : isEdit ? 'Enregistrer les modifications' : 'Créer le produit'}
          </button>
        </>
      )}
    >
      <form id="product-form" onSubmit={handleSubmit} className="admin-form-grid">
        {error && <p className="error-msg full">{error}</p>}

        <fieldset className="full">
          <legend>Informations</legend>

          <div className="field-row">
            <div className="field">
              <label htmlFor="p-name">Nom du produit *</label>
              <input id="p-name" value={form.name} onChange={set('name')} required maxLength={255} />
            </div>
            <div className="field">
              <label htmlFor="p-slug">Slug URL</label>
              <input
                id="p-slug"
                value={form.slug}
                onChange={set('slug')}
                placeholder="généré automatiquement"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="p-short">Description courte</label>
            <input id="p-short" value={form.short_description} onChange={set('short_description')} maxLength={500} />
          </div>

          <div className="field">
            <label htmlFor="p-desc">Description complète</label>
            <textarea id="p-desc" rows={5} value={form.description} onChange={set('description')} />
          </div>
        </fieldset>

        <fieldset>
          <legend>Classement</legend>

          <div className="field">
            <label htmlFor="p-cat">Rayon *</label>
            <select id="p-cat" value={form.category_id} onChange={set('category_id')} required>
              <option value="">— Choisir —</option>
              {rays.map((rayon) => (
                <optgroup key={rayon.id} label={rayon.label}>
                  {rayon.options.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="muted small">
              La catégorie de-rayon est déduite automatiquement du rayon choisi.
            </p>
          </div>

          <div className="field">
            <label htmlFor="p-gender">Public cible</label>
            <select id="p-gender" value={form.gender} onChange={set('gender')}>
              {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
        </fieldset>

        <fieldset>
          <legend>Prix et stock</legend>

          <div className="field-row">
            <div className="field">
              <label htmlFor="p-price">Prix de vente (FCFA) *</label>
              <input id="p-price" type="number" min="0" step="1" value={form.price} onChange={set('price')} required />
            </div>
            <div className="field">
              <label htmlFor="p-oldprice">Ancien prix</label>
              <input id="p-oldprice" type="number" min="0" step="1" value={form.old_price} onChange={set('old_price')} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="p-stock">
              Stock total {hasVariants && <span className="muted">(calculé : {variantStockSum})</span>}
            </label>
            <input
              id="p-stock"
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={set('stock')}
              disabled={hasVariants}
            />
          </div>

          <div className="field field-inline">
            <label className="switch">
              <input type="checkbox" checked={form.is_active === 1} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked ? 1 : 0 }))} />
              <span>Produit visible en boutique</span>
            </label>
          </div>

          <div className="field field-inline">
            <label className="switch">
              <input type="checkbox" checked={form.is_promo === 1} onChange={(e) => setForm((f) => ({ ...f, is_promo: e.target.checked ? 1 : 0 }))} />
              <span>En promotion</span>
            </label>
          </div>
        </fieldset>

        <fieldset className="full">
          <legend>Variantes (tailles / couleurs)</legend>
          {form.variants.length === 0 && <p className="muted">Aucune variante. Le stock global s'applique.</p>}
          {form.variants.map((v, index) => (
            <div key={v.id ?? `new-${index}`} className="variant-row">
              <input value={v.size} onChange={setVariant(index, 'size')} placeholder="Taille (S, M, 38…)" maxLength={20} />
              <input value={v.color} onChange={setVariant(index, 'color')} placeholder="Couleur" maxLength={50} />
              <input value={v.color_hex} onChange={setVariant(index, 'color_hex')} placeholder="#000000" maxLength={7} />
              <input type="number" min="0" step="1" value={v.stock} onChange={setVariant(index, 'stock')} placeholder="Stock" />
              <button type="button" className="btn btn-danger btn-xs" onClick={() => removeVariant(index)}>×</button>
            </div>
          ))}
          <button type="button" className="btn btn-contour btn-sm" onClick={addVariant}>+ Ajouter une variante</button>
        </fieldset>

        <fieldset className="full">
          <legend>Images</legend>
          <ImageUploader
            images={[...images, ...pending]}
            onUpload={handleUpload}
            onRemove={handleRemoveImage}
            onSetPrimary={handlePrimaryImage}
            disabled={saving}
            deferred={!isEdit}
            hint={!isEdit && pending.length
              ? 'Ces images seront ajoutées automatiquement quand vous cliquez sur « Créer le produit ».'
              : ''}
          />
        </fieldset>

        <fieldset className="full">
          <legend>Référencement (SEO)</legend>
          <div className="field">
            <label htmlFor="p-mt">Titre SEO</label>
            <input id="p-mt" value={form.meta_title} onChange={set('meta_title')} maxLength={255} />
          </div>
          <div className="field">
            <label htmlFor="p-md">Méta description</label>
            <textarea id="p-md" rows={2} value={form.meta_description} onChange={set('meta_description')} maxLength={500} />
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
