import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { useCart } from "../context/CartContext.js";
import { useDarkMode } from "../context/DarkModeContext.js";

export default function Layout() {
  const { isAuthenticated, isAdmin, isViajante, user, logout } = useAuth();
  const { totalItems } = useCart();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Fixed nav bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              to="/catalog"
              className="text-xl font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              LIBRERIA
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-4">
              <Link
                to="/catalog"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                Catálogo
              </Link>
              <Link
                to="/cart"
                className="relative text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
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
                    className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors"
                  >
                    Registrarse
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/orders"
                    className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  >
                    Mis Pedidos
                  </Link>
                  {isViajante && (
                    <Link
                      to="/viajante"
                      className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                    >
                      Viajante
                    </Link>
                  )}
                  {isAdmin && (
                    <>
                      <Link
                        to="/admin/orders"
                        className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                      >
                        Admin
                      </Link>
                      <Link
                        to="/admin/users"
                        className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                      >
                        Usuarios
                      </Link>
                      <Link
                        to="/admin/products"
                        className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                      >
                        Productos
                      </Link>
                    </>
                  )}
                  <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {user?.name}
                    </span>
                    <button
                      type="button"
                      onClick={logout}
                      className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              )}

              {/* Dark mode toggle */}
              <button
                type="button"
                onClick={toggleDark}
                className="flex items-center justify-center rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={isDark ? "Modo claro" : "Modo oscuro"}
              >
                {isDark ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </nav>

            {/* Mobile hamburger + dark toggle */}
            <div className="flex items-center gap-1 md:hidden">
              <button
                type="button"
                onClick={toggleDark}
                className="flex items-center justify-center rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={isDark ? "Modo claro" : "Modo oscuro"}
              >
                {isDark ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center justify-center rounded-lg p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
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
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors">
            <div className="space-y-1 px-4 py-3">
              <Link
                to="/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Catálogo
              </Link>
              <Link
                to="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Registrarse
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Mis Pedidos
                  </Link>
                  {isViajante && (
                    <Link
                      to="/viajante"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Viajante
                    </Link>
                  )}
                  {isAdmin && (
                    <>
                      <Link
                        to="/admin/orders"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Admin
                      </Link>
                      <Link
                        to="/admin/users"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Usuarios
                      </Link>
                      <Link
                        to="/admin/products"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Productos
                      </Link>
                    </>
                  )}
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-2 mt-2">
                    <div className="px-3 py-1 text-xs text-gray-400 dark:text-gray-500">
                      {user?.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
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
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-4 transition-colors">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} Librería — Todos los derechos reservados
        </div>
      </footer>
    </div>
  );
}
