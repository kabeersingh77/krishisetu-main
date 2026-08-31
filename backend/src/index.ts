import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import http from "http";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import listingRoutes from "./routes/listings.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import notificationRoutes from "./routes/notifications.js";
import aiRoutes from "./routes/ai.js";
import logisticsRoutes from "./routes/logistics.js";
import analyticsRoutes from "./routes/analytics.js";
import savedRoutes from "./routes/saved.js";
import userRoutes from "./routes/users.js";

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());

// Friendly Root Endpoints for browser visits
app.get("/", (req, res) => {
  res.json({
    name: "Agriflow API Server",
    status: "ONLINE",
    message:
      "Backend API is running. Open the frontend web app to explore the marketplace.",
    version: "1.0.0",
    endpoints: [
      "/api/auth/login",
      "/api/auth/register",
      "/api/products",
      "/api/listings",
      "/api/cart",
      "/api/orders",
      "/api/logistics/deliveries",
      "/api/ai/price-recommendation",
      "/api/ai/demand-forecast",
      "/api/analytics/impact",
    ],
  });
});

app.get("/api", (req, res) => {
  res.json({
    status: "API ONLINE",
    time: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/logistics", logisticsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/users", userRoutes);

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: err?.message });
  },
);

// Only bind WebSocket and HTTP listener when running standalone (not inside Vercel serverless handler)
if (!process.env.VERCEL) {
  const wss = new WebSocketServer({ server });
  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    ws.on("close", () => console.log("WebSocket client disconnected"));
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`🌾 Agriflow Backend running on http://localhost:${PORT}`);
    console.log(`🌐 Frontend Web App available at http://localhost:5173`);
  });
}

export default app;
export { app, server };
