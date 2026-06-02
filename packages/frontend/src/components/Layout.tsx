import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { useCart } from "../context/CartContext.js";

export default function Layout() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Fixed nav bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              to="/catalog"
              className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              LIBRERIA
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/catalog"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Catálogo
              </Link>
              <Link
                to="/cart"
                className="relative text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Carrito
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-4 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Link>

              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Registrarse
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/orders"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Mis Pedidos
                  </Link>
                  {isAdmin && (
                    <>
                      <Link
                        to="/admin/orders"
                        className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        Admin
                      </Link>
                      <Link
                        to="/admin/users"
                        className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        Usuarios
                      </Link>
                      <Link
                        to="/admin/products"
                        className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        Productos
                      </Link>
                    </>
                  )}
                  <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                    <span className="text-sm text-gray-500">
                      {user?.name}
                    </span>
                    <button
                      type="button"
                      onClick={logout}
                      className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              )}
            </nav>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Menú"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="space-y-1 px-4 py-3">
              <Link
                to="/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Catálogo
              </Link>
              <Link
                to="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Carrito
                {totalItems > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Link>

              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-gray-100"
                  >
                    Registrarse
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Mis Pedidos
                  </Link>
                  {isAdmin && (
                    <>
                      <Link
                        to="/admin/orders"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-purple-600 hover:bg-gray-100"
                      >
                        Admin
                      </Link>
                      <Link
                        to="/admin/users"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-purple-600 hover:bg-gray-100"
                      >
                        Usuarios
                      </Link>
                      <Link
                        to="/admin/products"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-purple-600 hover:bg-gray-100"
                      >
                        Productos
                      </Link>
                    </>
                  )}
                  <div className="border-t border-gray-100 pt-2 mt-2">
                    <div className="px-3 py-1 text-xs text-gray-400">
                      {user?.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-gray-100"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 pt-24 pb-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Librería — Todos los derechos reservados
        </div>
      </footer>
    </div>
  );
}
