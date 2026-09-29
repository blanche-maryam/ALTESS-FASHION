import Modal from './Modal.jsx';

export default function ConfirmDialog({ open, title = 'Confirmer', message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', danger = false, loading = false, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      size="sm"
      footer={(
        <>
          <button type="button" className="btn btn-contour" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-or'}`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Veuillez patienter...' : confirmLabel}
          </button>
        </>
      )}
    >
      <p className="confirm-message">{message}</p>
    </Modal>
  );
}
