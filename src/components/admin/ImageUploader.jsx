import { useRef, useState } from 'react';
import { imageUrl } from '../../utils/images.js';

export default function ImageUploader({
  images = [],
  onUpload,
  onRemove,
  onSetPrimary,
  disabled = false,
  max = 8,
  label = 'Images',
  deferred = false,
  hint = '',
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    const room = max - images.length;
    if (room <= 0) return;
    const selected = files.slice(0, room);

    setBusy(true);
    setProgress(
      deferred
        ? `${selected.length} image(s) seront ajoutées à l'enregistrement`
        : `Téléversement de ${selected.length} image(s)...`
    );
    try {
      await onUpload(selected);
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  return (
    <div className="image-uploader">
      <div className="image-uploader-header">
        <label>{label} <span className="muted">({images.length}/{max})</span></label>
        <button
          type="button"
          className="btn btn-contour btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy || images.length >= max}
        >
          + Ajouter une image
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        hidden
        onChange={handleFiles}
      />

      {progress && <p className="muted small">{progress}</p>}
      {hint && <p className="muted small">{hint}</p>}

      {images.length === 0 ? (
        <div className="image-dropzone">
          Aucune image. JPG, PNG, WEBP ou GIF, 5 Mo maximum.
        </div>
      ) : (
        <ul className="image-grid">
          {images.map((img, index) => {
            const isPending = Boolean(img.pending);
            const isPrimary = !isPending && Number(img.is_primary) === 1;
            const src = img.previewUrl || imageUrl(img.image_path) || '/product-placeholder.svg';
            return (
              <li key={img.id || img.previewUrl || `pending-${index}`} className={`image-item ${isPrimary ? 'is-primary' : ''} ${isPending ? 'is-pending' : ''}`}>
                <img src={src} alt={img.alt_text || img.name || ''} />
                {isPrimary && <span className="image-badge">Principale</span>}
                {isPending && <span className="image-badge">En attente</span>}
                <div className="image-item-actions">
                  {!isPrimary && !isPending && onSetPrimary && (
                    <button type="button" className="btn btn-contour btn-xs" onClick={() => onSetPrimary(img)} disabled={disabled}>
                      Principale
                    </button>
                  )}
                  {onRemove && (
                    <button type="button" className="btn btn-danger btn-xs" onClick={() => onRemove(img)} disabled={disabled}>
                      Retirer
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
