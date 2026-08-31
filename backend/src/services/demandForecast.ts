import { prisma } from '../lib/prisma.js';

const SEASONAL_DEMAND_INDICES: Record<string, number[]> = {
  'Tomato':      [0.9, 0.85, 0.8, 0.85, 0.9, 1.1, 1.2, 1.25, 1.15, 1.0, 0.9, 0.85],
  'Potato':      [1.1, 1.05, 1.0, 0.9, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.1],
  'Onion':       [1.15, 1.2, 1.1, 0.9, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2],
  'Wheat':       [1.0, 1.0, 1.1, 1.15, 1.1, 0.9, 0.8, 0.8, 0.85, 0.95, 1.0, 1.0],
  'Soybean':     [0.85, 0.85, 0.9, 0.9, 0.95, 1.0, 1.05, 1.1, 1.2, 1.25, 1.15, 0.95],
  'Rice':        [1.0, 0.95, 0.95, 0.9, 0.85, 0.85, 0.9, 1.0, 1.15, 1.2, 1.15, 1.05],
  'Chilli':      [1.15, 1.1, 1.0, 0.9, 0.85, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.2],
  'Cauliflower': [1.15, 1.1, 0.95, 0.8, 0.7, 0.7, 0.75, 0.85, 0.95, 1.1, 1.2, 1.15],
  'Cabbage':     [1.1, 1.05, 0.95, 0.85, 0.75, 0.75, 0.8, 0.85, 0.95, 1.1, 1.15, 1.1],
  'Mango':       [0.6, 0.7, 0.85, 1.1, 1.3, 1.35, 1.2, 0.85, 0.6, 0.5, 0.5, 0.55],
};

interface DemandForecastResult {
  crop: string;
  location: string;
  period: number;
  predictedDemand: number;
  confidence: number;
  availableSupply: number;
  supplyGap: number;
  trend: 'RISING' | 'FALLING' | 'STABLE';
  priceDirection: 'INCREASING' | 'DECREASING' | 'STABLE';
  historicalAvgDemand: number;
  growthRate: number;
  seasonalFactor: number;
  recommendations: string[];
}

