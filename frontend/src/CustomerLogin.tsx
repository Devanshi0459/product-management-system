
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CustomerLogin.css";
const API_URL = "http://localhost:5000/api";

function CustomerLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/customers/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

    
localStorage.removeItem("adminToken");
window.dispatchEvent(new Event("adminAuthChanged"));

localStorage.setItem("customerToken", data.token);
localStorage.setItem("customerData", JSON.stringify(data.customer));



window.dispatchEvent(new Event("customerAuthChanged"));

navigate("/");

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-auth-page">
      <div className="customer-auth-card">
        <h2>Customer Login</h2>
        <p>Login to your ProductHub account.</p>

        <form onSubmit={handleLogin}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p>
          Don't have an account?{" "}
          <Link to="/customer-register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default CustomerLogin;
