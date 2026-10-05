import "dotenv/config";

import express from "express";

import cors from "cors";

import bcrypt from "bcryptjs";

import * as jwt from "jsonwebtoken";

import path from "path";

import type { Request, Response, NextFunction } from "express";

import prisma from "./lib/prisma";

const app = express();

const PORT = 5000;

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in .env");
}

app.use(cors());

app.use(express.json());

// =====================================
// SERVE PRODUCT IMAGES
// =====================================

app.use(
  "/images",
  express.static(path.join(process.cwd(), "public", "images"))
);

// =====================================
// HOME ROUTE
// =====================================

app.get("/", (req, res) => {
  res.send("ProductHub Backend is Running!");
});

// =====================================
// ADMIN LOGIN API - PRISMA
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

  try {
    const admin = await prisma.admins.findUnique({
      where: {
        username,
      },
    });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      admin.password_hash
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
  } catch (error) {
    console.error("Error during admin login:", error);

    return res.status(500).json({
      message: "Login failed",
    });
  }
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
    const decoded = jwt.verify(token, JWT_SECRET!);

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
// Fetch, Search, Filter, Sort
// Using Prisma findMany()
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

    const where: any = {};

    // Search by product name
    if (search) {
      where.name = {
        contains: search,
      };
    }

    // Filter by category
    if (category && category !== "All") {
      where.category = category;
    }

    let orderBy: any = {
      id: "asc",
    };

    // Sort by price
    if (sort === "price_asc") {
      orderBy = [
        { price: "asc" },
        { id: "asc" },
      ];
    } else if (sort === "price_desc") {
      orderBy = [
        { price: "desc" },
        { id: "asc" },
      ];
    }

    const products = await prisma.products.findMany({
      where,
      orderBy,
    });

    const formattedProducts = products.map((product) => ({
      ...product,
      price: Number(product.price),
    }));

    return res.status(200).json(formattedProducts);
  } catch (error) {
    console.error("Error fetching products:", error);

    return res.status(500).json({
      message: "Failed to fetch products",
    });
  }
});

// =====================================
// GET SINGLE PRODUCT API - PUBLIC
// Fetch one product by ID
// Using Prisma findUnique()
// =====================================

app.get("/api/products/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Please provide a valid product ID",
    });
  }

  try {
    const product = await prisma.products.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json({
      ...product,
      price: Number(product.price),
    });
  } catch (error) {
    console.error("Error fetching product:", error);

    return res.status(500).json({
      message: "Failed to fetch product",
    });
  }
});

// =====================================
// POST API - ADMIN ONLY
// Add a new product
// Using Prisma create()
// =====================================