export async function getDemandForecast(
  crop: string,
  location: string,
  period: number = 7
): Promise<DemandForecastResult> {
  const product = await prisma.product.findFirst({ where: { name: { contains: crop } } });
  if (!product) throw new Error(`Product "${crop}" not found`);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // 1. Get historical orders for this crop
  const recentOrderItems = await prisma.orderItem.findMany({
    where: {
      listing: { productId: product.id },
      order: { createdAt: { gte: thirtyDaysAgo } }
    },
    include: { order: true, listing: true }
  });

  // 2. Calculate daily demand over the last 30 days
  const dailyDemand: number[] = [];
  for (let d = 0; d < 30; d++) {
    const dayStart = new Date(now.getTime() - (d + 1) * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    const dayQty = recentOrderItems
      .filter(oi => oi.order.createdAt >= dayStart && oi.order.createdAt < dayEnd)
      .reduce((sum, oi) => sum + oi.quantity, 0);
    dailyDemand.push(dayQty);
  }

  // 3. Weighted Moving Average (recent days weighted more)
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < dailyDemand.length; i++) {
    const weight = 1 / (1 + i * 0.15); // Exponential decay
    weightedSum += dailyDemand[i] * weight;
    weightTotal += weight;
  }
  const weightedAvgDaily = weightTotal > 0 ? weightedSum / weightTotal : 0;

  // 4. Calculate growth rate (linear trend)
  const week1Demand = dailyDemand.slice(0, 7).reduce((s, v) => s + v, 0);
  const week2Demand = dailyDemand.slice(7, 14).reduce((s, v) => s + v, 0);
  const week3Demand = dailyDemand.slice(14, 21).reduce((s, v) => s + v, 0);
  const week4Demand = dailyDemand.slice(21, 28).reduce((s, v) => s + v, 0);

  let growthRate = 0;
  if (week2Demand > 0) {
    growthRate = (week1Demand - week2Demand) / week2Demand;
  } else if (week1Demand > 0) {
    growthRate = 0.1; // Default positive growth if no prior data
  }
  growthRate = Math.max(-0.5, Math.min(0.5, growthRate)); // Cap at ±50%

  // 5. Seasonal factor
  const forecastMonth = now.getMonth();
  const seasonalIndices = SEASONAL_DEMAND_INDICES[crop] || Array(12).fill(1.0);
  const seasonalFactor = seasonalIndices[forecastMonth];

  // 6. Predict demand for the forecast period
  const dailyPrediction = weightedAvgDaily * (1 + growthRate * 0.5) * seasonalFactor;
  const predictedDemand = Math.round(dailyPrediction * period);

  // 7. Get available supply
  const activeListings = await prisma.productListing.findMany({
    where: {
      productId: product.id,
      status: 'ACTIVE',
      ...(location ? { location: { contains: location } } : {})
    }
  });
  const availableSupply = Math.round(activeListings.reduce((sum, l) => sum + l.quantity, 0));

  // 8. Supply gap
  const supplyGap = predictedDemand - availableSupply;

  // 9. Determine trend
  let trend: DemandForecastResult['trend'] = 'STABLE';
  if (growthRate > 0.05) trend = 'RISING';
  else if (growthRate < -0.05) trend = 'FALLING';

  // 10. Price direction from supply-demand ratio
  let priceDirection: DemandForecastResult['priceDirection'] = 'STABLE';
  if (availableSupply > 0) {
    const ratio = predictedDemand / availableSupply;
    if (ratio > 1.2) priceDirection = 'INCREASING';
    else if (ratio < 0.8) priceDirection = 'DECREASING';
  } else if (predictedDemand > 0) {
    priceDirection = 'INCREASING';
  }

  // 11. Confidence calculation
  let confidence = 50;
  if (recentOrderItems.length > 20) confidence += 20;
  else if (recentOrderItems.length > 5) confidence += 10;
  if (dailyDemand.filter(d => d > 0).length > 15) confidence += 10;
  else if (dailyDemand.filter(d => d > 0).length > 5) confidence += 5;
  if (Math.abs(growthRate) < 0.3) confidence += 5; // More stable = more confident
  confidence = Math.min(92, confidence);

  // 12. Historical average
  const historicalAvgDemand = Math.round(dailyDemand.reduce((s, v) => s + v, 0) / Math.max(1, dailyDemand.filter(d => d > 0).length));

  // 13. Generate recommendations
  const recommendations: string[] = [];
  if (trend === 'RISING') {
    recommendations.push(`Demand for ${crop} is expected to ${growthRate > 0.15 ? 'significantly ' : ''}increase over the next ${period} days.`);
  } else if (trend === 'FALLING') {
    recommendations.push(`Demand for ${crop} shows a declining trend. Consider competitive pricing.`);
  }
  if (supplyGap > 0) {
    recommendations.push(`Current supply may not meet predicted demand. Supply gap of ${supplyGap} ${product.unit}.`);
    recommendations.push(`Consider increasing your ${crop} listing quantity to capture unmet demand.`);
  } else if (supplyGap < -availableSupply * 0.3) {
    recommendations.push(`Supply exceeds predicted demand by ${Math.abs(supplyGap)} ${product.unit}. Competitive pricing recommended.`);
  }
  if (priceDirection === 'INCREASING') {
    recommendations.push(`Price likely to increase due to ${supplyGap > 0 ? 'supply shortage' : 'rising demand'}.`);
  }
  if (seasonalFactor > 1.1) {
    recommendations.push(`${crop} is in seasonal peak demand period. Good time to list.`);
  } else if (seasonalFactor < 0.85) {
    recommendations.push(`${crop} is in off-season. Consider holding stock or diversifying.`);
  }
  if (recommendations.length === 0) {
    recommendations.push(`${crop} market conditions are stable in ${location || 'this region'}.`);
  }

  return {
    crop,
    location: location || 'All Regions',
    period,
    predictedDemand,
    confidence,
    availableSupply,
    supplyGap,
    trend,
    priceDirection,
    historicalAvgDemand,
    growthRate: Math.round(growthRate * 10000) / 100, // as percentage
    seasonalFactor,
    recommendations
  };
}
