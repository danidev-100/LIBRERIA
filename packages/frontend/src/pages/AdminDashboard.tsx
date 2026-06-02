import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminGetOrders, adminUpdateStatus } from "../api/orders.js";
import type { OrderStatus } from "../types/index.js";
import { ApiClientError } from "../api/client.js";

type StatusFilter = OrderStatus | "ALL";

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

// Valid transitions match the backend
const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const filterTabs: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: "PENDING", label: "Pendientes" },
  { key: "CONFIRMED", label: "Confirmados" },
  { key: "SHIPPED", label: "Enviados" },
  { key: "DELIVERED", label: "Entregados" },
  { key: "CANCELLED", label: "Cancelados" },
];

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

export default function AdminDashboardPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-orders", statusFilter, page],
    queryFn: () =>
      adminGetOrders(
        statusFilter === "ALL" ? undefined : statusFilter,
        page,
        20,
      ),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      orderId,
      newStatus,
    }: {
      orderId: number;
      newStatus: OrderStatus;
    }) => adminUpdateStatus(orderId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  function handleStatusChange(orderId: number, newStatus: OrderStatus) {
    statusMutation.mutate({ orderId, newStatus });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Panel de Administración
      </h1>

      {/* Status filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setStatusFilter(tab.key);
              setPage(1);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-gray-100" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-lg bg-red-50 p-6 text-center border border-red-200">
          <p className="text-red-700">
            {error instanceof Error
              ? error.message
              : "Error al cargar pedidos"}
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

      {/* Empty state */}
      {data && data.orders.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No hay pedidos</p>
        </div>
      )}

      {/* Orders table */}
      {data && data.orders.length > 0 && (
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
                  <th className="px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50">
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
                      {transitions[order.status].length > 0 ? (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleStatusChange(
                                order.id,
                                e.target.value as OrderStatus,
                              );
                            }
                          }}
                          disabled={statusMutation.isPending}
                          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="" disabled>
                            Cambiar a...
                          </option>
                          {transitions[order.status].map((nextStatus) => (
                            <option key={nextStatus} value={nextStatus}>
                              {statusLabels[nextStatus]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mutation error */}
          {statusMutation.isError && (
            <p className="mt-3 text-sm text-red-600">
              {statusMutation.error instanceof ApiClientError
                ? statusMutation.error.message
                : "Error al actualizar estado"}
            </p>
          )}

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-center gap-4">
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
