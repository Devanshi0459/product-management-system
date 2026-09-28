
import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import path from "path";
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

// Hash admin password when server starts
const adminPasswordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);

app.use(cors());
app.use(express.json());

// =====================================
// SERVE PRODUCT IMAGES
// =====================================

app.use(
  "/images",
  express.static(
    path.join(process.cwd(), "public", "images")
  )
);

// =====================================
// HOME ROUTE
// =====================================

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

  if (username !== ADMIN_USERNAME) {
    return res.status(401).json({
      message: "Invalid username or password",
    });
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    adminPasswordHash
  );

  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Invalid username or password",
    });
  }

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
// Fetch, Search, Filter, Sort and Images
// =====================================

app.get("/api/products", async (req, res) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const category =
      typeof req.query.category === "string"
        ? req.query.category.trim()
        : "";

    const sort =
      typeof req.query.sort === "string"
        ? req.query.sort
        : "default";

    let sql = "SELECT * FROM products WHERE 1=1";

    const params: string[] = [];

    // Search by product name
    if (search) {
      sql += " AND name LIKE ?";
      params.push(`%${search}%`);
    }

    // Filter by category
    if (category && category !== "All") {
      sql += " AND category = ?";
      params.push(category);
    }

    // Sort by price
    if (sort === "price_asc") {
      sql += " ORDER BY price ASC, id ASC";
    } else if (sort === "price_desc") {
      sql += " ORDER BY price DESC, id ASC";
    } else {
      sql += " ORDER BY id ASC";
    }

    const [rows] = await pool.execute(sql, params);

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching products:", error);

    return res.status(500).json({
      message: "Failed to fetch products",
    });
  }
});

// =====================================
// POST API - ADMIN ONLY
// Add a new product with image URL
// =====================================

app.post(
  "/api/products",
  requireAdmin,
  async (req, res) => {
    const { name, price, category, image_url } = req.body;

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

    if (
      image_url !== undefined &&
      image_url !== null &&
      typeof image_url !== "string"
    ) {
      return res.status(400).json({
        message: "Image URL must be a string",
      });
    }

    const imageUrl =
      typeof image_url === "string" && image_url.trim()
        ? image_url.trim()
        : null;

    try {
      const [result] = await pool.execute(
        `INSERT INTO products
         (name, price, category, image_url)
         VALUES (?, ?, ?, ?)`,
        [
          name.trim(),
          price,
          category.trim(),
          imageUrl,
        ]
      );

      const insertId = (result as any).insertId;

      return res.status(201).json({
        message: "Product added successfully",
        product: {
          id: insertId,
          name: name.trim(),
          price,
          category: category.trim(),
          image_url: imageUrl,
        },
      });
    } catch (error) {
      console.error("Error adding product:", error);

      return res.status(500).json({
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

    const { name, price, category, image_url } = req.body;

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

    if (
      image_url !== undefined &&
      image_url !== null &&
      typeof image_url !== "string"
    ) {
      return res.status(400).json({
        message: "Image URL must be a string",
      });
    }

    const imageUrl =
      typeof image_url === "string" && image_url.trim()
        ? image_url.trim()
        : null;

    try {
      const [result] = await pool.execute(
        `UPDATE products
         SET name = ?,
             price = ?,
             category = ?,
             image_url = COALESCE(?, image_url)
         WHERE id = ?`,
        [
          name.trim(),
          price,
          category.trim(),
          imageUrl,
          id,
        ]
      );

      const affectedRows = (result as any).affectedRows;

      if (affectedRows === 0) {
        const [existingRows] = await pool.execute(
          "SELECT id FROM products WHERE id = ?",
          [id]
        );

        if ((existingRows as any[]).length === 0) {
          return res.status(404).json({
            message: "Product not found",
          });
        }
      }

      const [updatedRows] = await pool.execute(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );

      return res.status(200).json({
        message: "Product updated successfully",
        product: (updatedRows as any[])[0],
      });
    } catch (error) {
      console.error("Error updating product:", error);

      return res.status(500).json({
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

      return res.status(200).json({
        message: "Product deleted successfully",
        product: deletedProduct,
      });
    } catch (error) {
      console.error("Error deleting product:", error);

      return res.status(500).json({
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