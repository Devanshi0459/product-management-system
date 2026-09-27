
# Product Management System

A full-stack Product Management System built using React, TypeScript, Node.js, Express.js, and MySQL. The application allows users to browse products and provides an admin dashboard to manage products with secure authentication.

## Features

### Customer / Public Interface
- Browse available products.
- View product names, prices, and categories.
- Responsive product storefront UI.

### Admin Dashboard
- Admin login with JWT authentication.
- Add new products.
- View all products.
- Update existing product details.
- Delete products.
- Protected product management API endpoints.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- HTML
- CSS

### Backend
- Node.js
- Express.js
- TypeScript
- MySQL
- JSON Web Token (JWT)
- bcryptjs

## Project Structure

```text
product-management-system/
├── backend/
│   ├── src/
│   │   ├── db.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── .gitignore
├── index.html
├── script.js
└── style.css
```

## Installation and Setup

### Prerequisites

Make sure the following are installed:

- Node.js and npm
- MySQL Server
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Devanshi0459/product-management-system.git
cd product-management-system
```

To use the latest version from the development branch:

```bash
git checkout Devanshi0459
```

### 2. Set Up the Database

Open MySQL and run:

```sql
CREATE DATABASE producthub_db;

USE producthub_db;

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL
);
```

### 3. Configure the Backend

Navigate to the backend folder:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder and add your own local configuration:

```env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=producthub_db
PORT=5000

ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
JWT_SECRET=your_long_random_secret
```

Replace the placeholder values with your own local credentials.

Never upload your `.env` file or real passwords and secrets to GitHub.

Start the backend:

```bash
npm run dev
```

Backend API:

http://localhost:5000

### 4. Set Up the Frontend

Open a new terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the application in your browser:

http://localhost:5173

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/admin/login | Admin login |
| GET | /api/products | Get all products |
| POST | /api/products | Add a product (Admin only) |
| PUT | /api/products/:id | Update a product (Admin only) |
| DELETE | /api/products/:id | Delete a product (Admin only) |

Admin product management endpoints require a valid JWT Bearer token.

## Author

**Devanshi Patel**

GitHub: [Devanshi0459](https://github.com/Devanshi0459)

---

Built as a full-stack product management project to practice frontend development, backend API development, database integration, and authentication.
