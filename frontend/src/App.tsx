import "./App.css";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import smartwatchImage from "./assets/smartwatch.jpg";
import sneakersImage from "./assets/sneakers.jpg";
import perfumeImage from "./assets/perfume.jpg";
import heroImage from "./assets/hero.jpg";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

const API_URL = "http://localhost:5000/api";

function App() {
  // Products from MySQL
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Admin authentication
  const [token, setToken] = useState(
    () => localStorage.getItem("adminToken") || ""
  );

  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Product form
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/products`);

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();

      // MySQL DECIMAL values may arrive as strings
      const formattedProducts: Product[] = data.map(
        (product: Product) => ({
          ...product,
          price: Number(product.price),
        })
      );

      setProducts(formattedProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Unable to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Product image based on ID
  const getProductImage = (id: number): string => {
    switch (id) {
      case 1:
        return smartwatchImage;
      case 2:
        return sneakersImage;
      case 3:
        return perfumeImage;
      default:
        return "";
    }
  };

  // Admin login
  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoginError("");
    setLoginLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.message || "Login failed");
        return;
      }

      // Save the JWT token in browser storage
      localStorage.setItem("adminToken", data.token);
      setToken(data.token);

      setPassword("");
      setUsername("");
      setShowLogin(false);
      setLoginError("");
      setFormMessage("Welcome, Admin!");
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Unable to connect to the server.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Admin logout
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setToken("");
    setShowLogin(false);
    setEditingId(null);
    resetForm();
    setFormMessage("");
    setFormError("");
  };

  // Reset product form
  const resetForm = () => {
    setName("");
    setPrice("");
    setCategory("");
    setEditingId(null);
  };

  // Add or update product
  const handleProductSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setFormMessage("");
    setFormError("");

    const numericPrice = Number(price);

    if (
      !name.trim() ||
      !category.trim() ||
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      setFormError("Please enter valid product details.");
      return;
    }

    setSaving(true);

    const productData = {
      name: name.trim(),
      price: numericPrice,
      category: category.trim(),
    };

    const isEditing = editingId !== null;

    const url = isEditing
      ? `${API_URL}/products/${editingId}`
      : `${API_URL}/products`;

    try {
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleLogout();
        setFormError("Session expired. Please login again.");
        return;
      }

      if (!response.ok) {
        setFormError(data.message || "Failed to save product.");
        return;
      }

      setFormMessage(
        isEditing
          ? "Product updated successfully!"
          : "Product added successfully!"
      );

      resetForm();
      await fetchProducts();
    } catch (err) {
      console.error("Product save error:", err);
      setFormError("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  // Load product details into form for editing
  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(String(product.price));
    setCategory(product.category);
    setFormMessage("");
    setFormError("");

    document
      .getElementById("admin-dashboard")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // Delete product
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    setFormMessage("");
    setFormError("");

    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleLogout();
        setFormError("Session expired. Please login again.");
        return;
      }

      if (!response.ok) {
        setFormError(data.message || "Failed to delete product.");
        return;
      }

      setFormMessage("Product deleted successfully!");
      await fetchProducts();
    } catch (err) {
      console.error("Delete error:", err);
      setFormError("Unable to connect to the server.");
    }
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <h2>ProductHub</h2>

        <div className="nav-links">
          <a href="#">Home</a>
          <a href="#products">Shop</a>
          <a href="#">About</a>
          <a href="#">Contact</a>
        </div>

        <div className="nav-actions">
          {token ? (
            <button onClick={handleLogout}>
              Admin Logout
            </button>
          ) : (
            <button
              onClick={() => {
                setShowLogin(!showLogin);
                setLoginError("");
              }}
            >
              Admin Login
            </button>
          )}
        </div>
      </nav>

      {/* Admin Login */}
      {showLogin && !token && (
        <section className="admin-login-section">
          <div className="admin-login-card">
            <h2>Admin Login</h2>
            <p>Login to manage ProductHub products.</p>

            <form onSubmit={handleLogin}>
              <label htmlFor="admin-username">Username</label>
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter admin username"
                required
              />

              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
                required
              />

              {loginError && (
                <p className="admin-error">{loginError}</p>
              )}

              <button type="submit" disabled={loginLoading}>
                {loginLoading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to ProductHub</h1>
          <p>Discover products you'll love.</p>

          <a href="#products">
            <button>Explore Products</button>
          </a>
        </div>

        <div className="hero-image">
          <img
            src={heroImage}
            alt="ProductHub shopping illustration"
          />
        </div>
      </section>

      {/* Admin Dashboard */}
      {token && (
        <section
          id="admin-dashboard"
          className="admin-dashboard"
        >
          <h2>Admin Dashboard</h2>
          <p>Manage your ProductHub products here.</p>

          <div className="admin-form-card">
            <h3>
              {editingId !== null ? "Edit Product" : "Add New Product"}
            </h3>

            <form onSubmit={handleProductSubmit}>
              <label htmlFor="product-name">Product Name</label>
              <input
                id="product-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter product name"
                required
              />

              <label htmlFor="product-price">Price (₹)</label>
              <input
                id="product-price"
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="Enter price"
                required
              />

              <label htmlFor="product-category">Category</label>
              <input
                id="product-category"
                type="text"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Enter category"
                required
              />

              {formMessage && (
                <p className="admin-success">{formMessage}</p>
              )}

              {formError && (
                <p className="admin-error">{formError}</p>
              )}

              <div className="admin-form-buttons">
                <button type="submit" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingId !== null
                    ? "Update Product"
                    : "Add Product"}
                </button>

                {editingId !== null && (
                  <button
                    type="button"
                    onClick={resetForm}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="admin-product-list">
            <h3>Manage Products</h3>

            {products.map((product) => (
              <div
                className="admin-product-row"
                key={product.id}
              >
                <div>
                  <strong>{product.name}</strong>
                  <p>
                    {product.category} · ₹{product.price}
                  </p>
                </div>

                <div className="admin-product-actions">
                  <button onClick={() => handleEdit(product)}>
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(product.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Public Products Section */}
      <section id="products" className="products-section">
        <h2>Featured Products</h2>

        {loading && <p>Loading products...</p>}

        {error && <p>{error}</p>}

        {!loading && !error && (
          <div className="products-grid">
            {products.map((product) => (
              <div className="product-card" key={product.id}>
                <img
                  src={getProductImage(product.id)}
                  alt={product.name}
                />

                <div className="product-info">
                  <p>{product.category}</p>
                  <h3>{product.name}</h3>
                  <h4>₹{product.price}</h4>

                  <button>Add to Cart</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;