import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import listingRoutes from './routes/listings';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import notificationRoutes from './routes/notifications';
import aiRoutes from './routes/ai';
import logisticsRoutes from './routes/logistics';
import analyticsRoutes from './routes/analytics';
import savedRoutes from './routes/saved';
import userRoutes from './routes/users';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors({ origin: '*' }));
app.use(express.json());

// Friendly Root Endpoints for browser visits
app.get('/', (req, res) => {
  res.json({
    name: 'KrishiSetu API Server',
    status: 'ONLINE',
    message: 'Backend API is running. Open http://localhost:5173 in your browser to view the KrishiSetu web application.',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: [
      '/api/auth/login',
      '/api/auth/register',
      '/api/products',
      '/api/listings',
      '/api/cart',
      '/api/orders',
      '/api/logistics/deliveries',
      '/api/ai/price-recommendation',
      '/api/ai/demand-forecast',
      '/api/analytics/impact'
    ]
  });
});

app.get('/api', (req, res) => {
  res.json({
    status: 'API ONLINE',
    time: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/users', userRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err?.message });
});

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  ws.on('close', () => console.log('WebSocket client disconnected'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌾 KrishiSetu Backend running on http://localhost:${PORT}`);
  console.log(`🌐 Frontend Web App available at http://localhost:5173`);
});
