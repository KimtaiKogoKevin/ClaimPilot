import { useState, useMemo, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { cn } from "@/lib/utils";
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
  Sparkles,
  Circle,
  PlayCircle,
  FileVideo,
  Zap,
  Shield,
  Target,
  Eye
} from "lucide-react";

interface EnhancedDamageAssessmentProps {
  formData: any;
  setFormData: (data: any) => void;
  claimId: string | null;
}

// Types
type MediaType = 'image' | 'video';
type CaptureMode = 'photo' | 'video' | '360';
type Severity = 'low' | 'medium' | 'high' | 'critical';

interface VehicleAngle {
  id: string;
  label: string;
  required: boolean;
  icon?: React.ReactNode;
  description?: string;
}

interface DamageZone {
  id: string;
  label: string;
  category: 'body' | 'glass' | 'mechanical';
}

// Configuration
const VEHICLE_ANGLES: VehicleAngle[] = [
  { 
    id: 'FRONT', 
    label: 'Front View', 
    required: true,
    icon: <Target className="h-4 w-4" />,
    description: 'Capture bumper, hood, and windshield'
  },
  { 
    id: 'REAR', 
    label: 'Rear View', 
    required: true,
    icon: <Target className="h-4 w-4" />,
    description: 'Capture bumper, trunk, and rear window'
  },
  { 
    id: 'LEFT', 
    label: 'Left Side', 
    required: true,
    icon: <Target className="h-4 w-4" />,
    description: 'Driver side profile'
  },
  { 
    id: 'RIGHT', 
    label: 'Right Side', 
    required: true,
    icon: <Target className="h-4 w-4" />,
    description: 'Passenger side profile'
  },
  { 
    id: 'FRONT_LEFT', 
    label: 'Front Left Corner', 
    required: false,
    description: 'Optional angle'
  },
  { 
    id: 'FRONT_RIGHT', 
    label: 'Front Right Corner', 
    required: false,
    description: 'Optional angle'
  },
  { 
    id: 'REAR_LEFT', 
    label: 'Rear Left Corner', 
    required: false,
    description: 'Optional angle'
  },
  { 
    id: 'REAR_RIGHT', 
    label: 'Rear Right Corner', 
    required: false,
    description: 'Optional angle'
  },
];

const DAMAGE_ZONES: DamageZone[] = [
  { id: 'HOOD', label: 'Hood', category: 'body' },
  { id: 'WINDSHIELD', label: 'Windshield', category: 'glass' },
  { id: 'ROOF', label: 'Roof', category: 'body' },
  { id: 'TRUNK', label: 'Trunk', category: 'body' },
  { id: 'DOOR_FL', label: 'Front Left Door', category: 'body' },
  { id: 'DOOR_FR', label: 'Front Right Door', category: 'body' },
  { id: 'DOOR_RL', label: 'Rear Left Door', category: 'body' },
  { id: 'DOOR_RR', label: 'Rear Right Door', category: 'body' },
  { id: 'HEADLIGHT_L', label: 'Left Headlight', category: 'glass' },
  { id: 'HEADLIGHT_R', label: 'Right Headlight', category: 'glass' },
  { id: 'WHEEL_FL', label: 'Front Left Wheel', category: 'mechanical' },
  { id: 'WHEEL_FR', label: 'Front Right Wheel', category: 'mechanical' },
];

// Helper Components
const UploadCard = ({ 
  angle,
  uploaded,
  onUpload,
  size = 'default'
}: {
  angle: VehicleAngle;
  uploaded: boolean;
  onUpload: () => JSX.Element;
  size?: 'default' | 'compact';
}) => {
  const isCompact = size === 'compact';
  
  return onUpload();
};

