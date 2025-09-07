import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { 
  Camera, 
  Video, 
  RotateCw, 
  Brain, 
  CheckCircle2, 
  Info,
  Upload,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  Sparkles
} from "lucide-react";

interface EnhancedDamageAssessmentProps {
  formData: any;
  setFormData: (data: any) => void;
  claimId: string | null;
}

// Media types
type MediaType = 'image' | 'video';
type CaptureMode = 'photo' | 'video' | '360';

// Angle configuration
const VEHICLE_ANGLES = [
  { id: 'FRONT', label: 'Front', required: true },
  { id: 'REAR', label: 'Rear', required: true },
  { id: 'LEFT', label: 'Left Side', required: true },
  { id: 'RIGHT', label: 'Right Side', required: true },
  { id: 'FRONT_LEFT', label: 'Front Left', required: false },
  { id: 'FRONT_RIGHT', label: 'Front Right', required: false },
  { id: 'REAR_LEFT', label: 'Rear Left', required: false },
  { id: 'REAR_RIGHT', label: 'Rear Right', required: false },
] as const;

const DAMAGE_ZONES = [
  { id: 'HOOD', label: 'Hood' },
  { id: 'WINDSHIELD', label: 'Windshield' },
  { id: 'ROOF', label: 'Roof' },
  { id: 'TRUNK', label: 'Trunk' },
  { id: 'DOOR_FL', label: 'Front Left Door' },
  { id: 'DOOR_FR', label: 'Front Right Door' },
  { id: 'DOOR_RL', label: 'Rear Left Door' },
  { id: 'DOOR_RR', label: 'Rear Right Door' },
] as const;

// Component for upload status indicator
const UploadStatus = ({ uploaded, required }: { uploaded: boolean; required?: boolean }) => {
  if (uploaded) {
    return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  }
  if (required) {
    return <div className="h-2 w-2 rounded-full bg-red-500" />;
  }
  return <div className="h-2 w-2 rounded-full bg-gray-300" />;
};

// Component for media upload card
const MediaUploadCard = ({ 
  label, 
  uploaded, 
  required,
  onUpload,
  className = ""
}: {
  label: string;
  uploaded: boolean;
  required?: boolean;
  onUpload: () => JSX.Element;
  className?: string;
}) => {
  return (
    <div className={`relative ${className}`}>
      {onUpload()}
      <div className="absolute top-2 right-2">
        <UploadStatus uploaded={uploaded} required={required} />
      </div>
    </div>
  );
};

