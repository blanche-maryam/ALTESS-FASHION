export default function Loader({ message = 'Chargement...' }) {
  return (
    <div className="loader">
      <div className="loader-spinner" />
      <p>{message}</p>
    </div>
  );
}