app.post(
  "/api/products",
  requireAdmin,
  async (req, res) => {
    const {
      name,
      price,
      category,
      image_url,
      description,
    } = req.body;

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

    // Validate image URL
    if (
      image_url !== undefined &&
      image_url !== null &&
      typeof image_url !== "string"
    ) {
      return res.status(400).json({
        message: "Image URL must be a string",
      });
    }

    // Validate description
    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        message: "Description must be a string",
      });
    }

    const imageUrl =
      typeof image_url === "string" && image_url.trim()
        ? image_url.trim()
        : null;

    const productDescription =
      typeof description === "string" && description.trim()
        ? description.trim()
        : null;

    try {
      const product = await prisma.products.create({
        data: {
          name: name.trim(),
          price,
          category: category.trim(),
          image_url: imageUrl,
          description: productDescription,
        },
      });

      return res.status(201).json({
        message: "Product added successfully",
        product: {
          ...product,
          price: Number(product.price),
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
// Using Prisma update()
// =====================================

app.put(
  "/api/products/:id",
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);

    const {
      name,
      price,
      category,
      image_url,
      description,
    } = req.body;

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

    // Validate image URL
    if (
      image_url !== undefined &&
      image_url !== null &&
      typeof image_url !== "string"
    ) {
      return res.status(400).json({
        message: "Image URL must be a string",
      });
    }

    // Validate description
    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        message: "Description must be a string",
      });
    }

    try {
      const existingProduct = await prisma.products.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      const data: {
        name: string;
        price: number;
        category: string;
        image_url?: string;
        description?: string | null;
      } = {
        name: name.trim(),
        price,
        category: category.trim(),
      };

      // Preserve existing image
      // when image_url is not provided/null
      if (typeof image_url === "string" && image_url.trim()) {
        data.image_url = image_url.trim();
      }

      // Update description when provided
      if (typeof description === "string") {
        data.description = description.trim()
          ? description.trim()
          : null;
      }

      const updatedProduct = await prisma.products.update({
        where: { id },
        data,
      });

      return res.status(200).json({
        message: "Product updated successfully",
        product: {
          ...updatedProduct,
          price: Number(updatedProduct.price),
        },
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
// Using Prisma delete()
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
      const product = await prisma.products.findUnique({
        where: { id },
      });

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      const deletedProduct = await prisma.products.delete({
        where: { id },
      });

      return res.status(200).json({
        message: "Product deleted successfully",
        product: {
          ...deletedProduct,
          price: Number(deletedProduct.price),
        },
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
// POST API - PUBLIC
// Create a new customer order
// =====================================

app.post("/api/orders", async (req, res) => {
  const {
    customer_name,
    email,
    phone,
    address,
    city,
    pincode,
    items,
  } = req.body;

  // Validate customer details
  if (
    typeof customer_name !== "string" ||
    !customer_name.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof phone !== "string" ||
    !phone.trim() ||
    typeof address !== "string" ||
    !address.trim() ||
    typeof city !== "string" ||
    !city.trim() ||
    typeof pincode !== "string" ||
    !pincode.trim()
  ) {
    return res.status(400).json({
      message: "Please provide all customer details",
    });
  }

  // Validate cart items
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "Order must contain at least one product",
    });
  }

  try {
    // Calculate total on backend
    let totalAmount = 0;

    const orderItemsData = items.map((item: any) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);

      if (
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        throw new Error("Invalid product price or quantity");
      }

      const subtotal = price * quantity;

      totalAmount += subtotal;

      return {
        product_id:
          Number.isInteger(Number(item.id))
            ? Number(item.id)
            : null,
        product_name: String(item.name),
        price,
        quantity,
        subtotal,
      };
    });

    // Create order and order items together
    const order = await prisma.orders.create({
      data: {
        customer_name: customer_name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        total_amount: totalAmount,

        order_items: {
          create: orderItemsData,
        },
      },

      include: {
        order_items: true,
      },
    });

    return res.status(201).json({
      message: "Order placed successfully",
      order: {
        ...order,
        total_amount: Number(order.total_amount),
        order_items: order.order_items.map((item) => ({
          ...item,
          price: Number(item.price),
          subtotal: Number(item.subtotal),
        })),
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);

    return res.status(500).json({
      message: "Failed to place order",
    });
  }
});
// =====================================
// GET API - ADMIN ONLY
// Fetch all customer orders
// =====================================

app.get(
  "/api/orders",
  requireAdmin,
  async (req, res) => {
    try {
      const orders = await prisma.orders.findMany({
        orderBy: {
          created_at: "desc",
        },

        include: {
          order_items: true,
        },
      });

      const formattedOrders = orders.map((order) => ({
        ...order,

        total_amount: Number(order.total_amount),

        order_items: order.order_items.map((item) => ({
          ...item,
          price: Number(item.price),
          subtotal: Number(item.subtotal),
        })),
      }));

      return res.status(200).json(formattedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);

      return res.status(500).json({
        message: "Failed to fetch orders",
      });
    }
  }
);


app.put(
  "/api/orders/:id/status",
  requireAdmin,
  async (req, res) => {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Shipped",
      "Delivered",
    ];

    if (!Number.isInteger(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Invalid status. Use Pending, Shipped, or Delivered.",
      });
    }

    try {
      const existingOrder = await prisma.orders.findUnique({
        where: {
          id: orderId,
        },
      });

      if (!existingOrder) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      const updatedOrder = await prisma.orders.update({
        where: {
          id: orderId,
        },
        data: {
          status,
        },
      });

      return res.status(200).json({
        message: "Order status updated successfully",
        order: {
          ...updatedOrder,
          total_amount: Number(
            updatedOrder.total_amount
          ),
        },
      });
    } catch (error) {
      console.error(
        "Error updating order status:",
        error
      );

      return res.status(500).json({
        message: "Failed to update order status",
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