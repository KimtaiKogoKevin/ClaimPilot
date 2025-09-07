import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { 
  Camera, 
  Video, 
  RotateCw, 
  Brain, 
  CheckCircle2, 
  AlertCircle,
  Upload,
  Image,
  Play,
  Smartphone,
  ChevronRight
} from "lucide-react";

interface EnhancedDamageAssessmentProps {
  formData: any;
  setFormData: (data: any) => void;
  claimId: string | null;
}

// Define the required angles for 360-degree coverage
const vehicleAngles = [
  { id: 'FRONT', label: 'Front View', icon: '🚗', rotation: 0 },
  { id: 'FRONT_RIGHT', label: 'Front Right', icon: '↗️', rotation: 45 },
  { id: 'RIGHT', label: 'Right Side', icon: '➡️', rotation: 90 },
  { id: 'REAR_RIGHT', label: 'Rear Right', icon: '↘️', rotation: 135 },
  { id: 'REAR', label: 'Rear View', icon: '🔙', rotation: 180 },
  { id: 'REAR_LEFT', label: 'Rear Left', icon: '↙️', rotation: 225 },
  { id: 'LEFT', label: 'Left Side', icon: '⬅️', rotation: 270 },
  { id: 'FRONT_LEFT', label: 'Front Left', icon: '↖️', rotation: 315 },
];

// Damage zones for detailed capture
const damageZones = [
  { id: 'HOOD', label: 'Hood/Bonnet' },
  { id: 'WINDSHIELD', label: 'Windshield' },
  { id: 'ROOF', label: 'Roof' },
  { id: 'TRUNK', label: 'Trunk/Boot' },
  { id: 'DOOR_FL', label: 'Front Left Door' },
  { id: 'DOOR_FR', label: 'Front Right Door' },
  { id: 'DOOR_RL', label: 'Rear Left Door' },
  { id: 'DOOR_RR', label: 'Rear Right Door' },
  { id: 'WHEEL_FL', label: 'Front Left Wheel' },
  { id: 'WHEEL_FR', label: 'Front Right Wheel' },
  { id: 'WHEEL_RL', label: 'Rear Left Wheel' },
  { id: 'WHEEL_RR', label: 'Rear Right Wheel' },
];

