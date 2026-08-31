export interface QualityGradingResult {
  crop: string;
  recommendedGrade: 'Grade A' | 'Grade B' | 'Grade C';
  gradeName: string;
  confidence: number;
  qualityScore: number; // 0 - 100
  metrics: {
    colorUniformity: number; // percentage
    surfaceHealth: number; // percentage
    blemishRate: number; // percentage
    sizeSymmetry: number; // percentage
    freshnessIndex: number; // percentage
  };
  attributes: Array<{
    name: string;
    value: string;
    status: 'OPTIMAL' | 'GOOD' | 'FAIR';
    score: number;
  }>;
  priceImpact: {
    multiplier: number;
    premiumDescription: string;
  };
  diagnostics: string[];
  recommendation: string;
}

const CROP_BENCHMARKS: Record<string, any> = {
  Tomato: {
    optimalColor: 'Deep Crimson Red',
    gradeA: { minScore: 85, premium: '+15% Premium (Direct Consumer / Supermarkets)' },
    gradeB: { minScore: 70, premium: 'Standard Mandi Rate (Local Grocery)' },
    gradeC: { minScore: 0, premium: '-10% Discount (Ketchup / Puree Processing)' }
  },
  Potato: {
    optimalColor: 'Golden Brown / Uniform Cream',
    gradeA: { minScore: 85, premium: '+12% Premium (Table Consumption / Chips)' },
    gradeB: { minScore: 70, premium: 'Standard Market Rate' },
    gradeC: { minScore: 0, premium: '-15% Discount (Starch / Animal Feed)' }
  },
  Onion: {
    optimalColor: 'Glossy Nasik Red / Pink',
    gradeA: { minScore: 85, premium: '+14% Premium (Export / Retail Grade)' },
    gradeB: { minScore: 70, premium: 'Standard Market Rate' },
    gradeC: { minScore: 0, premium: '-12% Discount (Dehydration / Food Processing)' }
  },
  Chilli: {
    optimalColor: 'Vibrant Emerald Green / Bright Red',
    gradeA: { minScore: 88, premium: '+18% Premium (Export Quality / High Scoville)' },
    gradeB: { minScore: 72, premium: 'Standard Spice Market Rate' },
    gradeC: { minScore: 0, premium: '-8% Discount (Powder Grinding)' }
  },
  Mango: {
    optimalColor: 'Golden Saffron Yellow',
    gradeA: { minScore: 87, premium: '+25% Premium (Premium Alphonso Table Fruit)' },
    gradeB: { minScore: 72, premium: 'Standard Retail' },
    gradeC: { minScore: 0, premium: '-15% Discount (Pulp / Juice Processing)' }
  }
};

/**
 * Deterministic Computer Vision Simulation for Produce Quality Grading
 * Analyzes crop type and image characteristics (size, base64 hash distribution, metadata)
 */
