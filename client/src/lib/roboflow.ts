export interface RoboflowPrediction {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoboflowAnalysisResult {
  predictions: RoboflowPrediction[];
  image: {
    width: number;
    height: number;
  };
  time: number;
}

export function calculateDamageSeverity(predictions: RoboflowPrediction[]): {
  severity: 'minor' | 'moderate' | 'severe';
  estimatedCostRange: string;
  highConfidenceDamages: RoboflowPrediction[];
} {
  const highConfidenceDamages = predictions.filter(p => p.confidence > 0.7);
  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
  
  let severity: 'minor' | 'moderate' | 'severe' = 'minor';
  let estimatedCostRange = '$500 - $1,200';

  if (highConfidenceDamages.length >= 3 || avgConfidence > 0.85) {
    severity = 'severe';
    estimatedCostRange = '$4,000 - $8,500';
  } else if (highConfidenceDamages.length >= 2 || avgConfidence > 0.7) {
    severity = 'moderate';
    estimatedCostRange = '$1,500 - $4,000';
  }

  return {
    severity,
    estimatedCostRange,
    highConfidenceDamages,
  };
}

export function getDamageTypeColor(damageType: string): string {
  const colorMap: Record<string, string> = {
    'dent': 'text-orange-600 bg-orange-100',
    'scratch': 'text-yellow-600 bg-yellow-100',
    'crack': 'text-red-600 bg-red-100',
    'broken': 'text-red-700 bg-red-200',
    'missing': 'text-purple-600 bg-purple-100',
  };
  
  return colorMap[damageType.toLowerCase()] || 'text-gray-600 bg-gray-100';
}

export function getSeverityColor(severity: string): string {
  const colorMap: Record<string, string> = {
    'minor': 'text-green-700 bg-green-100',
    'moderate': 'text-orange-700 bg-orange-100',
    'severe': 'text-red-700 bg-red-100',
  };
  
  return colorMap[severity.toLowerCase()] || 'text-gray-600 bg-gray-100';
}