export default function EnhancedDamageAssessment({
  formData,
  setFormData,
  claimId,
}: EnhancedDamageAssessmentProps) {
  const { toast } = useToast();
  const [captureMode, setCaptureMode] = useState<'photo' | 'video' | '360'>('photo');
  const [uploadedMedia, setUploadedMedia] = useState<Record<string, any>>({});
  const [aiAnalysisResults, setAiAnalysisResults] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [current360Angle, setCurrent360Angle] = useState(0);

  // Upload media mutation
  const uploadMediaMutation = useMutation({
    mutationFn: async ({ mediaUrl, mediaType, angle, isDamageZone }: any) => {
      if (!claimId) throw new Error("No claim ID");
      
      const response = await apiRequest("POST", `/api/claims/${claimId}/media`, {
        mediaUrl,
        mediaType,
        angle,
        isDamageZone,
        // Send to AI analysis if it's an image
        analyzeWithAI: mediaType === 'image'
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.aiAnalysis) {
        setAiAnalysisResults(prev => [...prev, data.aiAnalysis]);
      }
      toast({
        title: "Media Uploaded",
        description: "Your media has been uploaded and is being analyzed.",
      });
    },
    onError: (error) => {
      console.error("Error uploading media:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload media. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Analyze all uploaded media with AI
  const analyzeWithAIMutation = useMutation({
    mutationFn: async () => {
      if (!claimId) throw new Error("No claim ID");
      setIsAnalyzing(true);
      
      const response = await apiRequest("POST", `/api/claims/${claimId}/analyze`, {
        mediaIds: Object.keys(uploadedMedia)
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      setIsAnalyzing(false);
      setAiAnalysisResults(data.results);
      toast({
        title: "AI Analysis Complete",
        description: `Detected ${data.totalDamages} damage points across ${data.analyzedMedia} media files.`,
      });
    },
    onError: (error) => {
      setIsAnalyzing(false);
      console.error("Error analyzing with AI:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze media. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const handleMediaUploadComplete = (angle: string, mediaType: 'image' | 'video') => 
    (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
      if (result.successful && result.successful[0]) {
        const uploadURL = result.successful[0].uploadURL as string;
        setUploadedMedia(prev => ({
          ...prev,
          [angle]: { url: uploadURL, type: mediaType }
        }));
        uploadMediaMutation.mutate({
          mediaUrl: uploadURL,
          mediaType,
          angle,
          isDamageZone: damageZones.some(z => z.id === angle)
        });
      }
    };

  const handleDamageChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      damage: {
        ...prev.damage,
        [field]: value,
      },
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Enhanced Damage Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Damage Description */}
        <div className="mb-6">
          <Label htmlFor="damageDescription" className="text-sm font-medium mb-2 block">
            Describe the Damage
          </Label>
          <Textarea
            id="damageDescription"
            rows={3}
            value={formData.damage?.vehicleDescription || ''}
            onChange={(e) => handleDamageChange('vehicleDescription', e.target.value)}
            placeholder="Describe visible damage, including location, type, and severity..."
            className="w-full"
          />
        </div>

        {/* Capture Mode Tabs */}
        <Tabs value={captureMode} onValueChange={(v) => setCaptureMode(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="photo" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video
            </TabsTrigger>
            <TabsTrigger value="360" className="flex items-center gap-2">
              <RotateCw className="h-4 w-4" />
              360° View
            </TabsTrigger>
          </TabsList>

          {/* Photo Mode */}
          <TabsContent value="photo" className="mt-6">
            <div className="space-y-6">
              {/* Standard Angles */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Standard Vehicle Angles
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {vehicleAngles.slice(0, 4).map((angle) => (
                    <div key={angle.id}>
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={10485760}
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={handleMediaUploadComplete(angle.id, 'image')}
                        buttonClassName="w-full"
                      >
                        <div className={`
                          w-full h-32 rounded-lg border-2 border-dashed 
                          ${uploadedMedia[angle.id] ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}
                          hover:border-blue-500 hover:bg-blue-50 transition-colors
                          flex flex-col items-center justify-center cursor-pointer
                        `}>
                          {uploadedMedia[angle.id] ? (
                            <>
                              <CheckCircle2 className="h-6 w-6 text-green-500 mb-1" />
                              <span className="text-xs text-green-700">Uploaded</span>
                            </>
                          ) : (
                            <>
                              <span className="text-2xl mb-1">{angle.icon}</span>
                              <span className="text-xs text-gray-600">{angle.label}</span>
                              <Upload className="h-4 w-4 text-gray-400 mt-1" />
                            </>
                          )}
                        </div>
                      </ObjectUploader>
                    </div>
                  ))}
                </div>
              </div>

              {/* Damage Zone Close-ups */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Damage Zone Close-ups (Optional)
                </h4>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {damageZones.map((zone) => (
                    <ObjectUploader
                      key={zone.id}
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleMediaUploadComplete(zone.id, 'image')}
                      buttonClassName="w-full"
                    >
                      <div className={`
                        p-2 rounded border text-center text-xs cursor-pointer
                        ${uploadedMedia[zone.id] ? 'bg-green-50 border-green-500' : 'bg-white border-gray-300'}
                        hover:bg-blue-50 hover:border-blue-500 transition-colors
                      `}>
                        {uploadedMedia[zone.id] && <CheckCircle2 className="h-3 w-3 text-green-500 mx-auto mb-1" />}
                        {zone.label}
                      </div>
                    </ObjectUploader>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Video Mode */}
          <TabsContent value="video" className="mt-6">
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <h5 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Video Recording Instructions
                </h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Record a slow walk-around video of your vehicle</li>
                  <li>• Start from the front and move clockwise</li>
                  <li>• Focus on damaged areas for 3-5 seconds each</li>
                  <li>• Ensure good lighting and steady camera movement</li>
                  <li>• Video should be 30-60 seconds for complete coverage</li>
                </ul>
              </div>

              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={104857600} // 100MB for video
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleMediaUploadComplete('VIDEO_WALKAROUND', 'video')}
                buttonClassName="w-full"
              >
                <div className={`
                  w-full h-40 rounded-lg border-2 border-dashed 
                  ${uploadedMedia['VIDEO_WALKAROUND'] ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}
                  hover:border-blue-500 hover:bg-blue-50 transition-colors
                  flex flex-col items-center justify-center cursor-pointer
                `}>
                  {uploadedMedia['VIDEO_WALKAROUND'] ? (
                    <>
                      <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                      <span className="text-sm text-green-700">Video Uploaded</span>
                      <Play className="h-4 w-4 text-green-600 mt-1" />
                    </>
                  ) : (
                    <>
                      <Video className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Upload Walk-around Video</span>
                      <span className="text-xs text-gray-400 mt-1">MP4, MOV up to 100MB</span>
                    </>
                  )}
                </div>
              </ObjectUploader>
            </div>
          </TabsContent>

          {/* 360° View Mode */}
          <TabsContent value="360" className="mt-6">
            <div className="space-y-4">
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
                <h5 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  <RotateCw className="h-4 w-4" />
                  360° Capture Guide
                </h5>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Position yourself 2-3 meters from the vehicle</li>
                  <li>• Take photos at 45° intervals around the vehicle</li>
                  <li>• Keep the camera at the same height for all shots</li>
                  <li>• Overlap each photo slightly for seamless stitching</li>
                  <li>• Upload all 8 photos for complete 360° coverage</li>
                </ul>
              </div>

              {/* 360 Degree Visual Guide */}
              <div className="relative bg-gray-50 rounded-lg p-8">
                <div className="relative w-48 h-48 mx-auto">
                  {/* Car in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-gray-300 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🚗</span>
                    </div>
                  </div>
                  
                  {/* Camera positions */}
                  {vehicleAngles.map((angle, index) => {
                    const radius = 80;
                    const angleRad = (angle.rotation * Math.PI) / 180;
                    const x = radius * Math.cos(angleRad - Math.PI / 2);
                    const y = radius * Math.sin(angleRad - Math.PI / 2);
                    
                    return (
                      <div
                        key={angle.id}
                        className="absolute"
                        style={{
                          left: `calc(50% + ${x}px - 16px)`,
                          top: `calc(50% + ${y}px - 16px)`,
                        }}
                      >
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={10485760}
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={handleMediaUploadComplete(`360_${angle.id}`, 'image')}
                          buttonClassName="w-full"
                        >
                          <div className={`
                            w-8 h-8 rounded-full cursor-pointer
                            ${uploadedMedia[`360_${angle.id}`] ? 'bg-green-500' : 'bg-blue-500'}
                            hover:scale-110 transition-transform
                            flex items-center justify-center text-white text-xs font-bold
                          `}>
                            {uploadedMedia[`360_${angle.id}`] ? '✓' : index + 1}
                          </div>
                        </ObjectUploader>
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Click numbered positions to upload photos from each angle
                  </p>
                </div>
              </div>

              {/* Mobile App Suggestion */}
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                  <div className="flex-1">
                    <h6 className="font-semibold text-gray-800">Pro Tip: Use Your Phone</h6>
                    <p className="text-sm text-gray-600">
                      Many smartphones have panorama or photosphere modes that can capture 360° views automatically
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* AI Analysis Section */}
        {(Object.keys(uploadedMedia).length > 0 || aiAnalysisResults.length > 0) && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Damage Analysis
              </h4>
              {Object.keys(uploadedMedia).length > 0 && !isAnalyzing && (
                <Button
                  onClick={() => analyzeWithAIMutation.mutate()}
                  disabled={analyzeWithAIMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                >
                  {analyzeWithAIMutation.isPending ? 'Analyzing...' : 'Run AI Analysis'}
                </Button>
              )}
            </div>

            {isAnalyzing && (
              <div className="bg-purple-50 rounded-lg p-6 text-center">
                <div className="animate-pulse flex flex-col items-center">
                  <Brain className="h-12 w-12 text-purple-600 mb-3" />
                  <p className="text-purple-800 font-semibold">Analyzing Damage...</p>
                  <p className="text-sm text-purple-600 mt-2">
                    Using computer vision to detect and classify damage
                  </p>
                </div>
              </div>
            )}

            {aiAnalysisResults.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-800 mb-3">Analysis Results</h5>
                <div className="space-y-2">
                  {aiAnalysisResults.map((result, index) => (
                    <div key={index} className="bg-white rounded p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{result.damageType || 'Damage Detected'}</span>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          {result.severity || 'Moderate'}
                        </span>
                      </div>
                      {result.confidence && (
                        <div className="mt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Confidence:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${result.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">
                              {Math.round(result.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-white rounded">
                  <p className="text-sm text-gray-600">
                    <strong>Summary:</strong> {aiAnalysisResults.length} damage points detected.
                    Estimated repair complexity: <span className="text-orange-600 font-semibold">Medium</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}