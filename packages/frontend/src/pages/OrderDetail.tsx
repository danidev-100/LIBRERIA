import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getOrder } from "../api/orders.js";
import { getOrderPdfUrl } from "../api/orders.js";
import type { OrderStatus } from "../types/index.js";

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
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function handleDownloadPdf(orderId: number) {
  const token = localStorage.getItem("token");
  const pdfUrl = getOrderPdfUrl(orderId);

  fetch(pdfUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
    enabled: !isNaN(orderId),
  });

  if (isNaN(orderId)) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600">ID de pedido inválido</p>
        <Link
          to="/orders"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Volver a mis pedidos
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="mt-6 h-48 rounded-lg bg-gray-100" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600">
          {error instanceof Error ? error.message : "Error al cargar pedido"}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Reintentar
        </button>
        <br />
        <Link
          to="/orders"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Volver a mis pedidos
        </Link>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const order = data.order;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/orders"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Volver a mis pedidos
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Pedido #{order.id}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-block rounded-full px-4 py-1.5 text-sm font-medium ${
                statusColors[order.status]
              }`}
            >
              {statusLabels[order.status]}
            </span>
            <button
              type="button"
              onClick={() => handleDownloadPdf(order.id)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Descargar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left text-sm font-medium text-gray-500">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Precio Unit.</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-sm text-gray-700">
                  {item.product.code}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {item.product.description}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatPrice(item.unitPrice)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">
                  {formatPrice(item.unitPrice * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="mt-4 text-right">
        <span className="text-lg font-bold text-gray-900">
          Total: {formatPrice(order.total)}
        </span>
      </div>
    </div>
  );
}
