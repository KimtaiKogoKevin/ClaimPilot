import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Brain } from "lucide-react";
import { calculateDamageSeverity, getDamageTypeColor, getSeverityColor } from "@/lib/roboflow";
import type { RoboflowAnalysisResult } from "@/lib/roboflow";

interface AIAnalysisDisplayProps {
  analysis: RoboflowAnalysisResult;
}

export default function AIAnalysisDisplay({ analysis }: AIAnalysisDisplayProps) {
  if (!analysis || !analysis.predictions || analysis.predictions.length === 0) {
    return (
      <Card className="bg-neutral-50 border-neutral-200">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
              <AlertTriangle className="text-yellow-600 h-4 w-4" />
            </div>
            <h5 className="font-semibold text-neutral-800">AI Analysis Pending</h5>
          </div>
          <p className="text-neutral-600">
            No damage detected or analysis is still in progress. Please ensure photos clearly show any damage.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { severity, estimatedCostRange, highConfidenceDamages } = calculateDamageSeverity(analysis.predictions);

  return (
    <Card className="bg-neutral-50 border-neutral-200">
      <CardHeader>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center mr-3">
            <CheckCircle className="text-white h-4 w-4" />
          </div>
          <CardTitle className="text-lg font-semibold text-neutral-800">AI Analysis Complete</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Detected Damage */}
          <div>
            <h6 className="font-medium text-neutral-700 mb-3">Detected Damage</h6>
            <div className="space-y-2">
              {analysis.predictions.map((prediction, index) => (
                <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-4 w-4 text-ai-purple" />
                    <span className="text-sm font-medium">{prediction.class}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      prediction.confidence > 0.8
                        ? 'bg-green-100 text-green-800'
                        : prediction.confidence > 0.6
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {Math.round(prediction.confidence * 100)}% confidence
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Severity Assessment */}
          <div>
            <h6 className="font-medium text-neutral-700 mb-3">Damage Assessment</h6>
            <div className="space-y-3">
              <div className={`px-4 py-3 rounded-lg ${getSeverityColor(severity)}`}>
                <div className="font-medium capitalize">{severity} Damage</div>
                <div className="text-sm">Estimated repair cost: {estimatedCostRange}</div>
              </div>
              
              {highConfidenceDamages.length > 0 && (
                <div className="bg-white rounded-lg p-3">
                  <div className="text-sm font-medium text-neutral-700 mb-2">
                    High Confidence Detections ({highConfidenceDamages.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {highConfidenceDamages.map((damage, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className={`text-xs ${getDamageTypeColor(damage.class)}`}
                      >
                        {damage.class}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analysis Details */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>Analysis completed in {analysis.time ? `${analysis.time}ms` : 'processing'}</span>
            <span>{analysis.predictions.length} damage(s) detected</span>
          </div>
          {analysis.image && (
            <div className="text-xs text-neutral-500 mt-2">
              Image dimensions: {analysis.image.width} × {analysis.image.height}px
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h6 className="font-medium text-blue-800 mb-2">AI Recommendations</h6>
          <div className="text-sm text-blue-700">
            {severity === 'severe' && (
              <p>Significant damage detected. Professional inspection recommended before driving.</p>
            )}
            {severity === 'moderate' && (
              <p>Moderate damage found. Schedule repair assessment within 1-2 weeks.</p>
            )}
            {severity === 'minor' && (
              <p>Minor damage identified. Safe to drive, but consider cosmetic repairs.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
