import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useCart } from "../context/CartContext.js";
import { createOrder } from "../api/orders.js";
import type { CreateOrderItem } from "../api/orders.js";
import { ApiClientError } from "../api/client.js";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(price);
}

export default function CartPage() {
  const { items, updateQuantity, updateDetails, removeItem, clearCart, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (orderItems: CreateOrderItem[]) => createOrder(orderItems),
  });

  const handlePlaceOrder = useCallback(() => {
    const orderItems: CreateOrderItem[] = items.map((i) => ({
      productCode: i.product.code,
      quantity: i.quantity,
      details: i.details || undefined,
    }));

    mutation.mutate(orderItems, {
      onSuccess: (data) => {
        clearCart();
        navigate(`/orders/${data.order.id}`);
      },
    });
  }, [items, mutation, clearCart, navigate]);

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tu carrito está vacío</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Agregá productos desde el catálogo</p>
        <Link
          to="/catalog"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Tu Carrito</h1>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
              <th className="pb-3">Código</th>
              <th className="pb-3">Descripción</th>
              <th className="pb-3">Detalles</th>
              <th className="pb-3">Cantidad</th>
              <th className="pb-3">Precio Unit.</th>
              <th className="pb-3">Subtotal</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.product.code} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-4 text-sm text-gray-700 dark:text-gray-300">{item.product.code}</td>
                <td className="py-4 text-sm text-gray-900 dark:text-gray-100">{item.product.description}</td>
                <td className="py-4">
                  <input
                    type="text"
                    value={item.details ?? ""}
                    onChange={(e) => updateDetails(item.product.code, e.target.value)}
                    placeholder="Ej: para regalo, urgente..."
                    maxLength={500}
                    className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.code, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.code, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="py-4 text-sm text-gray-700 dark:text-gray-300">{formatPrice(item.product.price)}</td>
                <td className="py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {formatPrice(item.product.price * item.quantity)}
                </td>
                <td className="py-4">
                  <button
                    type="button"
                    onClick={() => removeItem(item.product.code)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col items-end gap-4">
        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Total ({totalItems} {totalItems === 1 ? "item" : "items"}):{" "}
          <span className="text-2xl">{formatPrice(totalPrice)}</span>
        </div>

        <div className="flex gap-4">
          <Link
            to="/catalog"
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Seguir comprando
          </Link>
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={mutation.isPending}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? "Procesando..." : "Realizar pedido"}
          </button>
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600">
            {mutation.error instanceof ApiClientError
              ? mutation.error.message
              : "Error al realizar el pedido. Intentalo de nuevo."}
          </p>
        )}
      </div>
    </div>
  );
}
