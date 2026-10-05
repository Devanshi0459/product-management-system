import { useEffect, useState } from "react";
import "./Orders.css";

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: number;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  total_amount: number;
  created_at: string;
  status: "Pending" | "Shipped" | "Delivered";
  order_items: OrderItem[];
}

const API_URL = "http://localhost:5000/api";

function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const updateOrderStatus = async (
  orderId: number,
  status: "Pending" | "Shipped" | "Delivered"
) => {
  try {
    const token = localStorage.getItem("adminToken");

    const response = await fetch(
      `${API_URL}/orders/${orderId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to update order status"
      );
    }

    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
            }
          : order
      )
    );
  } catch (error) {
    console.error(
      "Error updating order status:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Failed to update order status"
    );
  }
};

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("adminToken");

        const response = await fetch(
          `${API_URL}/orders`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch orders"
          );
        }

        const formattedOrders: Order[] = data.map(
          (order: Order) => ({
            ...order,

            total_amount: Number(
              order.total_amount
            ),

            order_items:
              order.order_items.map(
                (item: OrderItem) => ({
                  ...item,
                  price: Number(item.price),
                  subtotal: Number(
                    item.subtotal
                  ),
                })
              ),
          })
        );

        setOrders(formattedOrders);
      } catch (error) {
        console.error(
          "Error fetching orders:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load orders."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <h1>Customer Orders</h1>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <h1>Customer Orders</h1>

          <p className="orders-error">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-container">

        <div className="orders-header">
          <div>
            <h1>Customer Orders</h1>

            <p>
              View customer details and ordered
              products.
            </p>
          </div>

          <div className="orders-count">
            {orders.length}{" "}
            {orders.length === 1
              ? "Order"
              : "Orders"}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="no-orders">
            <h2>No Orders Found</h2>

            <p>
              There are no customer orders yet.
            </p>
          </div>
        ) : (
          <div className="orders-list">

            {orders.map((order) => (
              <div
                className="order-card"
                key={order.id}
              >

                {/* Order Header */}

                <div className="order-card-header">

                  <div>
                    <h2>
                      Order #{order.id}
                    </h2>

                    <p>
                      {new Date(
                        order.created_at
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="order-total-badge">
                    ₹
                    {order.total_amount.toLocaleString(
                      "en-IN"
                    )}
                  </div>
                  <div className="order-status">
  <label>Status</label>

  <select
    value={order.status}
    onChange={(event) =>
      updateOrderStatus(
        order.id,
        event.target.value as
          | "Pending"
          | "Shipped"
          | "Delivered"
      )
    }
  >
    <option value="Pending">
      Pending
    </option>

    <option value="Shipped">
      Shipped
    </option>

    <option value="Delivered">
      Delivered
    </option>
  </select>
</div>

                </div>

                {/* Customer Details */}

                <div className="customer-details">

                  <h3>
                    Customer Details
                  </h3>

                  <div className="customer-grid">

                    <div>
                      <span>Name</span>
                      <strong>
                        {order.customer_name}
                      </strong>
                    </div>

                    <div>
                      <span>Email</span>
                      <strong>
                        {order.email}
                      </strong>
                    </div>

                    <div>
                      <span>Phone</span>
                      <strong>
                        {order.phone}
                      </strong>
                    </div>

                    <div>
                      <span>City</span>
                      <strong>
                        {order.city}
                      </strong>
                    </div>

                    <div>
                      <span>Pincode</span>
                      <strong>
                        {order.pincode}
                      </strong>
                    </div>

                    <div className="customer-address">
                      <span>Address</span>
                      <strong>
                        {order.address}
                      </strong>
                    </div>

                  </div>

                </div>

                {/* Ordered Products */}

                <div className="ordered-products">

                  <h3>
                    Ordered Products
                  </h3>

                  <div className="order-items">

                    {order.order_items.map(
                      (item) => (
                        <div
                          className="order-item"
                          key={item.id}
                        >

                          <div className="order-item-info">

                            <strong>
                              {item.product_name}
                            </strong>

                            <span>
                              ₹
                              {item.price.toLocaleString(
                                "en-IN"
                              )}{" "}
                              × {item.quantity}
                            </span>

                          </div>

                          <strong className="order-item-subtotal">
                            ₹
                            {item.subtotal.toLocaleString(
                              "en-IN"
                            )}
                          </strong>

                        </div>
                      )
                    )}

                  </div>

                </div>

                {/* Order Total */}

                <div className="order-card-footer">

                  <span>
                    Grand Total
                  </span>

                  <strong>
                    ₹
                    {order.total_amount.toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}

export default Orders;