import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];

  addToCart(item: Omit<Product, 'quantity'>): void;

  increment(id: string): void;

  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storegeProducts = await AsyncStorage.getItem(
        '@goMarketplace:products',
      );

      if (storegeProducts) {
        setProducts(JSON.parse(storegeProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const exists = products.findIndex(p => p.id === id);
      products[exists].quantity += 1;
      setProducts([...products]);
      await AsyncStorage.setItem(
        '@goMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const exists = products.findIndex(p => p.id === product.id);

      if (exists >= 0) {
        await increment(product.id);
      } else {
        setProducts(state => {
          return [
            ...state,
            {
              ...product,
              quantity: 1,
            },
          ];
        });
        await AsyncStorage.setItem(
          '@goMarketplace:products',
          JSON.stringify(products),
        );
      }
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const exists = products.findIndex(p => p.id === id);
      products[exists].quantity -= 1;

      if (products[exists].quantity === 0) {
        products.splice(exists, 1);
      }

      setProducts([...products]);
      await AsyncStorage.setItem(
        '@goMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
