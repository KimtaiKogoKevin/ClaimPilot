import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ObjectUploader } from "@/components/ObjectUploader";
import AIAnalysisDisplay from "@/components/ai-analysis-display";
import { Camera, Brain } from "lucide-react";
import type { UploadResult } from "@uppy/core";

interface DamageAssessmentStepProps {
  formData: any;
  setFormData: (data: any) => void;
  claimId: string | null;
}

export default function DamageAssessmentStep({ 
  formData, 
  setFormData, 
  claimId 
}: DamageAssessmentStepProps) {
  const { toast } = useToast();
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  const requiredAngles = [
    { id: 'FRONT_VIEW', label: 'Front View', required: true },
    { id: 'REAR_VIEW', label: 'Rear View', required: true },
    { id: 'LEFT_SIDE', label: 'Left Side', required: true },
    { id: 'RIGHT_SIDE', label: 'Right Side', required: true },
  ];

  // Photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ photoUrl, angle, isGoodsPhoto }: { photoUrl: string; angle: string; isGoodsPhoto: boolean }) => {
      if (!claimId) throw new Error("No claim ID");
      const response = await apiRequest("POST", `/api/claims/${claimId}/photos`, {
        photoUrl,
        angle,
        isGoodsPhoto,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setUploadedPhotos(prev => [...prev, data.photo]);
      if (data.photo.aiAnalysisResults) {
        setAiAnalysis(data.photo.aiAnalysisResults);
      }
      toast({
        title: "Photo Uploaded",
        description: "Photo uploaded successfully and AI analysis is in progress.",
      });
    },
    onError: (error) => {
      console.error("Error uploading photo:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDamageChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      damage: {
        ...prev.damage,
        [field]: value,
      },
    }));
  };

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload", {});
      const { uploadURL } = await response.json();
      return {
        method: "PUT" as const,
        url: uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload parameters:", error);
      throw error;
    }
  };

  const handlePhotoUploadComplete = (angle: string, isGoodsPhoto: boolean = false) => 
    (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
      if (result.successful && result.successful[0]) {
        const uploadURL = result.successful[0].uploadURL as string;
        uploadPhotoMutation.mutate({
          photoUrl: uploadURL,
          angle,
          isGoodsPhoto,
        });
      }
    };

  return (
    <Card className="shadow-sm border-neutral-200">
      <CardHeader>
        <CardTitle className="text-2xl text-neutral-800">Section C: Damage Assessment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Vehicle Damage Section */}
        <div>
          <h4 className="text-lg font-semibold text-neutral-800 mb-4">Vehicle Damage Documentation</h4>
          
          {/* Instructions for vehicle damage */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex items-center mb-2">
              <div className="text-blue-600 mr-2">🚗</div>
              <h5 className="text-blue-800 font-semibold">Vehicle Damage Assessment Guide</h5>
            </div>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• First, describe the damage in the text area below</li>
              <li>• Then take photos from all 4 required angles</li>
              <li>• Focus on areas with visible damage (dents, scratches, broken parts)</li>
              <li>• Ensure good lighting and clear visibility of damage</li>
            </ul>
          </div>
          
          <div className="mb-4">
            <Label htmlFor="vehicleDamageDescription" className="text-sm font-medium text-neutral-700 mb-2 block">
              Brief Description of Vehicle Damage
            </Label>
            <Textarea
              id="vehicleDamageDescription"
              rows={3}
              value={formData.damage.vehicleDescription}
              onChange={(e) => handleDamageChange('vehicleDescription', e.target.value)}
              placeholder="Describe the visible damage to your vehicle (location, severity, type of damage)..."
              className="w-full"
            />
          </div>

          {/* Guided Image Upload */}
          <div className="bg-gradient-to-r from-ai-purple to-purple-600 rounded-xl p-6 mb-6">
            <div className="flex items-center mb-4">
              <Brain className="text-white h-6 w-6 mr-3" />
              <h5 className="text-white font-semibold text-lg">AI-Powered Damage Analysis</h5>
            </div>
            
            <div className="bg-white bg-opacity-15 rounded-lg p-4 mb-4">
              <h6 className="text-white font-bold text-sm mb-2">Photo Upload Instructions</h6>
              <ul className="text-white text-sm space-y-1">
                <li>• Click each box below to upload a photo from that angle</li>
                <li>• Take clear, well-lit photos showing the damage clearly</li>
                <li>• Our AI will automatically analyze each photo for damage</li>
                <li>• All 4 angles are required for complete assessment</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {requiredAngles.map((angle) => (
                <div key={angle.id} className="text-center">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760} // 10MB
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handlePhotoUploadComplete(angle.id)}
                    buttonClassName="w-full"
                  >
                    <div className="border-2 border-dashed border-white rounded-lg p-4 text-center hover:border-white hover:bg-white hover:bg-opacity-20 transition-all cursor-pointer bg-white bg-opacity-10">
                      <Camera className="text-white h-8 w-8 mx-auto mb-2" />
                      <div className="text-white text-sm font-bold mb-1">{angle.label}</div>
                      <div className="text-white text-xs font-semibold bg-black bg-opacity-40 px-2 py-1 rounded-full">
                        {angle.required ? 'REQUIRED' : 'OPTIONAL'}
                      </div>
                      <div className="text-white text-xs mt-1 opacity-90">Click to upload</div>
                    </div>
                  </ObjectUploader>
                </div>
              ))}
            </div>
          </div>

          {/* AI Analysis Results */}
          {aiAnalysis && (
            <AIAnalysisDisplay analysis={aiAnalysis} />
          )}
        </div>

        {/* Goods Damage Section */}
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="goods-damaged"
              checked={formData.damage.goodsDamaged}
              onCheckedChange={(checked) => handleDamageChange('goodsDamaged', checked)}
            />
            <Label htmlFor="goods-damaged" className="text-base font-medium text-neutral-800">
              Were goods/cargo also damaged in this accident?
            </Label>
          </div>
          
          {formData.damage.goodsDamaged && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="goodsDescription" className="text-sm font-medium text-neutral-700 mb-2 block">
                  Description of Damaged Goods/Cargo
                </Label>
                <Textarea
                  id="goodsDescription"
                  rows={3}
                  value={formData.damage.goodsDescription}
                  onChange={(e) => handleDamageChange('goodsDescription', e.target.value)}
                  placeholder="Describe the goods that were damaged (type, quantity, estimated value)..."
                  className="w-full"
                />
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Camera className="text-white h-5 w-5 mr-2" />
                  <h6 className="font-semibold text-white text-base">Goods Damage Photos</h6>
                </div>
                
                <div className="bg-white bg-opacity-15 rounded-lg p-3 mb-4">
                  <h6 className="text-white font-bold text-sm mb-2">Goods Photo Guidelines</h6>
                  <ul className="text-white text-sm space-y-1">
                    <li>• Take photos of damaged goods from multiple angles</li>
                    <li>• Include close-up shots of specific damage</li>
                    <li>• Show any spilled or scattered cargo</li>
                    <li>• Upload up to 5 photos for complete documentation</li>
                  </ul>
                </div>
                
                <ObjectUploader
                  maxNumberOfFiles={5}
                  maxFileSize={10485760} // 10MB
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handlePhotoUploadComplete('GOODS_DAMAGE', true)}
                  buttonClassName="w-full"
                >
                  <div className="border-2 border-dashed border-white hover:border-solid rounded-lg p-4 text-center hover:bg-white hover:bg-opacity-20 transition-all cursor-pointer bg-white bg-opacity-10">
                    <Camera className="text-white h-6 w-6 mx-auto mb-2" />
                    <div className="text-white font-bold text-sm mb-1">Upload Goods Photos</div>
                    <div className="text-white text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                      Up to 5 photos • Click to browse
                    </div>
                  </div>
                </ObjectUploader>
              </div>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploadPhotoMutation.isPending && (
          <div className="flex items-center space-x-2 text-sm text-neutral-800 font-medium">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Uploading photo and analyzing with AI...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