export default function EnhancedDamageAssessment({
  formData,
  setFormData,
  claimId,
}: EnhancedDamageAssessmentProps) {
  const { toast } = useToast();
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');
  const [uploadedMedia, setUploadedMedia] = useState<Record<string, any>>({});
  const [aiAnalysisResults, setAiAnalysisResults] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Calculate upload progress
  const requiredAngles = VEHICLE_ANGLES.filter(a => a.required);
  const uploadedRequired = requiredAngles.filter(a => uploadedMedia[a.id]).length;
  const progressPercentage = (uploadedRequired / requiredAngles.length) * 100;

  // Upload media mutation
  const uploadMediaMutation = useMutation({
    mutationFn: async ({ mediaUrl, mediaType, angle, isDamageZone }: any) => {
      if (!claimId) throw new Error("No claim ID");
      
      const response = await apiRequest("POST", `/api/claims/${claimId}/media`, {
        mediaUrl,
        mediaType,
        angle,
        isDamageZone,
        analyzeWithAI: mediaType === 'image'
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.aiAnalysis) {
        setAiAnalysisResults(prev => [...prev, data.aiAnalysis]);
      }
      toast({
        title: "Upload Successful",
        description: "Media has been uploaded and queued for analysis.",
      });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Batch AI analysis mutation
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
        title: "Analysis Complete",
        description: `Found ${data.totalDamages} damage points.`,
      });
    },
    onError: (error) => {
      setIsAnalyzing(false);
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Please try again.",
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
      console.error("Upload params error:", error);
      throw error;
    }
  };

  const handleMediaUploadComplete = (angle: string, mediaType: MediaType) => 
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
          isDamageZone: DAMAGE_ZONES.some(z => z.id === angle)
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
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Camera className="h-5 w-5" />
            Vehicle Damage Documentation
          </CardTitle>
          <CardDescription>
            Document all vehicle damage with photos or video for AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Upload Progress</span>
              <span className="text-sm text-muted-foreground">
                {uploadedRequired} of {requiredAngles.length} required
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Damage Description */}
          <div className="space-y-2">
            <Label htmlFor="damageDescription">
              Damage Description
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Textarea
              id="damageDescription"
              value={formData.damage?.vehicleDescription || ''}
              onChange={(e) => handleDamageChange('vehicleDescription', e.target.value)}
              placeholder="Describe the location, type, and severity of damage..."
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about damage locations and types
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Capture Mode Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={captureMode} onValueChange={(v) => setCaptureMode(v as CaptureMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="photo" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <ImageIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Photos</span>
              </TabsTrigger>
              <TabsTrigger value="video" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Video className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Video</span>
              </TabsTrigger>
              <TabsTrigger value="360" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <RotateCw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">360°</span>
              </TabsTrigger>
            </TabsList>

            {/* Photo Mode */}
            <TabsContent value="photo" className="space-y-6">
              {/* Required Angles */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold">Required Angles</h3>
                  <Badge variant="outline">
                    {uploadedRequired}/{requiredAngles.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {requiredAngles.map((angle) => (
                    <ObjectUploader
                      key={angle.id}
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleMediaUploadComplete(angle.id, 'image')}
                      buttonClassName="w-full h-full"
                    >
                      <Card className={`
                        cursor-pointer transition-all hover:shadow-md
                        ${uploadedMedia[angle.id] 
                          ? 'border-green-500 bg-green-50/50' 
                          : 'border-dashed hover:border-primary'
                        }
                      `}>
                        <CardContent className="flex flex-col items-center justify-center p-6 min-h-[120px]">
                          {uploadedMedia[angle.id] ? (
                            <>
                              <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
                              <span className="text-sm font-medium text-green-700">Uploaded</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                              <span className="text-sm font-medium">{angle.label}</span>
                              <span className="text-xs text-muted-foreground mt-1">Tap to upload</span>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </ObjectUploader>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Optional Damage Zones */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-base font-semibold">Damage Close-ups</h3>
                  <Badge variant="secondary">Optional</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload close-up photos of specific damaged areas
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {DAMAGE_ZONES.map((zone) => (
                    <ObjectUploader
                      key={zone.id}
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleMediaUploadComplete(zone.id, 'image')}
                      buttonClassName="w-full"
                    >
                      <Button
                        variant={uploadedMedia[zone.id] ? "default" : "outline"}
                        className="w-full h-auto py-3 px-2"
                      >
                        <div className="flex flex-col items-center gap-1">
                          {uploadedMedia[zone.id] && (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          <span className="text-xs">{zone.label}</span>
                        </div>
                      </Button>
                    </ObjectUploader>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Video Mode */}
            <TabsContent value="video" className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Record a slow, steady walk-around video of your vehicle, focusing on damaged areas for 3-5 seconds each.
                </AlertDescription>
              </Alert>

              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={104857600}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleMediaUploadComplete('VIDEO_WALKAROUND', 'video')}
                buttonClassName="w-full"
              >
                <Card className={`
                  cursor-pointer transition-all hover:shadow-md
                  ${uploadedMedia['VIDEO_WALKAROUND'] 
                    ? 'border-green-500 bg-green-50/50' 
                    : 'border-dashed hover:border-primary'
                  }
                `}>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    {uploadedMedia['VIDEO_WALKAROUND'] ? (
                      <>
                        <CheckCircle2 className="h-12 w-12 text-green-600 mb-3" />
                        <span className="text-base font-medium text-green-700">Video Uploaded</span>
                      </>
                    ) : (
                      <>
                        <Video className="h-12 w-12 text-muted-foreground mb-3" />
                        <span className="text-base font-medium">Upload Walk-around Video</span>
                        <span className="text-sm text-muted-foreground mt-1">MP4, MOV up to 100MB</span>
                      </>
                    )}
                  </CardContent>
                </Card>
              </ObjectUploader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-sm mb-2">Recording Tips</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Start from the front, move clockwise</li>
                      <li>• Keep 2-3 meters distance</li>
                      <li>• Ensure good lighting</li>
                      <li>• 30-60 seconds total</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-sm mb-2">Focus Areas</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• All damaged areas</li>
                      <li>• License plates</li>
                      <li>• VIN if visible</li>
                      <li>• Interior if affected</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 360° Mode */}
            <TabsContent value="360" className="space-y-6">
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Capture your vehicle from 8 angles for complete 360° coverage. This provides the best documentation for AI analysis.
                </AlertDescription>
              </Alert>

              {/* 360 Visual Guide */}
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <div className="relative aspect-square max-w-sm mx-auto">
                    {/* Center car icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-background rounded-lg shadow-lg flex items-center justify-center">
                        <Camera className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                      </div>
                    </div>
                    
                    {/* Camera positions */}
                    {VEHICLE_ANGLES.map((angle, index) => {
                      const angleStep = 360 / VEHICLE_ANGLES.length;
                      const rotation = index * angleStep - 90;
                      const radius = 40; // percentage
                      const x = 50 + radius * Math.cos(rotation * Math.PI / 180);
                      const y = 50 + radius * Math.sin(rotation * Math.PI / 180);
                      
                      return (
                        <div
                          key={angle.id}
                          className="absolute"
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={10485760}
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={handleMediaUploadComplete(`360_${angle.id}`, 'image')}
                            buttonClassName="w-full"
                          >
                            <Button
                              size="sm"
                              variant={uploadedMedia[`360_${angle.id}`] ? "default" : "outline"}
                              className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0"
                            >
                              {uploadedMedia[`360_${angle.id}`] ? (
                                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                              ) : (
                                <span className="text-xs font-bold">{index + 1}</span>
                              )}
                            </Button>
                          </ObjectUploader>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="text-center mt-6">
                    <p className="text-sm text-muted-foreground">
                      Tap numbered positions to upload from each angle
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {VEHICLE_ANGLES.map((angle, index) => {
                  const is360Uploaded = uploadedMedia[`360_${angle.id}`];
                  return (
                    <div key={angle.id} className="flex items-center gap-2 text-sm">
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${is360Uploaded 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-muted text-muted-foreground'
                        }
                      `}>
                        {index + 1}
                      </div>
                      <span className={is360Uploaded ? 'text-green-700 font-medium' : 'text-muted-foreground'}>
                        {angle.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Analysis Section */}
      {Object.keys(uploadedMedia).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Damage Analysis
              </CardTitle>
              {!isAnalyzing && (
                <Button
                  onClick={() => analyzeWithAIMutation.mutate()}
                  disabled={analyzeWithAIMutation.isPending}
                  size="sm"
                >
                  {analyzeWithAIMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing
                    </>
                  ) : (
                    'Run Analysis'
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Analyzing damage with AI...</p>
              </div>
            ) : aiAnalysisResults.length > 0 ? (
              <div className="space-y-4">
                {/* Results Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-primary">
                        {aiAnalysisResults.length}
                      </div>
                      <p className="text-xs text-muted-foreground">Damage Points</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-orange-600">
                        Medium
                      </div>
                      <p className="text-xs text-muted-foreground">Severity Level</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">
                        85%
                      </div>
                      <p className="text-xs text-muted-foreground">Confidence</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Results */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Detected Damage</h4>
                  {aiAnalysisResults.slice(0, 5).map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium">
                            {result.damageType || `Damage ${index + 1}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Confidence: {Math.round((result.confidence || 0.8) * 100)}%
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        result.severity === 'high' ? 'destructive' :
                        result.severity === 'medium' ? 'default' : 'secondary'
                      }>
                        {result.severity || 'Medium'}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Professional assessment recommended. Multiple damage points detected requiring specialized repair.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Upload complete. Click "Run Analysis" to detect damage.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}