import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import pool from "./db";

const app = express();
const PORT = 5000;

// Check required environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !JWT_SECRET) {
  throw new Error(
    "Missing ADMIN_USERNAME, ADMIN_PASSWORD, or JWT_SECRET in .env"
  );
}

// Hash the admin password when the server starts
const adminPasswordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);

app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.send("ProductHub Backend is Running!");
});

// =====================================
// ADMIN LOGIN API
// =====================================
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username ||
    !password
  ) {
    return res.status(400).json({
      message: "Please provide username and password",
    });
  }

  // Check admin username
  if (username !== ADMIN_USERNAME) {
    return res.status(401).json({
      message: "Invalid username or password",
    });
  }

  // Compare password securely
  const isPasswordValid = await bcrypt.compare(
    password,
    adminPasswordHash
  );

  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Invalid username or password",
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    { role: "admin" },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  return res.status(200).json({
    message: "Admin login successful",
    token,
  });
});

// =====================================
// ADMIN AUTHENTICATION MIDDLEWARE
// =====================================
function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  // Token should be sent as: Bearer <token>
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  if (!token) {
    return res.status(401).json({
      message: "Admin login required",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (
      typeof decoded === "string" ||
      decoded.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Admin access only",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token. Please login again.",
    });
  }
}

// =====================================
// GET API - PUBLIC
// Fetch all products from MySQL
// =====================================
app.get("/api/products", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM products ORDER BY id ASC"
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching products:", error);

    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
});

// =====================================
// POST API - ADMIN ONLY
// Add a new product
// =====================================
app.post(
  "/api/products",
  requireAdmin,
  async (req, res) => {
    const { name, price, category } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price <= 0 ||
      typeof category !== "string" ||
      !category.trim()
    ) {
      return res.status(400).json({
        message: "Please provide valid name, price, and category",
      });
    }

    try {
      const [result] = await pool.execute(
        "INSERT INTO products (name, price, category) VALUES (?, ?, ?)",
        [name.trim(), price, category.trim()]
      );

      const insertId = (result as any).insertId;

      res.status(201).json({
        message: "Product added successfully",
        product: {
          id: insertId,
          name: name.trim(),
          price,
          category: category.trim(),
        },
      });
    } catch (error) {
      console.error("Error adding product:", error);

      res.status(500).json({
        message: "Failed to add product",
      });
    }
  }
);

// =====================================
// PUT API - ADMIN ONLY
// Update an existing product
// =====================================
app.put(
  "/api/products/:id",
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);
    const { name, price, category } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Please provide a valid product ID",
      });
    }

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price <= 0 ||
      typeof category !== "string" ||
      !category.trim()
    ) {
      return res.status(400).json({
        message: "Please provide valid name, price, and category",
      });
    }

    try {
      const [result] = await pool.execute(
        "UPDATE products SET name = ?, price = ?, category = ? WHERE id = ?",
        [name.trim(), price, category.trim(), id]
      );

      const affectedRows = (result as any).affectedRows;

      if (affectedRows === 0) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      res.status(200).json({
        message: "Product updated successfully",
        product: {
          id,
          name: name.trim(),
          price,
          category: category.trim(),
        },
      });
    } catch (error) {
      console.error("Error updating product:", error);

      res.status(500).json({
        message: "Failed to update product",
      });
    }
  }
);

// =====================================
// DELETE API - ADMIN ONLY
// Delete a product
// =====================================
app.delete(
  "/api/products/:id",
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Please provide a valid product ID",
      });
    }

    try {
      const [rows] = await pool.execute(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );

      const products = rows as any[];

      if (products.length === 0) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      const deletedProduct = products[0];

      await pool.execute(
        "DELETE FROM products WHERE id = ?",
        [id]
      );

      res.status(200).json({
        message: "Product deleted successfully",
        product: deletedProduct,
      });
    } catch (error) {
      console.error("Error deleting product:", error);

      res.status(500).json({
        message: "Failed to delete product",
      });
    }
  }
);

// =====================================
// START SERVER
// =====================================
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});