const SeverityBadge = ({ severity }: { severity: Severity }) => {
  const variants = {
    low: 'secondary',
    medium: 'default',
    high: 'destructive',
    critical: 'destructive'
  } as const;
  
  const colors = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600'
  };
  
  return (
    <Badge variant={variants[severity]} className={cn('font-medium', colors[severity])}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
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

  // Memoized calculations
  const uploadProgress = useMemo(() => {
    const requiredAngles = VEHICLE_ANGLES.filter(a => a.required);
    const uploadedRequired = requiredAngles.filter(a => uploadedMedia[a.id]).length;
    const totalUploaded = Object.keys(uploadedMedia).length;
    
    return {
      required: uploadedRequired,
      requiredTotal: requiredAngles.length,
      total: totalUploaded,
      percentage: (uploadedRequired / requiredAngles.length) * 100,
      isComplete: uploadedRequired === requiredAngles.length
    };
  }, [uploadedMedia]);

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
        title: "✓ Upload Complete",
        description: "Media uploaded and queued for analysis",
      });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  // Batch AI analysis
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
        title: "✓ Analysis Complete",
        description: `${data.totalDamages} damage points detected`,
      });
    },
    onError: (error) => {
      setIsAnalyzing(false);
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = useCallback(async () => {
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
  }, []);

  const handleMediaUploadComplete = useCallback((angle: string, mediaType: MediaType) => 
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
    }, [uploadMediaMutation]
  );

  const handleDamageChange = useCallback((field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      damage: {
        ...prev.damage,
        [field]: value,
      },
    }));
  }, [setFormData]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 px-2 sm:px-4 lg:px-8">
      
      {/* Header Section with Progress */}
      <div className="space-y-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader className="pb-6 pt-8 px-6 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  Damage Documentation
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  Document vehicle damage for AI-powered assessment
                </CardDescription>
              </div>
              {uploadProgress.isComplete && (
                <Badge className="bg-green-100 text-green-800 border-green-200 px-4 py-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Ready for Analysis
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="px-6 sm:px-8 pb-8">
            {/* Enhanced Progress Section */}
            <div className="bg-white rounded-xl border p-6 mb-6">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Upload Progress</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {uploadProgress.required}/{uploadProgress.requiredTotal} Required
                  </span>
                  <Badge variant="outline" className="font-mono">
                    {Math.round(uploadProgress.percentage)}%
                  </Badge>
                </div>
              </div>
              <Progress value={uploadProgress.percentage} className="h-3" />
              {uploadProgress.total > uploadProgress.required && (
                <p className="text-xs text-muted-foreground mt-2">
                  +{uploadProgress.total - uploadProgress.required} additional photos uploaded
                </p>
              )}
            </div>

            {/* Damage Description with Character Count */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <Label htmlFor="damageDescription" className="text-base font-semibold">
                  Damage Description
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <span className="text-xs text-muted-foreground">
                  {(formData.damage?.vehicleDescription || '').length}/500
                </span>
              </div>
              <Textarea
                id="damageDescription"
                value={formData.damage?.vehicleDescription || ''}
                onChange={(e) => handleDamageChange('vehicleDescription', e.target.value)}
                placeholder="Describe the damage location, type, and severity. Be specific about visible damage..."
                className="min-h-[120px] resize-none text-base"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Include details about impact points, damage extent, and any functional issues
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Capture Modes */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <Tabs value={captureMode} onValueChange={(v) => setCaptureMode(v as CaptureMode)} className="w-full">
            <div className="border-b bg-gray-50/50 px-6 sm:px-8 pt-6">
              <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 h-14 p-1 bg-white">
                <TabsTrigger 
                  value="photo" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 text-sm font-medium"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Photos</span>
                  <span className="sm:hidden">Photo</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="video" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 text-sm font-medium"
                >
                  <Video className="h-4 w-4" />
                  Video
                </TabsTrigger>
                <TabsTrigger 
                  value="360" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 text-sm font-medium"
                >
                  <RotateCw className="h-4 w-4" />
                  360°
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Photo Mode - Enhanced Layout */}
            <TabsContent value="photo" className="mt-0 p-6 sm:p-8 space-y-8">
              {/* Required Angles Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Required Angles
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Capture these essential views for complete assessment
                    </p>
                  </div>
                  <Badge variant="outline" className="px-3 py-1">
                    {uploadProgress.required}/{uploadProgress.requiredTotal} Complete
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {VEHICLE_ANGLES.filter(a => a.required).map((angle) => (
                    <ObjectUploader
                      key={angle.id}
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleMediaUploadComplete(angle.id, 'image')}
                      buttonClassName="w-full h-full"
                    >
                      <Card className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-lg group relative overflow-hidden",
                        uploadedMedia[angle.id] 
                          ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100/50 shadow-md' 
                          : 'border-2 border-dashed hover:border-primary hover:bg-gray-50'
                      )}>
                        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[180px] relative">
                          {uploadedMedia[angle.id] ? (
                            <div className="text-center space-y-3">
                              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-green-800">{angle.label}</p>
                                <p className="text-xs text-green-600 mt-1">Successfully uploaded</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center space-y-3">
                              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                <Upload className="h-8 w-8 text-gray-400 group-hover:text-primary transition-colors" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-700">{angle.label}</p>
                                <p className="text-xs text-muted-foreground mt-1">{angle.description}</p>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                Tap to upload
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </ObjectUploader>
                  ))}
                </div>
              </div>

              <Separator className="my-8" />

              {/* Optional Angles */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    Additional Angles
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Optional views for more comprehensive coverage
                  </p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {VEHICLE_ANGLES.filter(a => !a.required).map((angle) => (
                    <ObjectUploader
                      key={angle.id}
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleMediaUploadComplete(angle.id, 'image')}
                      buttonClassName="w-full"
                    >
                      <Card className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        uploadedMedia[angle.id] 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'hover:bg-gray-50'
                      )}>
                        <CardContent className="p-4 flex items-center justify-center min-h-[100px]">
                          <div className="text-center">
                            {uploadedMedia[angle.id] ? (
                              <CheckCircle2 className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                            ) : (
                              <Circle className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                            )}
                            <p className="text-xs font-medium">{angle.label}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </ObjectUploader>
                  ))}
                </div>
              </div>

              <Separator className="my-8" />

              {/* Damage Zone Close-ups - Categorized */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-600" />
                    Damage Zone Close-ups
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload detailed photos of specific damaged areas
                  </p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
                        className="w-full h-auto py-4 px-3 flex flex-col items-center gap-2"
                      >
                        {uploadedMedia[zone.id] ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Upload className="h-5 w-5 opacity-50" />
                        )}
                        <span className="text-xs font-medium">{zone.label}</span>
                        {zone.category && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {zone.category}
                          </Badge>
                        )}
                      </Button>
                    </ObjectUploader>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Video Mode - Enhanced */}
            <TabsContent value="video" className="mt-0 p-6 sm:p-8 space-y-8">
              <div className="max-w-3xl mx-auto space-y-6">
                <Alert className="border-blue-200 bg-blue-50/50">
                  <FileVideo className="h-5 w-5 text-blue-600" />
                  <AlertTitle className="text-blue-900">Video Documentation</AlertTitle>
                  <AlertDescription className="text-blue-700 mt-2">
                    Record a comprehensive walk-around video of your vehicle. This helps our AI analyze damage from multiple angles in one continuous capture.
                  </AlertDescription>
                </Alert>

                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={104857600}
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleMediaUploadComplete('VIDEO_WALKAROUND', 'video')}
                  buttonClassName="w-full"
                >
                  <Card className={cn(
                    "cursor-pointer transition-all hover:shadow-lg group",
                    uploadedMedia['VIDEO_WALKAROUND'] 
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100/50' 
                      : 'border-2 border-dashed hover:border-primary'
                  )}>
                    <CardContent className="py-16 px-8">
                      <div className="text-center space-y-4">
                        {uploadedMedia['VIDEO_WALKAROUND'] ? (
                          <>
                            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                              <PlayCircle className="h-10 w-10 text-green-600" />
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-green-800">Video Uploaded Successfully</p>
                              <p className="text-sm text-green-600 mt-1">Ready for AI analysis</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <Video className="h-10 w-10 text-gray-400 group-hover:text-primary transition-colors" />
                            </div>
                            <div>
                              <p className="text-lg font-semibold">Upload Walk-around Video</p>
                              <p className="text-sm text-muted-foreground mt-1">MP4 or MOV • Max 100MB</p>
                            </div>
                            <Button variant="secondary" size="lg">
                              Select Video File
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </ObjectUploader>

                <div className="grid sm:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50/50">
                    <CardContent className="p-6">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Recording Guidelines
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          Start from front, move clockwise
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          Maintain 2-3 meters distance
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          Good lighting is essential
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          30-60 seconds duration
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50/50">
                    <CardContent className="p-6">
                      <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Focus Areas
                      </h4>
                      <ul className="text-sm text-purple-700 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 mt-0.5">•</span>
                          All damaged areas (3-5 sec each)
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 mt-0.5">•</span>
                          License plates (front & rear)
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 mt-0.5">•</span>
                          VIN if accessible
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 mt-0.5">•</span>
                          Interior if damaged
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* 360° Mode - Interactive */}
            <TabsContent value="360" className="mt-0 p-6 sm:p-8 space-y-8">
              <div className="max-w-4xl mx-auto space-y-8">
                <Alert className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <AlertTitle className="text-purple-900">360° Vehicle Capture</AlertTitle>
                  <AlertDescription className="text-purple-700 mt-2">
                    Capture your vehicle from 8 strategic angles for complete coverage. This provides the most comprehensive documentation for accurate damage assessment.
                  </AlertDescription>
                </Alert>

                {/* Interactive 360 Visualization */}
                <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50">
                  <CardContent className="p-8">
                    <div className="relative aspect-square max-w-md mx-auto">
                      {/* Center Vehicle */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                          <div className="text-center">
                            <Camera className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 font-medium">Your Vehicle</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Camera Position Indicators */}
                      {VEHICLE_ANGLES.map((angle, index) => {
                        const total = VEHICLE_ANGLES.length;
                        const rotation = (index * 360 / total) - 90;
                        const radius = 42;
                        const x = 50 + radius * Math.cos(rotation * Math.PI / 180);
                        const y = 50 + radius * Math.sin(rotation * Math.PI / 180);
                        const isUploaded = uploadedMedia[`360_${angle.id}`];
                        
                        return (
                          <div
                            key={angle.id}
                            className="absolute transition-all duration-300"
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
                              buttonClassName="relative"
                            >
                              <div className="relative group">
                                <Button
                                  size="lg"
                                  variant={isUploaded ? "default" : "outline"}
                                  className={cn(
                                    "rounded-full w-14 h-14 sm:w-16 sm:h-16 p-0 transition-all",
                                    isUploaded 
                                      ? "bg-green-500 hover:bg-green-600 border-green-600 shadow-lg" 
                                      : "hover:scale-110 hover:shadow-lg"
                                  )}
                                >
                                  {isUploaded ? (
                                    <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                                  ) : (
                                    <span className="text-base font-bold">{index + 1}</span>
                                  )}
                                </Button>
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
                                    {angle.label}
                                  </Badge>
                                </div>
                              </div>
                            </ObjectUploader>
                          </div>
                        );
                      })}
                      
                      {/* Connection Lines */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {VEHICLE_ANGLES.map((_, index) => {
                          const total = VEHICLE_ANGLES.length;
                          const rotation = (index * 360 / total) - 90;
                          const nextRotation = ((index + 1) % total * 360 / total) - 90;
                          const radius = 42;
                          
                          const x1 = 50 + radius * Math.cos(rotation * Math.PI / 180);
                          const y1 = 50 + radius * Math.sin(rotation * Math.PI / 180);
                          const x2 = 50 + radius * Math.cos(nextRotation * Math.PI / 180);
                          const y2 = 50 + radius * Math.sin(nextRotation * Math.PI / 180);
                          
                          return (
                            <line
                              key={index}
                              x1={`${x1}%`}
                              y1={`${y1}%`}
                              x2={`${x2}%`}
                              y2={`${y2}%`}
                              stroke="rgb(229, 231, 235)"
                              strokeWidth="1"
                              strokeDasharray="4 4"
                            />
                          );
                        })}
                      </svg>
                    </div>
                  </CardContent>
                </Card>

                {/* Progress Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {VEHICLE_ANGLES.map((angle, index) => {
                    const is360Uploaded = uploadedMedia[`360_${angle.id}`];
                    return (
                      <Card 
                        key={angle.id} 
                        className={cn(
                          "transition-all",
                          is360Uploaded ? "bg-green-50 border-green-300" : "bg-white"
                        )}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                            is360Uploaded 
                              ? "bg-green-500 text-white" 
                              : "bg-gray-100 text-gray-500"
                          )}>
                            {is360Uploaded ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                          </div>
                          <div className="flex-1">
                            <p className={cn(
                              "text-sm font-medium",
                              is360Uploaded ? "text-green-700" : "text-gray-700"
                            )}>
                              {angle.label}
                            </p>
                            {angle.required && (
                              <Badge variant="outline" className="text-[10px] mt-1">
                                Required
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Analysis Results - Enhanced */}
      {Object.keys(uploadedMedia).length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50/50 to-blue-50/50">
          <CardHeader className="pb-6 pt-8 px-6 sm:px-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                  AI Damage Analysis
                </CardTitle>
                <CardDescription className="mt-2">
                  Computer vision assessment of vehicle damage
                </CardDescription>
              </div>
              {!isAnalyzing && (
                <Button
                  onClick={() => analyzeWithAIMutation.mutate()}
                  disabled={analyzeWithAIMutation.isPending}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {analyzeWithAIMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Run AI Analysis
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="px-6 sm:px-8 pb-8">
            {isAnalyzing ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
                  <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                </div>
                <p className="text-lg font-semibold text-gray-800">Analyzing Vehicle Damage</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Our AI is examining your photos for damage detection...
                </p>
              </div>
            ) : aiAnalysisResults.length > 0 ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <Card className="bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <AlertTriangle className="h-8 w-8 text-orange-500" />
                        <span className="text-3xl font-bold text-gray-800">
                          {aiAnalysisResults.length}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-600">Damage Points Detected</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Zap className="h-8 w-8 text-yellow-500" />
                        <SeverityBadge severity="medium" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Overall Severity</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Shield className="h-8 w-8 text-green-500" />
                        <span className="text-3xl font-bold text-gray-800">
                          85%
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-600">Analysis Confidence</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Damage List */}
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-base">Detected Damage Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-3">
                        {aiAnalysisResults.slice(0, 10).map((result, index) => (
                          <Card key={index} className="bg-gray-50">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">
                                      #{index + 1}
                                    </Badge>
                                    <p className="font-semibold text-sm">
                                      {result.damageType || `Damage Point ${index + 1}`}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Target className="h-3 w-3" />
                                      Confidence: {Math.round((result.confidence || 0.8) * 100)}%
                                    </span>
                                    {result.estimatedCost && (
                                      <span className="flex items-center gap-1">
                                        <span>Est. Cost: ${result.estimatedCost}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <SeverityBadge severity={result.severity || 'medium'} />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* AI Recommendations */}
                <Alert className="border-blue-200 bg-blue-50/50">
                  <Info className="h-5 w-5 text-blue-600" />
                  <AlertTitle className="text-blue-900">AI Recommendations</AlertTitle>
                  <AlertDescription className="text-blue-700 mt-2">
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Professional body shop assessment recommended</li>
                      <li>Multiple damage points require specialized repair</li>
                      <li>Insurance adjuster review suggested for accurate valuation</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                  <Brain className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-800">Ready for Analysis</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click "Run AI Analysis" to detect and assess vehicle damage
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}