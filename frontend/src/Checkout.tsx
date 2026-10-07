import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import "./Checkout.css";

const API_URL = "http://localhost:5000/api";

function Checkout() {
  const navigate = useNavigate();

  const {
    cart,
    cartTotal,
    clearCart,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  const handlePlaceOrder = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (cart.length === 0) {
      return;
    }

    try {
      setIsPlacingOrder(true);
      setOrderError("");

      const response = await fetch(
        `${API_URL}/orders`,
        {
          method: "POST",

          
headers: {
  "Content-Type": "application/json",
  ...(localStorage.getItem("customerToken")
    ? {
        Authorization: `Bearer ${localStorage.getItem("customerToken")}`,
      }
    : {}),
},


          body: JSON.stringify({
            customer_name: customerName,
            email,
            phone,
            address,
            city,
            pincode,

            items: cart.map((item) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to place order"
        );
      }

      alert(
        `Order placed successfully!\nOrder ID: ${data.order.id}`
      );

      clearCart();

      navigate("/");
    } catch (error) {
      console.error("Error placing order:", error);

      setOrderError(
        error instanceof Error
          ? error.message
          : "Failed to place order"
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <h1>Your Cart is Empty</h1>

          <p>
            Please add products to your cart before
            proceeding to checkout.
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">

      <div className="checkout-container">

        <button
          type="button"
          className="checkout-back-button"
          onClick={() => navigate("/cart")}
        >
          ← Back to Cart
        </button>

        <h1>Checkout</h1>

        <div className="checkout-content">

          <form
            className="checkout-form"
            onSubmit={handlePlaceOrder}
          >
            <h2>Customer Details</h2>

            <div className="checkout-field">
              <label htmlFor="customerName">
                Full Name
              </label>

              <input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(event) =>
                  setCustomerName(event.target.value)
                }
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="checkout-field">
              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="checkout-field">
              <label htmlFor="phone">
                Phone Number
              </label>

              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div className="checkout-field">
              <label htmlFor="address">
                Address
              </label>

              <textarea
                id="address"
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                placeholder="Enter your complete address"
                rows={4}
                required
              />
            </div>

            <div className="checkout-row">

              <div className="checkout-field">
                <label htmlFor="city">
                  City
                </label>

                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(event) =>
                    setCity(event.target.value)
                  }
                  placeholder="Enter city"
                  required
                />
              </div>

              <div className="checkout-field">
                <label htmlFor="pincode">
                  Pincode
                </label>

                <input
                  id="pincode"
                  type="text"
                  value={pincode}
                  onChange={(event) =>
                    setPincode(event.target.value)
                  }
                  placeholder="Enter pincode"
                  required
                />
              </div>

            </div>

            {orderError && (
              <p className="checkout-error-message">
                {orderError}
              </p>
            )}

            <button
              type="submit"
              className="place-order-button"
              disabled={isPlacingOrder}
            >
              {isPlacingOrder
                ? "Placing Order..."
                : "Place Order"}
            </button>

          </form>

          <div className="checkout-summary">

            <h2>Order Summary</h2>

            {cart.map((item) => (
              <div
                className="checkout-product"
                key={item.id}
              >
                <div>
                  <strong>{item.name}</strong>

                  <p>
                    ₹{item.price.toLocaleString("en-IN")}
                    {" × "}
                    {item.quantity}
                  </p>
                </div>

                <strong>
                  ₹
                  {(item.price * item.quantity)
                    .toLocaleString("en-IN")}
                </strong>
              </div>
            ))}

            <div className="checkout-total">
              <span>Grand Total</span>

              <strong>
                ₹{cartTotal.toLocaleString("en-IN")}
              </strong>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Checkout;