import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// POST /api/orders — Create order from cart
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { address, city, state, pin, deliveryOption, notes } = req.body;

    // 1. Get cart with items
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { listing: { include: { product: true, farmer: { include: { user: true } }, fpo: { include: { user: true } } } } } } }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // 2. Validate inventory
    for (const item of cart.items) {
      if (item.quantity > item.listing.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${item.listing.product.name}. Available: ${item.listing.quantity} ${item.listing.unit}` 
        });
      }
    }

    // 3. Calculate total
    const deliveryFee = deliveryOption === 'EXPRESS' ? 80 : 40;
    const subtotal = cart.items.reduce((sum, item) => sum + item.quantity * item.listing.price, 0);
    const total = subtotal + deliveryFee;

    // 4. Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          buyerId: userId,
          total: Math.round(total * 100) / 100,
          status: 'PENDING',
          shippingAddress: address || '123 Main Road',
          shippingCity: city || 'Indore',
          shippingState: state || 'Madhya Pradesh',
          shippingPin: pin || '452001',
          paymentMethod: 'DEMO',
          paymentStatus: 'COMPLETED',
          notes: notes || null,
          items: {
            create: cart.items.map(item => ({
              listingId: item.listingId,
              quantity: item.quantity,
              price: item.listing.price
            }))
          }
        },
        include: { items: { include: { listing: { include: { product: true } } } } }
      });

      // Reduce listing quantities
      for (const item of cart.items) {
        const newQty = item.listing.quantity - item.quantity;
        await tx.productListing.update({
          where: { id: item.listingId },
          data: {
            quantity: Math.max(0, newQty),
            status: newQty <= 0 ? 'SOLD_OUT' : 'ACTIVE'
          }
        });
      }

      // Create delivery record
      const firstListing = cart.items[0].listing;
      const buyerCity = city || 'Bhopal';
      
      // Simple coordinate lookup
      const cityCoords: Record<string, { lat: number; lng: number }> = {
        'Indore': { lat: 22.7196, lng: 75.8577 },
        'Dewas': { lat: 22.9623, lng: 76.0508 },
        'Bhopal': { lat: 23.2599, lng: 77.4126 },
        'Ujjain': { lat: 23.1765, lng: 75.7885 },
        'Jabalpur': { lat: 23.1815, lng: 79.9864 },
        'Nagpur': { lat: 21.1458, lng: 79.0882 },
        'Jaipur': { lat: 26.9124, lng: 75.7873 },
        'Delhi': { lat: 28.7041, lng: 77.1025 },
      };

      const originCoords = cityCoords[firstListing.location] || { lat: 22.7196, lng: 75.8577 };
      const destCoords = cityCoords[buyerCity] || { lat: 23.2599, lng: 77.4126 };
      
      const dlat = destCoords.lat - originCoords.lat;
      const dlng = destCoords.lng - originCoords.lng;
      const distance = Math.round(Math.sqrt(dlat * dlat + dlng * dlng) * 111 * 1.3 * 10) / 10;

      const etaDays = deliveryOption === 'EXPRESS' ? 1 : 3;
      const eta = new Date();
      eta.setDate(eta.getDate() + etaDays);

      await tx.delivery.create({
        data: {
          orderId: newOrder.id,
          origin: firstListing.location,
          originLat: originCoords.lat,
          originLng: originCoords.lng,
          destination: buyerCity,
          destLat: destCoords.lat,
          destLng: destCoords.lng,
          status: 'PENDING',
          distance,
          duration: Math.round(distance / 35 * 60),
          eta,
          vehicleType: 'Truck'
        }
      });

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    // 5. Create notifications (outside transaction for non-critical)
    const buyer = await prisma.user.findUnique({ where: { id: userId } });
    
    // Notify buyer
    await prisma.notification.create({
      data: {
        userId,
        title: 'Order Placed Successfully',
        message: `Your order #${order.id.slice(-8).toUpperCase()} for ₹${total.toFixed(2)} has been placed successfully.`,
        type: 'ORDER',
        link: `/consumer/orders`
      }
    });

    // Notify farmers
    const farmerIds = new Set<string>();
    for (const item of cart.items) {
      const farmUserId = item.listing.farmer?.user?.id || item.listing.fpo?.user?.id;
      if (farmUserId && !farmerIds.has(farmUserId)) {
        farmerIds.add(farmUserId);
        await prisma.notification.create({
          data: {
            userId: farmUserId,
            title: 'New Order Received',
            message: `New order received from ${buyer?.name || 'a buyer'} for ${item.quantity} ${item.listing.unit} of ${item.listing.product.name}.`,
            type: 'ORDER',
            link: `/farmer/orders`
          }
        });
      }
    }

    res.status(201).json(order);
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

// GET /api/orders — Get orders (role-aware)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { farmerProfile: true, fpo: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    let where: any = {};

    if (user.role === 'ADMIN') {
      // Admin sees all
    } else if (user.role === 'FARMER') {
      const profileId = user.farmerProfile?.id;
      if (!profileId) return res.json([]);
      where = { items: { some: { listing: { farmerId: profileId } } } };
    } else if (user.role === 'FPO') {
      const fpoId = user.fpo?.id;
      if (!fpoId) return res.json([]);
      where = { items: { some: { listing: { fpoId: fpoId } } } };
    } else {
      where = { buyerId: user.id };
    }

    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true, email: true, location: true } },
        items: { include: { listing: { include: { product: true, farmer: { include: { user: { select: { name: true } } } }, fpo: { include: { user: { select: { name: true } } } } } } } },
        delivery: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.order.count({ where });
    res.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id — Order detail
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        buyer: { select: { id: true, name: true, email: true, phone: true, location: true } },
        items: { include: { listing: { include: { product: true, farmer: { include: { user: { select: { name: true, location: true } } } }, fpo: true } } } },
        delivery: true
      }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// PATCH /api/orders/:id/status — Update order status
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { delivery: true, buyer: true }
    });

    // Update delivery status to match
    if (order.delivery) {
      const deliveryStatusMap: Record<string, string> = {
        'CONFIRMED': 'ASSIGNED',
        'PROCESSING': 'PICKED_UP',
        'SHIPPED': 'IN_TRANSIT',
        'DELIVERED': 'DELIVERED'
      };
      const newDeliveryStatus = deliveryStatusMap[status];
      if (newDeliveryStatus) {
        await prisma.delivery.update({
          where: { id: order.delivery.id },
          data: {
            status: newDeliveryStatus,
            completedAt: status === 'DELIVERED' ? new Date() : null
          }
        });
      }
    }

    // Notify buyer
    await prisma.notification.create({
      data: {
        userId: order.buyerId,
        title: `Order ${status.charAt(0) + status.slice(1).toLowerCase()}`,
        message: `Your order #${order.id.slice(-8).toUpperCase()} has been ${status.toLowerCase()}.`,
        type: status === 'DELIVERED' ? 'DELIVERY' : 'ORDER',
        link: `/consumer/orders`
      }
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;