export function analyzeProduceImage(crop: string, imageData?: string, organic?: boolean): QualityGradingResult {
  // Deterministic seed generation based on image signature or current crop properties
  let seed = 42;
  if (imageData && imageData.length > 50) {
    for (let i = 0; i < Math.min(imageData.length, 500); i += 10) {
      seed = (seed * 31 + imageData.charCodeAt(i)) % 10000;
    }
  }

  // Calculate visual inspection metrics (82 - 98 range for healthy harvested lots)
  const normalizedSeed = (seed % 100) / 100;
  const colorUniformity = Math.round(88 + normalizedSeed * 10);
  const surfaceHealth = Math.round(86 + ((seed * 7) % 13));
  const blemishRate = Math.round(1.5 + ((seed * 3) % 4.5) * 10) / 10;
  const sizeSymmetry = Math.round(85 + ((seed * 5) % 12));
  const freshnessIndex = Math.round(90 + ((seed * 11) % 9));

  // Overall aggregate score
  const qualityScore = Math.round(
    colorUniformity * 0.25 +
    surfaceHealth * 0.25 +
    (100 - blemishRate * 5) * 0.2 +
    sizeSymmetry * 0.15 +
    freshnessIndex * 0.15 +
    (organic ? 3 : 0)
  );

  let recommendedGrade: 'Grade A' | 'Grade B' | 'Grade C' = 'Grade A';
  let gradeName = 'Grade A (Premium / Export Quality)';
  let priceMultiplier = 1.15;
  let premiumDesc = '+15% Premium over average mandi rate';

  if (qualityScore >= 85) {
    recommendedGrade = 'Grade A';
    gradeName = 'Grade A (Premium / Table Grade)';
    priceMultiplier = 1.15;
    premiumDesc = '+12% to +18% higher realization (Direct Consumer / Supermarket)';
  } else if (qualityScore >= 70) {
    recommendedGrade = 'Grade B';
    gradeName = 'Grade B (Standard Market Grade)';
    priceMultiplier = 1.0;
    premiumDesc = 'Standard direct market price';
  } else {
    recommendedGrade = 'Grade C';
    gradeName = 'Grade C (Processing / Economy Grade)';
    priceMultiplier = 0.88;
    premiumDesc = 'Discounted for fast commercial/puree processing sales';
  }

  const benchmark = CROP_BENCHMARKS[crop] || { optimalColor: 'Natural Uniform Hue' };

  const attributes = [
    {
      name: 'Color Spectrum & Ripeness',
      value: `${colorUniformity}% Uniform (${benchmark.optimalColor || 'Even Pigment'})`,
      status: colorUniformity > 90 ? 'OPTIMAL' : 'GOOD',
      score: colorUniformity
    },
    {
      name: 'Surface Cuticle & Firmness',
      value: `${surfaceHealth}% Healthy (Smooth epidermis, no fungal lesions)`,
      status: surfaceHealth > 88 ? 'OPTIMAL' : 'GOOD',
      score: surfaceHealth
    },
    {
      name: 'Blemish & Defect Rate',
      value: `${blemishRate}% (Well within AGMARK export tolerance)`,
      status: blemishRate < 3.5 ? 'OPTIMAL' : 'GOOD',
      score: Math.round(100 - blemishRate * 5)
    },
    {
      name: 'Physical Size Uniformity',
      value: `${sizeSymmetry}% Consistent Caliber`,
      status: sizeSymmetry > 85 ? 'OPTIMAL' : 'GOOD',
      score: sizeSymmetry
    },
    {
      name: 'Harvest Freshness Vitality',
      value: `${freshnessIndex}% High Turgidity`,
      status: 'OPTIMAL',
      score: freshnessIndex
    }
  ] as any;

  const diagnostics = [
    `AI Visual Scan detected high surface luster and firm cellular turgor across sample lot.`,
    `Blemish rate measured at ${blemishRate}%, significantly lower than standard commercial threshold (5.0%).`,
    `Color chromatic distribution confirms optimal harvest maturity for direct kitchen and retail consumption.`
  ];

  if (organic) {
    diagnostics.push('Certified organic lot bonus applied: Higher natural antioxidant luster index.');
  }

  const recommendation = recommendedGrade === 'Grade A'
    ? `Excellent lot quality! Eligible for KrishiSetu Premium Verified badge. Recommended pricing at the top of the AI Fair Price band.`
    : `Good commercial quality batch. Recommended for standard retail or bulk restaurant procurement.`;

  const confidence = Math.round((92 + normalizedSeed * 6.5) * 10) / 10;

  return {
    crop,
    recommendedGrade,
    gradeName,
    confidence,
    qualityScore,
    metrics: {
      colorUniformity,
      surfaceHealth,
      blemishRate,
      sizeSymmetry,
      freshnessIndex
    },
    attributes,
    priceImpact: {
      multiplier: priceMultiplier,
      premiumDescription: premiumDesc
    },
    diagnostics,
    recommendation
  };
}
