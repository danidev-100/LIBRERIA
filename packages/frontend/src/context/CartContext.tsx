import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Product } from "../types/index.js";

export interface CartItem {
  product: Product;
  quantity: number;
  details: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productCode: string) => void;
  updateQuantity: (productCode: string, quantity: number) => void;
  updateDetails: (productCode: string, details: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage may be full or unavailable
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  // Persist on change
  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.code === product.code);
      if (existing) {
        return prev.map((i) =>
          i.product.code === product.code
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      }
      return [...prev, { product, quantity, details: "" }];
    });
  }, []);

  const removeItem = useCallback((productCode: string) => {
    setItems((prev) => prev.filter((i) => i.product.code !== productCode));
  }, []);

  const updateQuantity = useCallback(
    (productCode: string, quantity: number) => {
      if (quantity <= 0) {
        setItems((prev) => prev.filter((i) => i.product.code !== productCode));
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.product.code === productCode ? { ...i, quantity } : i,
        ),
      );
    },
    [],
  );

  const updateDetails = useCallback(
    (productCode: string, details: string) => {
      setItems((prev) =>
        prev.map((i) =>
          i.product.code === productCode ? { ...i, details } : i,
        ),
      );
    },
    [],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items],
  );

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    updateDetails,
    clearCart,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
