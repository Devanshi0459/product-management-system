
import "./App.css";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

import heroImage from "./assets/hero.jpg";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
}

const API_URL = "http://localhost:5000/api";

function App() {
  // Products from MySQL
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search, category filter and sorting
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sort, setSort] = useState("default");

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
  const [imageUrl, setImageUrl] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Admin products table
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminCategory, setAdminCategory] = useState("All");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSizeOptions = [5, 10, 15, 20, 25, 35];

  // Fetch products from backend with search, category and sorting
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const queryParams = new URLSearchParams();

      if (search.trim()) {
        queryParams.append("search", search.trim());
      }

      if (selectedCategory !== "All") {
        queryParams.append("category", selectedCategory);
      }

      if (sort !== "default") {
        queryParams.append("sort", sort);
      }

      const queryString = queryParams.toString();

      const url = queryString
        ? `${API_URL}/products?${queryString}`
        : `${API_URL}/products`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data: Product[] = await response.json();

      // MySQL DECIMAL values may arrive as strings
      const formattedProducts: Product[] = data.map(
        (product) => ({
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
  }, [search, selectedCategory, sort]);

  // Load products whenever search, category or sorting changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Fetch all products for the Admin Dashboard (independent of storefront filters)
  const fetchAdminProducts = useCallback(async () => {
    try {
      setAdminLoading(true);
      setAdminError("");
      const response = await fetch(`${API_URL}/products`);
      if (!response.ok) throw new Error("Failed to fetch admin products");
      const data: Product[] = await response.json();
      setAdminProducts(data.map((product) => ({
        ...product,
        price: Number(product.price),
      })));
    } catch (err) {
      console.error("Admin products error:", err);
      setAdminError("Unable to load admin products.");
    } finally {
      setAdminLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchAdminProducts();
    } else {
      setAdminProducts([]);
    }
  }, [token, fetchAdminProducts]);

  // Get categories for dropdown
  const categories = [
    "All",
    ...Array.from(
      new Set(products.map((product) => product.category))
    ).filter((category) => category !== "All"),
  ];

  // Admin table category filter and pagination
  const adminCategories = [
    "All",
    ...Array.from(
      new Set(adminProducts.map((product) => product.category))
    ).filter((item) => item !== "All"),
  ];

  const filteredAdminProducts = adminProducts.filter((product) =>
    adminCategory === "All" || product.category === adminCategory
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAdminProducts.length / rowsPerPage)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * rowsPerPage;
  const paginatedAdminProducts = filteredAdminProducts.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  // Show only nearby page numbers instead of every page number.
  const paginationPages: (number | "ellipsis")[] = [];
  if (totalPages <= 5) {
    for (let page = 1; page <= totalPages; page += 1) {
      paginationPages.push(page);
    }
  } else if (safeCurrentPage <= 3) {
    paginationPages.push(1, 2, 3, 4, "ellipsis", totalPages);
  } else if (safeCurrentPage >= totalPages - 2) {
    paginationPages.push(1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    paginationPages.push(1, "ellipsis", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "ellipsis", totalPages);
  }

  // Admin login
  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
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
    setImageUrl("");
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
      image_url: imageUrl.trim() || null,
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

      // Refresh storefront and admin table
      await Promise.all([fetchProducts(), fetchAdminProducts()]);
      setCurrentPage(1);
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
    setImageUrl(product.image_url || "");
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

      // Refresh storefront and admin table
      await Promise.all([fetchProducts(), fetchAdminProducts()]);
      setCurrentPage(1);
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
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Enter admin username"
                required
              />

              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
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
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                placeholder="Enter category"
                required
              />

              <label htmlFor="product-image-url">Product Image URL</label>
              <input
                id="product-image-url"
                type="text"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="Enter image URL or upload path"
              />

              {imageUrl.trim() && (
                <div className="admin-image-preview">
                  <p>Image Preview</p>
                  <img
                    src={
                      imageUrl.trim().startsWith("http")
                        ? imageUrl.trim()
                        : `http://localhost:5000${imageUrl.trim().startsWith("/") ? "" : "/"}${imageUrl.trim()}`
                    }
                    alt="Product preview"
                    style={{
                      width: "120px",
                      height: "100px",
                      objectFit: "contain",
                    }}
                  />
                </div>
              )}

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

            <div className="admin-table-controls">
              <div>
                <label htmlFor="admin-category-filter">Category:</label>
                <select
                  id="admin-category-filter"
                  value={adminCategory}
                  onChange={(event) => {
                    setAdminCategory(event.target.value);
                    setCurrentPage(1);
                  }}
                >
                  {adminCategories.map((item) => (
                    <option key={item} value={item}>
                      {item === "All" ? "All Categories" : item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="rows-per-page">Rows per page:</label>
                <select
                  id="rows-per-page"
                  value={rowsPerPage}
                  onChange={(event) => {
                    setRowsPerPage(Number(event.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>

            {adminLoading && <p>Loading admin products...</p>}
            {adminError && <p className="admin-error">{adminError}</p>}

            {!adminLoading && !adminError && (
              <>
                <div className="admin-table-wrapper">
                  <table className="admin-products-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Edit</th>
                        <th>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAdminProducts.length > 0 ? (
                        paginatedAdminProducts.map((product) => (
                          <tr key={product.id}>
                            <td>{product.id}</td>
                            <td>{product.name}</td>
                            <td>{product.category}</td>
                            <td>₹{product.price.toLocaleString("en-IN")}</td>
                            <td>
                              <button type="button" onClick={() => handleEdit(product)}>
                                Edit
                              </button>
                            </td>
                            <td>
                              <button type="button" onClick={() => handleDelete(product.id)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={6}>No products found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="admin-pagination">
                  <p>
                    Showing {filteredAdminProducts.length === 0 ? 0 : startIndex + 1}
                    {" "}to {Math.min(startIndex + rowsPerPage, filteredAdminProducts.length)}
                    {" "}of {filteredAdminProducts.length} products
                  </p>
                  <div className="pagination-buttons">
                    <button
                      type="button"
                      disabled={safeCurrentPage === 1}
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    >Previous</button>

                    {paginationPages.map((page, index) =>
                      page === "ellipsis" ? (
                        <span className="pagination-ellipsis" key={`ellipsis-${index}`} aria-hidden="true">…</span>
                      ) : (
                        <button
                          key={page}
                          type="button"
                          className={safeCurrentPage === page ? "active-page" : ""}
                          aria-current={safeCurrentPage === page ? "page" : undefined}
                          onClick={() => setCurrentPage(page)}
                        >{page}</button>
                      )
                    )}

                    <button
                      type="button"
                      disabled={safeCurrentPage === totalPages}
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    >Next</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Public Products Section */}
      <section id="products" className="products-section">
        <h2>Featured Products</h2>

        {/* Search, Category Filter and Sorting */}
        <div className="product-filters">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
          />

          <select
            value={selectedCategory}
            onChange={(event) =>
              setSelectedCategory(event.target.value)
            }
            aria-label="Filter by category"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All Categories" : item}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort products by price"
          >
            <option value="default">Default Sorting</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
              setSort("default");
            }}
          >
            Clear Filters
          </button>
        </div>

        {loading && <p>Loading products...</p>}

        {error && <p>{error}</p>}

        {!loading && !error && products.length === 0 && (
          <p>No products found. Try changing your filters.</p>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="products-grid">
            {products.map((product) => (
              <div className="product-card" key={product.id}>
                {product.image_url && (
                  <img
                    src={
                      product.image_url.startsWith("http")
                        ? product.image_url
                        : `http://localhost:5000${product.image_url.startsWith("/") ? "" : "/"}${product.image_url}`
                    }
                    alt={product.name}
                    loading="lazy"
                  />
                )}

                <div className="product-info">
                  <p>{product.category}</p>
                  <h3>{product.name}</h3>
                  <h4>₹{product.price.toLocaleString("en-IN")}</h4>

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