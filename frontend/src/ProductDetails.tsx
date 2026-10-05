import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCart } from "./CartContext";
import "./ProductDetails.css";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  description: string | null;
}

const API_URL = "http://localhost:5000/api";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/products/${id}`);

        if (!response.ok) {
          throw new Error("Product not found");
        }

        const data = await response.json();

        setProduct({
          ...data,
          price: Number(data.price),
        });
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Unable to load product details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const increaseQuantity = () => {
    setQuantity((previousQuantity) => previousQuantity + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((previousQuantity) =>
      previousQuantity > 1 ? previousQuantity - 1 : 1
    );
  };

  // Add product to cart
  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      image_url: product.image_url,
      quantity,
    });

    setCartMessage(`${product.name} added to cart!`);

    setTimeout(() => {
      setCartMessage("");
    }, 2000);
  };

  if (loading) {
    return (
      <div className="product-details-page">
        <h2>Loading product...</h2>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-page">
        <h2>{error || "Product not found"}</h2>

        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/")}
        >
          ← Back to Products
        </button>
      </div>
    );
  }

  const imageSrc = product.image_url
    ? product.image_url.startsWith("http")
      ? product.image_url
      : `http://localhost:5000${
          product.image_url.startsWith("/") ? "" : "/"
        }${product.image_url}`
    : null;

  return (
    <div className="product-details-page">

      {/* Back Button */}
      <button
        type="button"
        className="back-button"
        onClick={() => navigate("/")}
      >
        ← Back to Products
      </button>

      {/* Main Product Container */}
      <div className="product-details-container">

        {/* Product Image */}
        <div className="product-details-image-section">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              className="product-details-image"
            />
          ) : (
            <div className="no-product-image">
              No Image Available
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="product-details-info">

          {/* Category */}
          <p className="product-details-category">
            {product.category}
          </p>

          {/* Product Name */}
          <h1>{product.name}</h1>

          {/* Price */}
          <p className="product-details-price">
            ₹{product.price.toLocaleString("en-IN")}
          </p>

          {/* Description */}
          <div className="product-description">
            <h3>Description</h3>

            <p>
              {product.description
                ? product.description
                : "No description available for this product."}
            </p>
          </div>

          {/* Product ID */}
          <p className="product-details-id">
            Product ID: {product.id}
          </p>

          {/* Quantity */}
          <div className="quantity-section">
            <span>Quantity:</span>

            <div className="quantity-controls">

              <button
                type="button"
                onClick={decreaseQuantity}
                aria-label="Decrease quantity"
              >
                −
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                onClick={increaseQuantity}
                aria-label="Increase quantity"
              >
                +
              </button>

            </div>
          </div>

          {/* Total Price */}
          <p className="product-total-price">
            Total: ₹{(product.price * quantity).toLocaleString("en-IN")}
          </p>

          {/* Cart Success Message */}
          {cartMessage && (
            <p className="cart-success-message">
              ✓ {cartMessage}
            </p>
          )}

          {/* Action Buttons */}
          <div className="product-details-actions">

            <button
              type="button"
              className="add-to-cart-button"
              onClick={handleAddToCart}
            >
              Add to Cart
            </button>

            <button
              type="button"
              className="buy-now-button"
            >
              Buy Now
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

export default ProductDetails;