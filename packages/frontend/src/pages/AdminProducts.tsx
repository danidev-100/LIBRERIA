import { useState, useEffect, useRef, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeactivateProduct,
  adminUploadProductList,
  type CreateProductData,
  type UpdateProductData,
} from "../api/admin-products.js";
import type { Product } from "../types/index.js";
import { ApiClientError } from "../api/client.js";

type IsActiveFilter = "all" | "true" | "false";

const filterTabs: { key: IsActiveFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "true", label: "Activos" },
  { key: "false", label: "Inactivos" },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(price);
}

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmClass,
  isLoading,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalOverlay onClose={onCancel}>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-lg px-4 py-2 text-sm text-white disabled:opacity-40 ${confirmClass}`}
          >
            {isLoading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();

  // Filters & pagination
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<IsActiveFilter>("all");
  const [page, setPage] = useState(1);

  // Debounce search (300ms)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  // --- Query: product list ---
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-products", search, isActiveFilter, page],
    queryFn: () =>
      adminGetProducts(
        search || undefined,
        isActiveFilter === "all" ? undefined : isActiveFilter,
        page,
        20,
      ),
  });

  // --- Create modal state ---
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProductData>({
    code: "",
    description: "",
    price: 0,
    category: "",
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // --- Edit modal state ---
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProductData & { code: string }>({
    code: "",
    description: "",
    price: 0,
    category: "",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // --- Deactivate confirmation ---
  const [deactivateCode, setDeactivateCode] = useState<string | null>(null);

  // --- Upload state ---
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Create mutation ---
  const createMutation = useMutation({
    mutationFn: (data: CreateProductData) => adminCreateProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setCreateOpen(false);
      setCreateForm({ code: "", description: "", price: 0, category: "" });
      setCreateErrors({});
    },
  });

  // --- Update mutation ---
  const updateMutation = useMutation({
    mutationFn: ({ code, data }: { code: string; data: UpdateProductData }) =>
      adminUpdateProduct(code, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setEditOpen(false);
      setEditErrors({});
    },
  });

  // --- Deactivate mutation ---
  const deactivateMutation = useMutation({
    mutationFn: (code: string) => adminDeactivateProduct(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setDeactivateCode(null);
    },
  });

  // --- Reactivate (PUT isActive=true) ---
  const reactivateMutation = useMutation({
    mutationFn: (code: string) => adminUpdateProduct(code, { isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  // --- Upload mutation ---
  const uploadMutation = useMutation({
    mutationFn: (file: File) => adminUploadProductList(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  // --- Handlers ---
  function handleFilterChange(filter: IsActiveFilter) {
    setIsActiveFilter(filter);
    setPage(1);
  }

  function openCreateModal() {
    setCreateForm({ code: "", description: "", price: 0, category: "" });
    setCreateErrors({});
    setCreateOpen(true);
  }

  function validateCreate(): boolean {
    const errors: Record<string, string> = {};
    if (!/^[A-Za-z0-9]{8}$/.test(createForm.code)) {
      errors.code = "El código debe tener 8 caracteres alfanuméricos";
    }
    if (!createForm.description.trim()) {
      errors.description = "La descripción es obligatoria";
    }
    if (createForm.price == null || createForm.price <= 0) {
      errors.price = "El precio debe ser mayor a 0";
    }
    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleCreateSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateCreate()) return;
    createMutation.mutate({
      ...createForm,
      category: createForm.category || undefined,
    });
  }

  function openEditModal(product: Product) {
    setEditForm({
      code: product.code,
      description: product.description,
      price: product.price,
      category: "",
    });
    setEditErrors({});
    setEditOpen(true);
  }

  function validateEdit(): boolean {
    const errors: Record<string, string> = {};
    if (!editForm.description?.trim()) {
      errors.description = "La descripción no puede estar vacía";
    }
    if (editForm.price != null && editForm.price < 0) {
      errors.price = "El precio no puede ser negativo";
    }
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateEdit()) return;
    updateMutation.mutate({
      code: editForm.code,
      data: {
        description: editForm.description || undefined,
        price: editForm.price != null ? editForm.price : undefined,
        category: editForm.category || undefined,
      },
    });
  }

  function handleUploadConfirm() {
    if (!uploadFile) return;
    uploadMutation.mutate(uploadFile);
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadOpen(true);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // --- Derived mutation error for generic display ---
  const mutationError =
    createMutation.isError || updateMutation.isError || deactivateMutation.isError
      ? (createMutation.error ?? updateMutation.error ?? deactivateMutation.error)
      : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Productos</h1>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleFilterChange(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActiveFilter === tab.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            + Nuevo Producto
          </button>
          <label className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors cursor-pointer">
            Subir TXT
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileSelected}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por código o descripción..."
          className="w-full sm:w-80 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      )}

      {/* Query error */}
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

      {/* Empty state */}
      {data && data.products.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No se encontraron productos</p>
        </div>
      )}

      {/* Mutation error banner */}
      {mutationError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {mutationError instanceof ApiClientError
            ? mutationError.message
            : "Error al procesar la operación"}
        </div>
      )}

      {/* Products table */}
      {data && data.products.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((product) => (
                  <tr
                    key={product.code}
                    className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">
                      {product.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                      {product.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {/* Category field not in current Product type; show "—" */}
                      —
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          product.isActive
                            ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                            : "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300"
                        }`}
                      >
                        {product.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="rounded border border-gray-300 dark:border-gray-600 px-3 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          Editar
                        </button>
                        {product.isActive ? (
                          <button
                            type="button"
                            onClick={() => setDeactivateCode(product.code)}
                            className="rounded border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              reactivateMutation.mutate(product.code)
                            }
                            disabled={reactivateMutation.isPending}
                            className="rounded border border-green-300 px-3 py-1 text-xs text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40"
                          >
                            Reactivar
                          </button>
                        )}
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Página {data.page} de {data.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.totalPages}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      {/* ===== Create Modal ===== */}
      {createOpen && (
        <ModalOverlay onClose={() => setCreateOpen(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Nuevo Producto
            </h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Código
                </label>
                <input
                  type="text"
                  value={createForm.code}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })
                  }
                  maxLength={8}
                  className={`w-full rounded-lg border px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    createErrors.code
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  } focus:outline-none focus:ring-1`}
                  placeholder="Ej: PROD0001"
                />
                {createErrors.code && (
                  <p className="mt-1 text-xs text-red-600">{createErrors.code}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, description: e.target.value })
                  }
                  className={`w-full rounded-lg border px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    createErrors.description
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  } focus:outline-none focus:ring-1`}
                  placeholder="Descripción del producto"
                />
                {createErrors.description && (
                  <p className="mt-1 text-xs text-red-600">
                    {createErrors.description}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Precio
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={createForm.price || ""}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      price: e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                  className={`w-full rounded-lg border px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    createErrors.price
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  } focus:outline-none focus:ring-1`}
                  placeholder="0.00"
                />
                {createErrors.price && (
                  <p className="mt-1 text-xs text-red-600">{createErrors.price}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría{" "}
                  <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={createForm.category || ""}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, category: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Categoría"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  disabled={createMutation.isPending}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
                >
                  {createMutation.isPending ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* ===== Edit Modal ===== */}
      {editOpen && (
        <ModalOverlay onClose={() => setEditOpen(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Editar Producto
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Código
                </label>
                <input
                  type="text"
                  value={editForm.code}
                  disabled
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm text-gray-400 dark:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={editForm.description || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className={`w-full rounded-lg border px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    editErrors.description
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  } focus:outline-none focus:ring-1`}
                  placeholder="Descripción"
                />
                {editErrors.description && (
                  <p className="mt-1 text-xs text-red-600">
                    {editErrors.description}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Precio
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price ?? ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      price: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                  className={`w-full rounded-lg border px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    editErrors.price
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  } focus:outline-none focus:ring-1`}
                  placeholder="Sin cambios"
                />
                {editErrors.price && (
                  <p className="mt-1 text-xs text-red-600">{editErrors.price}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría{" "}
                  <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={editForm.category || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Sin cambios"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  disabled={updateMutation.isPending}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
                >
                  {updateMutation.isPending ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* ===== Deactivate Confirmation ===== */}
      {deactivateCode && (
        <ConfirmDialog
          title="Desactivar producto"
          message={`¿Estás seguro de que querés desactivar el producto ${deactivateCode}? No se eliminará de la base de datos, pero quedará oculto del catálogo.`}
          confirmLabel="Desactivar"
          confirmClass="bg-red-600 hover:bg-red-700"
          isLoading={deactivateMutation.isPending}
          onConfirm={() => deactivateMutation.mutate(deactivateCode)}
          onCancel={() => setDeactivateCode(null)}
        />
      )}

      {/* ===== Upload Confirmation ===== */}
      {uploadOpen && uploadFile && (
        <ModalOverlay onClose={() => setUploadOpen(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
            {uploadMutation.isSuccess ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Resultado de la carga
                </h2>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-6">
                  <p>
                    <span className="font-medium">Insertados:</span>{" "}
                    {uploadMutation.data.inserted}
                  </p>
                  <p>
                    <span className="font-medium">Actualizados:</span>{" "}
                    {uploadMutation.data.updated}
                  </p>
                  <p>
                    <span className="font-medium">Total procesados:</span>{" "}
                    {uploadMutation.data.total}
                  </p>
                  {uploadMutation.data.errors.length > 0 && (
                    <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="font-medium text-red-800 text-xs mb-1">
                        Errores ({uploadMutation.data.errors.length}):
                      </p>
                      <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
                        {uploadMutation.data.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadOpen(false);
                      setUploadFile(null);
                      uploadMutation.reset();
                    }}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Confirmar carga
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Se va a procesar el archivo{" "}
                  <span className="font-medium">{uploadFile.name}</span>. Los
                  productos existentes se actualizarán y los nuevos se
                  insertarán.
                </p>
                {uploadMutation.isError && (
                  <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    {uploadMutation.error instanceof ApiClientError
                      ? uploadMutation.error.message
                      : "Error al procesar el archivo"}
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadOpen(false);
                      setUploadFile(null);
                      uploadMutation.reset();
                    }}
                    disabled={uploadMutation.isPending}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadConfirm}
                    disabled={uploadMutation.isPending}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-40"
                  >
                    {uploadMutation.isPending
                      ? "Procesando..."
                      : "Subir y procesar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
