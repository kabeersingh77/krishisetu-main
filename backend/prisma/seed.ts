import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CITIES = [
  { name: "Indore", lat: 22.7196, lng: 75.8577, state: "Madhya Pradesh" },
  { name: "Dewas", lat: 22.9623, lng: 76.0508, state: "Madhya Pradesh" },
  { name: "Bhopal", lat: 23.2599, lng: 77.4126, state: "Madhya Pradesh" },
  { name: "Ujjain", lat: 23.1765, lng: 75.7885, state: "Madhya Pradesh" },
  { name: "Jabalpur", lat: 23.1815, lng: 79.9864, state: "Madhya Pradesh" },
  { name: "Nagpur", lat: 21.1458, lng: 79.0882, state: "Maharashtra" },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873, state: "Rajasthan" },
  { name: "Delhi", lat: 28.7041, lng: 77.1025, state: "Delhi" },
];

const PRODUCTS_DATA = [
  {
    name: "Tomato",
    category: "Vegetable",
    unit: "kg",
    basePrice: 45,
    seasonalPeak: [5, 6, 7],
  },
  {
    name: "Potato",
    category: "Vegetable",
    unit: "kg",
    basePrice: 28,
    seasonalPeak: [10, 11, 0],
  },
  {
    name: "Onion",
    category: "Vegetable",
    unit: "kg",
    basePrice: 35,
    seasonalPeak: [1, 2, 3],
  },
  {
    name: "Wheat",
    category: "Grain",
    unit: "kg",
    basePrice: 26,
    seasonalPeak: [3, 4, 5],
  },
  {
    name: "Soybean",
    category: "Grain",
    unit: "kg",
    basePrice: 55,
    seasonalPeak: [9, 10, 11],
  },
  {
    name: "Rice",
    category: "Grain",
    unit: "kg",
    basePrice: 42,
    seasonalPeak: [8, 9, 10],
  },
  {
    name: "Chilli",
    category: "Spice",
    unit: "kg",
    basePrice: 115,
    seasonalPeak: [11, 0, 1],
  },
  {
    name: "Cauliflower",
    category: "Vegetable",
    unit: "kg",
    basePrice: 32,
    seasonalPeak: [10, 11, 0],
  },
  {
    name: "Cabbage",
    category: "Vegetable",
    unit: "kg",
    basePrice: 20,
    seasonalPeak: [10, 11, 0],
  },
  {
    name: "Mango",
    category: "Fruit",
    unit: "kg",
    basePrice: 90,
    seasonalPeak: [4, 5, 6],
  },
];

const FARMER_NAMES = [
  { name: "Vikram Singh", city: 3 }, // Ujjain
  { name: "Sunita Devi", city: 1 }, // Dewas
  { name: "Mohan Yadav", city: 4 }, // Jabalpur
  { name: "Lakshmi Bai", city: 2 }, // Bhopal
  { name: "Ramesh Gupta", city: 5 }, // Nagpur
  { name: "Kamal Verma", city: 6 }, // Jaipur
  { name: "Deepak Sharma", city: 7 }, // Delhi
  { name: "Geeta Patel", city: 0 }, // Indore
  { name: "Arjun Reddy", city: 5 }, // Nagpur
  { name: "Sanjay Tiwari", city: 3 }, // Ujjain
  { name: "Meena Kumari", city: 1 }, // Dewas
  { name: "Ravi Kumar", city: 4 }, // Jabalpur
];

const QUALITY_GRADES = ["Grade A", "Grade B", "Grade C"];
const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];
const DELIVERY_STATUSES = [
  "PENDING",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
];
const DRIVERS = [
  "Raju Singh",
  "Mahesh Yadav",
  "Dinesh Joshi",
  "Amit Chauhan",
  "Prakash Verma",
];
const VEHICLES = [
  "MP09-AB-1234",
  "MP09-CD-5678",
  "MP04-EF-9012",
  "RJ14-GH-3456",
  "DL01-IJ-7890",
];

