import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts } from "../api/products.js";
import * as viajanteApi from "../api/viajante.js";
import type { Product, OrderStatus } from "../types/index.js";
import type { ViajanteClient } from "../api/viajante.js";
import { ApiClientError } from "../api/client.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(price);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusColors: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

// ---------------------------------------------------------------------------
// Viajante cart item (local state, not the global CartContext)
// ---------------------------------------------------------------------------

interface ViajanteCartItem {
  product: Product;
  quantity: number;
}

// ---------------------------------------------------------------------------
// ClientSelector
// ---------------------------------------------------------------------------

function ClientSelector({
  selected,
  onSelect,
}: {
  selected: ViajanteClient | null;
  onSelect: (client: ViajanteClient) => void;
}) {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["viajante-clients", search],
    queryFn: () => viajanteApi.getClients(1, 20),
    enabled: showDropdown,
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredClients = data?.clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  ) ?? [];

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Cliente
      </label>
      {selected ? (
        <div className="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 px-4 py-2.5">
          <div>
            <p className="text-sm font-medium text-gray-900">{selected.name}</p>
            <p className="text-xs text-gray-500">{selected.email}</p>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null as unknown as ViajanteClient)}
            className="ml-auto text-xs text-red-600 hover:text-red-800"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Buscar cliente por nombre o email..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
          {showDropdown && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto">
              {isLoading && (
                <p className="px-4 py-3 text-sm text-gray-500">Buscando...</p>
              )}
              {!isLoading && filteredClients.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-500">
                  No se encontraron clientes
                </p>
              )}
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => {
                    onSelect(client);
                    setSearch("");
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium text-gray-900">{client.name}</span>
                  <span className="ml-2 text-gray-400">{client.email}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProductCard for viajante
// ---------------------------------------------------------------------------

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (product: Product, quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    onAdd(product, quantity);
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <h3 className="text-xs font-medium text-gray-500 uppercase">{product.code}</h3>
      <p className="mt-1 text-sm text-gray-900 line-clamp-2 flex-1">
        {product.description}
      </p>
      <p className="mt-1 text-base font-bold text-gray-900">
        {formatPrice(product.price)}
      </p>

      <div className="mt-3 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm"
        >
          −
        </button>
        <span className="w-7 text-center text-sm font-medium">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((q) => q + 1)}
          className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleAdd}
          className={`ml-auto rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            added
              ? "bg-green-600 text-white"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {added ? "✓" : "Agregar"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

type PanelTab = "tomar-pedido" | "mis-pedidos";

export default function ViajantePanelPage() {
  const [tab, setTab] = useState<PanelTab>("tomar-pedido");
  const queryClient = useQueryClient();

  // --- Tab: Tomar Pedido ---
  const [selectedClient, setSelectedClient] = useState<ViajanteClient | null>(null);
  const [cartItems, setCartItems] = useState<ViajanteCartItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce product search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(productSearch);
      setProductPage(1);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [productSearch]);

  const productQuery = useQuery({
    queryKey: ["products", debouncedSearch, productPage],
    queryFn: () => getProducts(debouncedSearch || undefined, productPage, 20),
  });

  // --- Tab: Mis Pedidos ---
  const [orderPage, setOrderPage] = useState(1);

  const ordersQuery = useQuery({
    queryKey: ["viajante-orders", orderPage],
    queryFn: () => viajanteApi.getOrders(orderPage, 20),
    enabled: tab === "mis-pedidos",
  });

  // --- Create order mutation ---
  const createOrderMutation = useMutation({
    mutationFn: (body: viajanteApi.CreateViajanteOrderBody) =>
      viajanteApi.createOrder(body),
    onSuccess: () => {
      setSelectedClient(null);
      setCartItems([]);
      queryClient.invalidateQueries({ queryKey: ["viajante-orders"] });
    },
  });

  // --- Cart helpers ---
  function handleAddToCart(product: Product, quantity: number) {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.code === product.code);
      if (existing) {
        return prev.map((i) =>
          i.product.code === product.code
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      }
      return [...prev, { product, quantity }];
    });
  }

  function handleRemoveFromCart(productCode: string) {
    setCartItems((prev) => prev.filter((i) => i.product.code !== productCode));
  }

  function handleUpdateQuantity(productCode: string, quantity: number) {
    if (quantity <= 0) {
      handleRemoveFromCart(productCode);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) =>
        i.product.code === productCode ? { ...i, quantity } : i,
      ),
    );
  }

  const cartTotal = cartItems.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0,
  );
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  function handleSubmitOrder() {
    if (!selectedClient || cartItems.length === 0) return;
    createOrderMutation.mutate({
      clientId: selectedClient.id,
      items: cartItems.map((i) => ({
        productCode: i.product.code,
        quantity: i.quantity,
      })),
    });
  }

  function handleViewPdf(orderId: number) {
    const token = localStorage.getItem("token");
    const pdfUrl = viajanteApi.getOrderPdfUrl(orderId, true);
    fetch(pdfUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar PDF");
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      })
      .catch((err) => {
        alert(err instanceof Error ? err.message : "Error al cargar PDF");
      });
  }

  function handleDownloadPdf(orderId: number) {
    const token = localStorage.getItem("token");
    const pdfUrl = viajanteApi.getOrderPdfUrl(orderId);
    fetch(pdfUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al descargar PDF");
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orden-${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch((err) => {
        alert(err instanceof Error ? err.message : "Error al descargar PDF");
      });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Panel de Viajante
      </h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("tomar-pedido")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "tomar-pedido"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Tomar Pedido
        </button>
        <button
          type="button"
          onClick={() => setTab("mis-pedidos")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "mis-pedidos"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Mis Pedidos
        </button>
      </div>

      {/* ================================================================ */}
      {/* TAB: Tomar Pedido                                                */}
      {/* ================================================================ */}
      {tab === "tomar-pedido" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Client selector + Catalog */}
          <div className="lg:col-span-3 space-y-6">
            {/* Client selector */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <ClientSelector
                selected={selectedClient}
                onSelect={setSelectedClient}
              />
            </div>

            {/* Product search */}
            <div>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscá por código o descripción..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>

            {/* Product grid */}
            {productQuery.isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-lg border border-gray-200 bg-white p-3 h-36"
                  >
                    <div className="h-3 w-16 rounded bg-gray-200" />
                    <div className="mt-2 h-4 w-full rounded bg-gray-200" />
                    <div className="mt-1 h-6 w-20 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            )}

            {productQuery.isError && (
              <div className="rounded-lg bg-red-50 p-6 text-center border border-red-200">
                <p className="text-red-700">
                  {productQuery.error instanceof Error
                    ? productQuery.error.message
                    : "Error al cargar productos"}
                </p>
                <button
                  type="button"
                  onClick={() => productQuery.refetch()}
                  className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                >
                  Reintentar
                </button>
              </div>
            )}

            {productQuery.data && productQuery.data.products.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500">
                  {debouncedSearch
                    ? `No se encontraron productos para "${debouncedSearch}"`
                    : "No hay productos disponibles"}
                </p>
              </div>
            )}

            {productQuery.data && productQuery.data.products.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {productQuery.data.products.map((product) => (
                    <ProductCard
                      key={product.code}
                      product={product}
                      onAdd={handleAddToCart}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                    disabled={productPage <= 1}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {productQuery.data.page} de{" "}
                    {productQuery.data.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setProductPage((p) => p + 1)}
                    disabled={productPage >= productQuery.data.totalPages}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right: Cart sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Pedido actual
              </h2>

              {!selectedClient && (
                <p className="text-sm text-gray-500">
                  Seleccioná un cliente para empezar
                </p>
              )}

              {selectedClient && (
                <div className="mb-3 text-sm text-gray-600">
                  <span className="text-gray-400">Para: </span>
                  <span className="font-medium text-gray-900">
                    {selectedClient.name}
                  </span>
                </div>
              )}

              {cartItems.length === 0 && selectedClient && (
                <p className="text-sm text-gray-400">
                  Agregá productos del catálogo
                </p>
              )}

              {cartItems.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div
                      key={item.product.code}
                      className="flex items-start gap-2 text-sm border-b border-gray-100 pb-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 truncate font-medium">
                          {item.product.code}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {item.product.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatPrice(item.product.price)} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateQuantity(
                              item.product.code,
                              item.quantity - 1,
                            )
                          }
                          className="flex h-5 w-5 items-center justify-center rounded border border-gray-300 text-gray-500 text-xs"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-xs font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateQuantity(
                              item.product.code,
                              item.quantity + 1,
                            )
                          }
                          className="flex h-5 w-5 items-center justify-center rounded border border-gray-300 text-gray-500 text-xs"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveFromCart(item.product.code)
                          }
                          className="ml-1 text-red-400 hover:text-red-600 text-xs"
                          title="Quitar"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cartItems.length > 0 && (
                <>
                  <div className="mt-4 border-t border-gray-200 pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Artículos</span>
                      <span className="font-medium">{cartCount}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={
                      !selectedClient ||
                      createOrderMutation.isPending ||
                      cartItems.length === 0
                    }
                    className="mt-4 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {createOrderMutation.isPending
                      ? "Creando pedido..."
                      : "Crear Pedido"}
                  </button>

                  {createOrderMutation.isError && (
                    <p className="mt-2 text-xs text-red-600">
                      {createOrderMutation.error instanceof ApiClientError
                        ? createOrderMutation.error.message
                        : "Error al crear el pedido"}
                    </p>
                  )}

                  {createOrderMutation.isSuccess && (
                    <p className="mt-2 text-xs text-green-600">
                      ¡Pedido creado con éxito!
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB: Mis Pedidos                                                 */}
      {/* ================================================================ */}
      {tab === "mis-pedidos" && (
        <div>
          {ordersQuery.isLoading && (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-gray-100" />
              ))}
            </div>
          )}

          {ordersQuery.isError && (
            <div className="rounded-lg bg-red-50 p-6 text-center border border-red-200">
              <p className="text-red-700">
                {ordersQuery.error instanceof Error
                  ? ordersQuery.error.message
                  : "Error al cargar pedidos"}
              </p>
              <button
                type="button"
                onClick={() => ordersQuery.refetch()}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          )}

          {ordersQuery.data && ordersQuery.data.orders.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">
                Todavía no tomaste ningún pedido
              </p>
            </div>
          )}

          {ordersQuery.data && ordersQuery.data.orders.length > 0 && (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left text-sm font-medium text-gray-500">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersQuery.data.orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div>{order.user?.name ?? "—"}</div>
                          <div className="text-xs text-gray-400">
                            {order.user?.email ?? ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          {formatPrice(order.total)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                              statusColors[order.status]
                            }`}
                          >
                            {statusLabels[order.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewPdf(order.id)}
                              className="rounded border border-gray-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                            >
                              Ver
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(order.id)}
                              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                            >
                              PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                  disabled={orderPage <= 1}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {ordersQuery.data.page} de{" "}
                  {ordersQuery.data.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setOrderPage((p) => p + 1)}
                  disabled={orderPage >= ordersQuery.data.totalPages}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
