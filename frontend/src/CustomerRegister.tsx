
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

function CustomerRegister() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/customers/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Registration failed"
        );
      }

      setMessage("Registration successful!");

      setTimeout(() => {
        navigate("/customer-login");
      }, 1000);
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
        <h2>Create Customer Account</h2>
        <p>Register to shop with ProductHub.</p>

        <form onSubmit={handleRegister}>
          <label htmlFor="customer-name">Full Name</label>
          <input
            id="customer-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
          />

          <label htmlFor="customer-email">Email</label>
          <input
            id="customer-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <label htmlFor="customer-password">Password</label>
          <input
            id="customer-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            minLength={8}
            required
          />

          {message && <p className="auth-success">{message}</p>}
          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p>
          Already have an account?{" "}
          <Link to="/customer-login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default CustomerRegister;
