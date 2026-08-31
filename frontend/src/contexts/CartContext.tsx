import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '@/services/api';

export interface CartItem {
  id: string;
  listingId: string;
  quantity: number;
  listing: {
    id: string;
    price: number;
    quantity: number;
    unit: string;
    quality: string;
    location: string;
    product: {
      name: string;
      category: string;
    };
    farmer?: {
      farmName: string;
      user: { name: string };
    };
    fpo?: {
      name: string;
      user: { name: string };
    };
  };
}

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (listingId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { isAuthenticated } = useAuth();

  const refreshCart = async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    try {
      const res = await api.get('/cart');
      setItems(res.data?.items || []);
    } catch (e) {
      console.error('Error fetching cart:', e);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [isAuthenticated]);

  const addToCart = async (listingId: string, quantity: number) => {
    try {
      await api.post('/cart/items', { listingId, quantity });
      await refreshCart();
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      await refreshCart();
    } catch (e) {
      console.error(e);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }
    try {
      await api.patch(`/cart/items/${itemId}`, { quantity });
      await refreshCart();
    } catch (e) {
      console.error(e);
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      setItems([]);
    } catch (e) {
      console.error(e);
    }
  };

  const cartCount = items.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const cartTotal = items.reduce((acc, item) => acc + ((item.listing?.price || 0) * (item.quantity || 0)), 0);

  return (
    <CartContext.Provider value={{ items, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
