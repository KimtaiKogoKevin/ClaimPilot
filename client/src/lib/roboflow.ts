/**
 * Roboflow Computer Vision API Integration
 * 
 * This module handles integration with Roboflow Universe models for
 * vehicle damage detection and assessment in insurance claims.
 */

export interface DamageDetection {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoboflowAnalysisResult {
  predictions: DamageDetection[];
  image: {
    width: number;
    height: number;
  };
  inference_time: number;
}

export interface ProcessedDamageAnalysis {
  totalDamages: number;
  damageTypes: string[];
  avgConfidence: number;
  severityLevel: 'minor' | 'moderate' | 'major' | 'total_loss';
  estimatedCost: number;
  recommendations: string[];
  detailedFindings: {
    damageType: string;
    confidence: number;
    location: { x: number; y: number; width: number; height: number };
    severity: string;
    description: string;
  }[];
}

class RoboflowService {
  private apiKey: string;
  private modelEndpoint: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_ROBOFLOW_API_KEY || '';
    this.modelEndpoint = import.meta.env.VITE_ROBOFLOW_MODEL_ENDPOINT || 'vehicle-damage-detection/1';
  }

  /**
   * Analyze vehicle damage from uploaded image
   */
  async analyzeDamage(imageFile: File): Promise<RoboflowAnalysisResult> {
    if (!this.apiKey) {
      throw new Error('Roboflow API key not configured');
    }

    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await fetch(
      `https://detect.roboflow.com/${this.modelEndpoint}?api_key=${this.apiKey}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Roboflow API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Process raw Roboflow results into structured damage analysis
   */
  processDamageResults(roboflowResult: RoboflowAnalysisResult): ProcessedDamageAnalysis {
    const predictions = roboflowResult.predictions || [];
    
    if (predictions.length === 0) {
      return {
        totalDamages: 0,
        damageTypes: [],
        avgConfidence: 0,
        severityLevel: 'minor',
        estimatedCost: 0,
        recommendations: ['No damage detected. Vehicle appears to be in good condition.'],
        detailedFindings: []
      };
    }

    const damageTypes = Array.from(new Set(predictions.map(p => p.class)));
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
    
    // Calculate severity based on damage count and types
    const severityLevel = this.calculateSeverityLevel(predictions, damageTypes);
    const estimatedCost = this.estimateCost(predictions, damageTypes, severityLevel);
    
    const detailedFindings = predictions.map(prediction => ({
      damageType: prediction.class,
      confidence: prediction.confidence,
      location: {
        x: prediction.x,
        y: prediction.y,
        width: prediction.width,
        height: prediction.height
      },
      severity: this.getDamageSeverity(prediction),
      description: this.generateDamageDescription(prediction)
    }));

    const recommendations = this.generateRecommendations(severityLevel, damageTypes, estimatedCost);

    return {
      totalDamages: predictions.length,
      damageTypes,
      avgConfidence,
      severityLevel,
      estimatedCost,
      recommendations,
      detailedFindings
    };
  }

  private calculateSeverityLevel(
    predictions: DamageDetection[], 
    damageTypes: string[]
  ): 'minor' | 'moderate' | 'major' | 'total_loss' {
    const severeDamageTypes = ['structural_damage', 'broken', 'major_dent'];
    const moderateDamageTypes = ['dent', 'crack'];
    
    const hasSevereDamage = damageTypes.some(type => severeDamageTypes.includes(type));
    const hasModerateDamage = damageTypes.some(type => moderateDamageTypes.includes(type));
    
    if (predictions.length > 10 || hasSevereDamage) {
      return 'major';
    } else if (predictions.length > 5 || hasModerateDamage) {
      return 'moderate';
    } else {
      return 'minor';
    }
  }

  private estimateCost(
    predictions: DamageDetection[], 
    damageTypes: string[], 
    severity: string
  ): number {
    const baseCosts = {
      scratch: 200,
      dent: 500,
      crack: 300,
      broken: 800,
      structural_damage: 2000,
      paint_damage: 400,
      glass_damage: 600
    };

    let totalCost = 0;
    predictions.forEach(prediction => {
      const baseCost = baseCosts[prediction.class as keyof typeof baseCosts] || 300;
      totalCost += baseCost * prediction.confidence;
    });

    // Apply severity multiplier
    const severityMultipliers = {
      minor: 1,
      moderate: 1.3,
      major: 1.8,
      total_loss: 3
    };

    return Math.round(totalCost * severityMultipliers[severity as keyof typeof severityMultipliers]);
  }

  private getDamageSeverity(prediction: DamageDetection): string {
    if (prediction.confidence > 0.8) return 'High confidence';
    if (prediction.confidence > 0.6) return 'Medium confidence';
    return 'Low confidence';
  }

  private generateDamageDescription(prediction: DamageDetection): string {
    const descriptions = {
      scratch: 'Surface level scratch damage detected',
      dent: 'Visible dent requiring body work',
      crack: 'Crack damage that may affect structural integrity',
      broken: 'Broken component requiring replacement',
      structural_damage: 'Significant structural damage detected',
      paint_damage: 'Paint damage requiring refinishing',
      glass_damage: 'Glass damage requiring repair or replacement'
    };

    return descriptions[prediction.class as keyof typeof descriptions] || 
           `${prediction.class} damage detected with ${Math.round(prediction.confidence * 100)}% confidence`;
  }

  private generateRecommendations(
    severity: string, 
    damageTypes: string[], 
    estimatedCost: number
  ): string[] {
    const recommendations = [];

    if (severity === 'major') {
      recommendations.push('Schedule immediate professional inspection');
      recommendations.push('Contact insurance company immediately');
      recommendations.push('Do not drive vehicle until safety is confirmed');
    } else if (severity === 'moderate') {
      recommendations.push('Schedule professional assessment within 48 hours');
      recommendations.push('Get multiple repair estimates');
      recommendations.push('Document all damage with additional photos');
    } else {
      recommendations.push('Consider professional evaluation for peace of mind');
      recommendations.push('Monitor damage for any changes');
    }

    if (estimatedCost > 5000) {
      recommendations.push('Consider total loss evaluation');
    }

    if (damageTypes.includes('structural_damage')) {
      recommendations.push('Safety inspection required before driving');
    }

    return recommendations;
  }
}

export const roboflowService = new RoboflowService();