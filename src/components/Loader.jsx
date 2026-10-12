export default function Loader({ message = 'Chargement...' }) {
  return (
    <div className="loader">
      <div className="loader-spinner" />
      <p className="anim-pulse">{message}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="product-card" aria-hidden="true">
      <div className="skeleton" style={{ height: 300 }} />
      <div className="product-info">
        <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 18, width: '80%', marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 22, width: '30%' }} />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr aria-hidden="true">
      <td><div className="skeleton" style={{ height: 42, width: 42 }} /></td>
      <td><div className="skeleton" style={{ height: 16, width: '70%' }} /></td>
      <td><div className="skeleton" style={{ height: 16, width: '50%' }} /></td>
      <td><div className="skeleton" style={{ height: 16, width: '35%' }} /></td>
      <td><div className="skeleton" style={{ height: 16, width: '25%' }} /></td>
    </tr>
  );
}
