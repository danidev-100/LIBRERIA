import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../api/products.js";
import { useCart } from "../context/CartContext.js";
import type { Product } from "../types/index.js";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(price);
}

function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    onAddToCart(product, quantity);
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {product.code}
      </h3>
      <p className="mt-1 text-sm text-gray-900 line-clamp-2 flex-1">
        {product.description}
      </p>
      <p className="mt-2 text-lg font-bold text-gray-900">
        {formatPrice(product.price)}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-medium">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((q) => q + 1)}
          className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className={`mt-3 w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          added
            ? "bg-green-600 text-white"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {added ? "✓ Agregado" : "Agregar al Carrito"}
      </button>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-gray-200 bg-white p-4"
        >
          <div className="h-3 w-16 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-full rounded bg-gray-200" />
          <div className="mt-1 h-4 w-3/4 rounded bg-gray-200" />
          <div className="mt-3 h-6 w-24 rounded bg-gray-200" />
          <div className="mt-4 flex gap-2">
            <div className="h-8 w-8 rounded bg-gray-200" />
            <div className="h-8 w-8 rounded bg-gray-200" />
            <div className="h-8 w-8 rounded bg-gray-200" />
          </div>
          <div className="mt-3 h-9 w-full rounded-lg bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addItem } = useCart();

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["products", debouncedSearch, page],
    queryFn: () => getProducts(debouncedSearch || undefined, page, 20),
  });

  function handleAddToCart(product: Product, quantity: number) {
    addItem(product, quantity);
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscá por código o descripción..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* Loading */}
      {isLoading && <ProductGridSkeleton />}

      {/* Error */}
      {isError && (
        <div className="rounded-lg bg-red-50 p-6 text-center border border-red-200">
          <p className="text-red-700">
            {error instanceof Error ? error.message : "Error al cargar productos"}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Empty results */}
      {data && data.products.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">
            {debouncedSearch
              ? `No se encontraron productos para "${debouncedSearch}"`
              : "No hay productos disponibles"}
          </p>
        </div>
      )}

      {/* Product grid */}
      {data && data.products.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.products.map((product) => (
              <ProductCard
                key={product.code}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {data.page} de {data.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.totalPages}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}
