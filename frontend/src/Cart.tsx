import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import "./Cart.css";

function Cart() {
    const navigate = useNavigate();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
  } = useCart();

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>

          <h1>Your Cart is Empty</h1>

          <p>
            You haven't added any products to your cart yet.
          </p>

          <button
            type="button"
            className="continue-shopping-button"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">

        {/* Cart Header */}
        <div className="cart-header">
          <h1>Shopping Cart</h1>

          <span className="cart-item-count">
            {cart.length}{" "}
            {cart.length === 1 ? "Product" : "Products"}
          </span>
        </div>

        {/* Cart Products */}
        <div className="cart-products">
          {cart.map((item) => {
            const imageSrc = item.image_url
              ? item.image_url.startsWith("http")
                ? item.image_url
                : `http://localhost:5000${
                    item.image_url.startsWith("/")
                      ? ""
                      : "/"
                  }${item.image_url}`
              : null;

            const itemTotal = item.price * item.quantity;

            return (
              <div
                className="cart-product"
                key={item.id}
              >
                {/* Product Image */}
                <div className="cart-product-image">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={item.name}
                    />
                  ) : (
                    <div className="cart-no-image">
                      No Image
                    </div>
                  )}
                </div>

                {/* Product Information */}
                <div className="cart-product-info">
                  <p className="cart-product-category">
                    {item.category}
                  </p>

                  <h2>{item.name}</h2>

                  <p className="cart-product-price">
                    ₹{item.price.toLocaleString("en-IN")}
                  </p>
                </div>

                {/* Quantity */}
                <div className="cart-quantity-section">
                  <span>Quantity</span>

                  <div className="cart-quantity-controls">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.quantity - 1
                        )
                      }
                      disabled={item.quantity === 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.quantity + 1
                        )
                      }
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Item Total */}
                <div className="cart-product-total">
                  <span>Subtotal</span>

                  <strong>
                    ₹{itemTotal.toLocaleString("en-IN")}
                  </strong>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  className="remove-cart-button"
                  onClick={() =>
                    removeFromCart(item.id)
                  }
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>

        {/* Cart Summary */}
        <div className="cart-summary">
          <div className="cart-summary-left">
            <button
              type="button"
              className="clear-cart-button"
              onClick={clearCart}
            >
              Clear Cart
            </button>
          </div>

          <div className="cart-summary-right">
            <div className="cart-total-row">
              <span>Grand Total</span>

              <strong>
                ₹{cartTotal.toLocaleString("en-IN")}
              </strong>
            </div>

            <button
  type="button"
  className="checkout-button"
  onClick={() => navigate("/checkout")}
>
  Checkout
</button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Cart;