import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface CartProduct {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  quantity: number;
}

interface CartContextType {
  cart: CartProduct[];
  addToCart: (product: CartProduct) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({
  children,
}: CartProviderProps) {
  const [cart, setCart] = useState<CartProduct[]>(() => {
    const savedCart = localStorage.getItem("producthub_cart");

    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (error) {
        console.error("Error reading cart:", error);
        return [];
      }
    }

    return [];
  });

  // Save cart whenever cart changes
  useEffect(() => {
    localStorage.setItem(
      "producthub_cart",
      JSON.stringify(cart)
    );
  }, [cart]);

  // Add product to cart
  const addToCart = (product: CartProduct) => {
    setCart((previousCart) => {
      const existingProduct = previousCart.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        return previousCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + product.quantity,
              }
            : item
        );
      }

      return [...previousCart, product];
    });
  };

  // Remove product
  const removeFromCart = (productId: number) => {
    setCart((previousCart) =>
      previousCart.filter(
        (item) => item.id !== productId
      )
    );
  };

  // Update quantity
  const updateQuantity = (
    productId: number,
    quantity: number
  ) => {
    if (quantity < 1) {
      return;
    }

    setCart((previousCart) =>
      previousCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
  };

  // Total number of products
  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // Total price
  const cartTotal = cart.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Custom hook
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}