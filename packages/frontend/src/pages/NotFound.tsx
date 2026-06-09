import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="text-center py-16">
      <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-700">404</h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Página no encontrada</p>
      <Link
        to="/catalog"
        className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
      >
        Volver al catálogo
      </Link>
    </div>
  );
}