// Deterministic pseudo-random based on index (no Math.random for reproducibility)
function seededValue(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  const normalized = x - Math.floor(x);
  return min + normalized * (max - min);
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  console.log("🌾 Starting Agriflow database seed...");

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.savedProduct.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.priceRecommendation.deleteMany();
  await prisma.demandForecast.deleteMany();
  await prisma.marketPrice.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productListing.deleteMany();
  await prisma.product.deleteMany();
  await prisma.farmerProfile.deleteMany();
  await prisma.fPO.deleteMany();
  await prisma.user.deleteMany();

  const passHash = await bcrypt.hash("Demo@123", 10);

  // ========================================
  // 1. Create Demo Users
  // ========================================
  console.log("  Creating demo users...");

  const farmerUser = await prisma.user.create({
    data: {
      name: "Rajesh Patel",
      email: "farmer@Agriflow.demo",
      passwordHash: passHash,
      role: "FARMER",
      phone: "+91 98765 43210",
      location: "Indore",
      cart: { create: {} },
    },
  });
  const farmerProfile = await prisma.farmerProfile.create({
    data: {
      userId: farmerUser.id,
      farmName: "Patel Organic Farms",
      farmSize: "12 acres",
      farmLocation: "Indore",
      lat: 22.7196,
      lng: 75.8577,
      verified: true,
      certifications: JSON.stringify(["Organic India", "FSSAI"]),
    },
  });

  const fpoUser = await prisma.user.create({
    data: {
      name: "Amit Sharma",
      email: "fpo@Agriflow.demo",
      passwordHash: passHash,
      role: "FPO",
      phone: "+91 98765 43211",
      location: "Dewas",
      cart: { create: {} },
    },
  });
  const fpoOrg = await prisma.fPO.create({
    data: {
      userId: fpoUser.id,
      name: "Narmada Valley FPO",
      location: "Dewas",
      lat: 22.9623,
      lng: 76.0508,
      memberCount: 148,
      verified: true,
      description:
        "Collective of 148 farmers from Dewas district specializing in organic vegetables and grains.",
    },
  });

  const consumerUser = await prisma.user.create({
    data: {
      name: "Priya Verma",
      email: "consumer@Agriflow.demo",
      passwordHash: passHash,
      role: "CONSUMER",
      phone: "+91 98765 43212",
      location: "Bhopal",
      cart: { create: {} },
    },
  });

  const buyerUser = await prisma.user.create({
    data: {
      name: "Hotel Spice Garden",
      email: "buyer@Agriflow.demo",
      passwordHash: passHash,
      role: "BULK_BUYER",
      phone: "+91 98765 43213",
      location: "Indore",
      cart: { create: {} },
    },
  });

  const logisticsUser = await prisma.user.create({
    data: {
      name: "Suresh Transport",
      email: "logistics@Agriflow.demo",
      passwordHash: passHash,
      role: "LOGISTICS",
      phone: "+91 98765 43214",
      location: "Indore",
      cart: { create: {} },
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@Agriflow.demo",
      passwordHash: passHash,
      role: "ADMIN",
      phone: "+91 98765 43215",
      location: "Delhi",
      cart: { create: {} },
    },
  });

  // ========================================
  // 2. Create Additional Farmers
  // ========================================
  console.log("  Creating additional farmers...");

  const farmerProfiles: any[] = [farmerProfile];
  for (let i = 0; i < FARMER_NAMES.length; i++) {
    const f = FARMER_NAMES[i];
    const city = CITIES[f.city];
    const user = await prisma.user.create({
      data: {
        name: f.name,
        email: `farmer${i + 1}@Agriflow.demo`,
        passwordHash: passHash,
        role: "FARMER",
        phone: `+91 9876${String(i + 10).padStart(2, "0")}${String(1000 + i * 111).slice(0, 4)}`,
        location: city.name,
        cart: { create: {} },
      },
    });
    const profile = await prisma.farmerProfile.create({
      data: {
        userId: user.id,
        farmName: `${f.name.split(" ")[0]}'s Farm`,
        farmSize: `${5 + ((i * 3) % 20)} acres`,
        farmLocation: city.name,
        lat: city.lat + seededValue(i, -0.05, 0.05),
        lng: city.lng + seededValue(i + 100, -0.05, 0.05),
        verified: i % 3 !== 2,
        certifications: i % 4 === 0 ? JSON.stringify(["FSSAI"]) : null,
      },
    });
    farmerProfiles.push(profile);
  }

  // ========================================
  // 3. Create Additional FPOs
  // ========================================
  console.log("  Creating additional FPOs...");

  const fpoOrgs: any[] = [fpoOrg];
  const fpoData = [
    {
      name: "Malwa Kisan FPO",
      cityIdx: 0,
      members: 92,
      desc: "Cooperative of farmers in Indore region focusing on soybean and wheat production.",
    },
    {
      name: "Vindhya Agri FPO",
      cityIdx: 4,
      members: 67,
      desc: "Jabalpur-based farmer collective specializing in rice and vegetables.",
    },
  ];
  for (let i = 0; i < fpoData.length; i++) {
    const fd = fpoData[i];
    const city = CITIES[fd.cityIdx];
    const user = await prisma.user.create({
      data: {
        name: `${fd.name} Manager`,
        email: `fpo${i + 1}@Agriflow.demo`,
        passwordHash: passHash,
        role: "FPO",
        phone: `+91 9877${String(i + 20).padStart(2, "0")}0000`,
        location: city.name,
        cart: { create: {} },
      },
    });
    const org = await prisma.fPO.create({
      data: {
        userId: user.id,
        name: fd.name,
        location: city.name,
        lat: city.lat,
        lng: city.lng,
        memberCount: fd.members,
        verified: true,
        description: fd.desc,
      },
    });
    fpoOrgs.push(org);
  }

  // Additional consumers and bulk buyers
  const extraConsumers: string[] = [];
  const consumerNames = [
    "Anita Desai",
    "Rohit Mehta",
    "Kavita Jain",
    "Nitin Agarwal",
    "Pooja Saxena",
  ];
  for (let i = 0; i < consumerNames.length; i++) {
    const city = CITIES[i % CITIES.length];
    const u = await prisma.user.create({
      data: {
        name: consumerNames[i],
        email: `consumer${i + 1}@Agriflow.demo`,
        passwordHash: passHash,
        role: "CONSUMER",
        phone: `+91 9878${String(i + 30).padStart(2, "0")}0000`,
        location: city.name,
        cart: { create: {} },
      },
    });
    extraConsumers.push(u.id);
  }

  const extraBuyers: string[] = [];
  const buyerNames = [
    "Taj Restaurant",
    "FreshMart Retail",
    "City Hospital Canteen",
  ];
  for (let i = 0; i < buyerNames.length; i++) {
    const city = CITIES[i % CITIES.length];
    const u = await prisma.user.create({
      data: {
        name: buyerNames[i],
        email: `buyer${i + 1}@Agriflow.demo`,
        passwordHash: passHash,
        role: "BULK_BUYER",
        phone: `+91 9879${String(i + 40).padStart(2, "0")}0000`,
        location: city.name,
        cart: { create: {} },
      },
    });
    extraBuyers.push(u.id);
  }

  // ========================================
  // 4. Create Products
  // ========================================
  console.log("  Creating products...");

  const products: any[] = [];
  for (const pd of PRODUCTS_DATA) {
    const p = await prisma.product.create({
      data: {
        name: pd.name,
        category: pd.category,
        unit: pd.unit,
        variety:
          pd.name === "Tomato"
            ? "Roma"
            : pd.name === "Mango"
              ? "Alphonso"
              : pd.name === "Rice"
                ? "Basmati"
                : undefined,
      },
    });
    products.push(p);
  }

  // ========================================
  // 5. Create Market Prices (200+ records, 90 days)
  // ========================================
  console.log("  Creating market price history...");

  let marketPriceCount = 0;
  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const date = daysAgo(dayOffset);
    for (let pi = 0; pi < products.length; pi++) {
      const product = products[pi];
      const pd = PRODUCTS_DATA[pi];
      // Generate prices for 3 locations per day
      const locations = [CITIES[0], CITIES[2], CITIES[4]]; // Indore, Bhopal, Jabalpur
      for (let li = 0; li < locations.length; li++) {
        const loc = locations[li];
        // Deterministic price variation: base + seasonal sine wave + trend + location offset
        const month = date.getMonth();
        const isPeak = pd.seasonalPeak.includes(month);
        const seasonalMult = isPeak ? 1.15 : 0.95;
        const trendFactor = 1 + (90 - dayOffset) * 0.001; // slight upward trend
        const locationOffset = li * 2 - 2; // -2, 0, +2
        const dailyVariation =
          Math.sin(dayOffset * 0.3 + pi * 1.5) * pd.basePrice * 0.08;
        const price =
          Math.round(
            (pd.basePrice * seasonalMult * trendFactor +
              locationOffset +
              dailyVariation) *
              100,
          ) / 100;

        await prisma.marketPrice.create({
          data: {
            productId: product.id,
            location: loc.name,
            price: Math.max(price, pd.basePrice * 0.7),
            date,
            source: "MANDI",
          },
        });
        marketPriceCount++;
      }
    }
  }
  console.log(`    Created ${marketPriceCount} market price records`);

  // ========================================
  // 6. Create Product Listings (45+ listings)
  // ========================================
  console.log("  Creating product listings...");

  const listings: any[] = [];
  for (let i = 0; i < 45; i++) {
    const pi = i % products.length;
    const product = products[pi];
    const pd = PRODUCTS_DATA[pi];

    // Alternate between farmer and FPO listings
    const isFPO = i % 6 === 0 && fpoOrgs.length > 0;
    const farmerIdx = i % farmerProfiles.length;
    const fpoIdx = i % fpoOrgs.length;

    const farmer = isFPO ? null : farmerProfiles[farmerIdx];
    const fpo = isFPO ? fpoOrgs[fpoIdx] : null;
    const loc = isFPO
      ? CITIES.find((c) => c.name === fpo.location) || CITIES[0]
      : CITIES.find((c) => c.name === farmer.farmLocation) || CITIES[0];

    const qualityIdx = Math.floor(seededValue(i * 7, 0, 2.99));
    const quality = QUALITY_GRADES[qualityIdx];
    const qualityMult =
      quality === "Grade A" ? 1.08 : quality === "Grade C" ? 0.88 : 1.0;

    const quantity = Math.round(seededValue(i * 13, 50, 800));
    const price =
      Math.round(
        pd.basePrice * qualityMult * seededValue(i * 3, 0.9, 1.15) * 100,
      ) / 100;
    const harvestDaysAgo = Math.round(seededValue(i * 5, 1, 14));

    const listing = await prisma.productListing.create({
      data: {
        productId: product.id,
        farmerId: farmer?.id || null,
        fpoId: fpo?.id || null,
        quantity,
        originalQty: quantity + Math.round(seededValue(i * 11, 50, 300)),
        unit: pd.unit,
        price,
        quality,
        harvestDate: daysAgo(harvestDaysAgo),
        location: loc.name,
        lat: loc.lat + seededValue(i * 17, -0.03, 0.03),
        lng: loc.lng + seededValue(i * 19, -0.03, 0.03),
        organic: i % 5 === 0,
        description: `Fresh ${quality} ${pd.name} from ${loc.name}. ${i % 5 === 0 ? "Organically grown without pesticides. " : ""}Harvested ${harvestDaysAgo} days ago.`,
        status: i < 40 ? "ACTIVE" : i < 43 ? "PAUSED" : "SOLD_OUT",
      },
    });
    listings.push(listing);
  }
  console.log(`    Created ${listings.length} product listings`);

  // ========================================
  // 7. Create Historical Orders (120+ orders over 60 days)
  // ========================================
  console.log("  Creating historical orders...");

  const allBuyerIds = [
    consumerUser.id,
    buyerUser.id,
    ...extraConsumers,
    ...extraBuyers,
  ];
  const allOrders: any[] = [];

  for (let i = 0; i < 120; i++) {
    const daysBack = Math.round(seededValue(i * 7, 0, 60));
    const buyerIdx = Math.floor(
      seededValue(i * 11, 0, allBuyerIds.length - 0.01),
    );
    const buyerId = allBuyerIds[buyerIdx];
    const statusIdx = Math.min(Math.floor(seededValue(i * 13, 0, 4.99)), 4);
    const status = ORDER_STATUSES[statusIdx];

    // Each order has 1-3 items
    const numItems = Math.floor(seededValue(i * 3, 1, 3.99));
    let total = 0;
    const items: { listingId: string; quantity: number; price: number }[] = [];

    for (let j = 0; j < numItems; j++) {
      const listingIdx = Math.floor(
        seededValue(i * 17 + j * 31, 0, Math.min(listings.length, 40) - 0.01),
      );
      const listing = listings[listingIdx];
      if (items.find((it) => it.listingId === listing.id)) continue;
      const qty = Math.round(seededValue(i * 23 + j * 7, 5, 100));
      items.push({
        listingId: listing.id,
        quantity: qty,
        price: listing.price,
      });
      total += qty * listing.price;
    }

    if (items.length === 0) continue;

    const orderDate = daysAgo(daysBack);
    const cityIdx = Math.floor(seededValue(i * 29, 0, CITIES.length - 0.01));
    const city = CITIES[cityIdx];

    const order = await prisma.order.create({
      data: {
        buyerId,
        total: Math.round(total * 100) / 100,
        status,
        shippingAddress: `${Math.round(seededValue(i, 1, 500))} Main Road`,
        shippingCity: city.name,
        shippingState: city.state,
        shippingPin: `${450000 + Math.round(seededValue(i * 41, 0, 50000))}`,
        paymentMethod: "DEMO",
        paymentStatus: "COMPLETED",
        createdAt: orderDate,
        updatedAt: orderDate,
        items: { create: items },
      },
    });
    allOrders.push(order);
  }
  console.log(`    Created ${allOrders.length} orders`);

  // ========================================
  // 8. Create Deliveries (for orders with CONFIRMED+ status)
  // ========================================
  console.log("  Creating deliveries...");

  let deliveryCount = 0;
  for (let i = 0; i < allOrders.length; i++) {
    const order = allOrders[i];
    if (["PENDING"].includes(order.status)) continue;

    const originIdx = Math.floor(seededValue(i * 37, 0, CITIES.length - 0.01));
    const destIdx = Math.floor(seededValue(i * 43, 0, CITIES.length - 0.01));
    const origin = CITIES[originIdx];
    const dest =
      CITIES[destIdx === originIdx ? (destIdx + 1) % CITIES.length : destIdx];

    const deliveryStatusMap: Record<string, string> = {
      CONFIRMED: "ASSIGNED",
      PROCESSING: "PICKED_UP",
      SHIPPED: "IN_TRANSIT",
      DELIVERED: "DELIVERED",
    };
    const deliveryStatus = deliveryStatusMap[order.status] || "PENDING";
    const driverIdx = Math.floor(seededValue(i * 47, 0, DRIVERS.length - 0.01));

    // Calculate rough distance using simple formula
    const dlat = dest.lat - origin.lat;
    const dlng = dest.lng - origin.lng;
    const dist = Math.sqrt(dlat * dlat + dlng * dlng) * 111; // rough km conversion

    try {
      await prisma.delivery.create({
        data: {
          orderId: order.id,
          origin: origin.name,
          originLat: origin.lat,
          originLng: origin.lng,
          destination: dest.name,
          destLat: dest.lat,
          destLng: dest.lng,
          driver: deliveryStatus !== "PENDING" ? DRIVERS[driverIdx] : null,
          vehicle: deliveryStatus !== "PENDING" ? VEHICLES[driverIdx] : null,
          vehicleType: "Truck",
          status: deliveryStatus,
          distance: Math.round(dist * 10) / 10,
          duration: Math.round((dist / 40) * 60),
          eta:
            deliveryStatus !== "DELIVERED"
              ? daysAgo(-Math.round(seededValue(i, 1, 5)))
              : null,
          completedAt: deliveryStatus === "DELIVERED" ? order.createdAt : null,
        },
      });
      deliveryCount++;
    } catch (e) {
      // Skip duplicate orderId (unique constraint)
    }
  }
  console.log(`    Created ${deliveryCount} deliveries`);

  // ========================================
  // 9. Create Demand Forecasts (60+ records)
  // ========================================
  console.log("  Creating demand forecast history...");

  let forecastCount = 0;
  for (let pi = 0; pi < products.length; pi++) {
    const product = products[pi];
    const pd = PRODUCTS_DATA[pi];
    for (let dayOffset = 0; dayOffset < 60; dayOffset += 7) {
      for (const loc of [CITIES[0], CITIES[2]]) {
        // Indore and Bhopal
        const forecastDate = daysAgo(dayOffset);
        const month = forecastDate.getMonth();
        const isPeak = pd.seasonalPeak.includes(month);
        const baseDemand = pd.basePrice * 20 + (isPeak ? 500 : 0);
        const variation = Math.sin(dayOffset * 0.2 + pi) * baseDemand * 0.15;
        const predicted = Math.round(baseDemand + variation);
        const actual =
          dayOffset > 7
            ? Math.round(predicted * seededValue(dayOffset * pi, 0.85, 1.15))
            : null;

        await prisma.demandForecast.create({
          data: {
            productId: product.id,
            location: loc.name,
            forecastDate,
            period: 7,
            predictedDemand: predicted,
            actualDemand: actual,
            confidence: Math.round(seededValue(dayOffset + pi * 10, 65, 92)),
            factors: JSON.stringify({
              seasonal: isPeak ? "peak" : "off-peak",
              trend: variation > 0 ? "increasing" : "decreasing",
              supplyLevel:
                seededValue(dayOffset + pi, 0, 1) > 0.5 ? "adequate" : "low",
            }),
          },
        });
        forecastCount++;
      }
    }
  }
  console.log(`    Created ${forecastCount} demand forecast records`);

  // ========================================
  // 10. Create Notifications for demo users
  // ========================================
  console.log("  Creating notifications...");

  const notifications = [
    {
      userId: farmerUser.id,
      title: "New Order Received",
      message:
        "Your tomato listing received a new order for 50 kg from Priya Verma.",
      type: "ORDER",
    },
    {
      userId: farmerUser.id,
      title: "Price Alert",
      message:
        "AI recommends reviewing your tomato listing price. Current market trend shows a 12% increase.",
      type: "PRICE",
    },
    {
      userId: farmerUser.id,
      title: "Demand Rising",
      message:
        "Demand for onions is expected to rise 18% over the next 7 days in Indore region.",
      type: "DEMAND",
    },
    {
      userId: farmerUser.id,
      title: "Delivery Completed",
      message: "Order #ORD-1234 has been successfully delivered to the buyer.",
      type: "DELIVERY",
    },
    {
      userId: consumerUser.id,
      title: "Order Confirmed",
      message:
        "Your order for Grade A Tomato has been confirmed by the farmer.",
      type: "ORDER",
    },
    {
      userId: consumerUser.id,
      title: "Out for Delivery",
      message: "Your order is now in transit and will arrive by tomorrow.",
      type: "DELIVERY",
    },
    {
      userId: consumerUser.id,
      title: "Price Drop Alert",
      message:
        "Fresh cauliflower is now available at ₹28/kg, 15% below last week.",
      type: "PRICE",
    },
    {
      userId: buyerUser.id,
      title: "Bulk Order Ready",
      message: "Your bulk procurement of 500 kg wheat is ready for dispatch.",
      type: "ORDER",
    },
    {
      userId: buyerUser.id,
      title: "New Supply Available",
      message:
        "Fresh Grade A tomatoes available in bulk from Narmada Valley FPO.",
      type: "SYSTEM",
    },
    {
      userId: logisticsUser.id,
      title: "New Delivery Assignment",
      message: "New delivery route assigned: Indore to Bhopal with 3 stops.",
      type: "DELIVERY",
    },
    {
      userId: logisticsUser.id,
      title: "Route Optimized",
      message:
        "Your delivery route has been optimized, saving 28% in travel distance.",
      type: "SYSTEM",
    },
    {
      userId: adminUser.id,
      title: "New Farmer Registration",
      message:
        "New farmer Vikram Singh from Ujjain has registered and is awaiting verification.",
      type: "SYSTEM",
    },
    {
      userId: adminUser.id,
      title: "Platform Milestone",
      message:
        "Agriflow has reached 100+ transactions this month with ₹2.5L+ GMV.",
      type: "SYSTEM",
    },
  ];

  for (let i = 0; i < notifications.length; i++) {
    const n = notifications[i];
    await prisma.notification.create({
      data: {
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        read: i % 3 === 0,
        createdAt: daysAgo(Math.round(seededValue(i * 7, 0, 10))),
      },
    });
  }

  // ========================================
  // Summary
  // ========================================
  const userCount = await prisma.user.count();
  const listingCount = await prisma.productListing.count();
  const orderCount = await prisma.order.count();
  const delivCount = await prisma.delivery.count();
  const mpCount = await prisma.marketPrice.count();
  const dfCount = await prisma.demandForecast.count();

  console.log("\n✅ Seed completed successfully!");
  console.log(`   Users: ${userCount}`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Listings: ${listingCount}`);
  console.log(`   Orders: ${orderCount}`);
  console.log(`   Deliveries: ${delivCount}`);
  console.log(`   Market Prices: ${mpCount}`);
  console.log(`   Demand Forecasts: ${dfCount}`);
  console.log("\n📋 Demo Credentials (all passwords: Demo@123):");
  console.log("   farmer@Agriflow.demo  | consumer@Agriflow.demo");
  console.log("   fpo@Agriflow.demo     | buyer@Agriflow.demo");
  console.log("   logistics@Agriflow.demo | admin@Agriflow.demo");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
