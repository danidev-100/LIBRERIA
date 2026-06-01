import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-900">Librería</h1>
      <p className="mt-4 text-lg text-gray-600">
        Bookstore ordering system
      </p>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="mt-4 text-lg text-gray-600">Page not found</p>
      <Link to="/" className="mt-6 inline-block text-blue-600 hover:underline">
        Go home
      </Link>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Librería
            </Link>
            <nav className="space-x-4">
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <footer className="bg-gray-50 border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Librería
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
