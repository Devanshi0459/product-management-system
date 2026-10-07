
import { useEffect, useState } from "react";
import "./MyOrders.css";

type OrderItem = {
  id: number;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

type Order = {
  id: number;
  customer_name: string;
  created_at: string;
  total_amount: number;
  status: string;
  order_items: OrderItem[];
};

function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyOrders = async () => {
      const token = localStorage.getItem("customerToken");

      if (!token) {
        setError("Please login as a customer to view your orders.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/customers/my-orders",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch orders");
        }

        setOrders(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, []);

  if (loading) {
    return <p>Loading your orders...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "30px auto", padding: "20px" }}>
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <p>You have not placed any orders yet.</p>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h3>Order #{order.id}</h3>

            <p>
              <strong>Date:</strong>{" "}
              {new Date(order.created_at).toLocaleDateString()}
            </p>

            <p>
              <strong>Status:</strong> {order.status}
            </p>

            <h4>Products</h4>

            {order.order_items.map((item) => (
              <div key={item.id}>
                <p>
                  {item.product_name} × {item.quantity}
                  {" — ₹"}
                  {item.subtotal.toLocaleString("en-IN")}
                </p>
              </div>
            ))}

            <h3>
              Total: ₹{order.total_amount.toLocaleString("en-IN")}
            </h3>
          </div>
        ))
      )}
    </div>
  );
}

export default MyOrders;
