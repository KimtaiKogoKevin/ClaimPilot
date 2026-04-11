import { useState, useMemo, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { cn } from "@/lib/utils";
import { 
  Camera, 
  Video, 
  Brain, 
  CheckCircle2, 
  Info,
  Upload,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  Shield,
  PlayCircle,
  RotateCw,
  CheckCheck,
  ArrowRight,
  Trash2,
  Plus
} from "lucide-react";
import { Input } from "../ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

interface EnhancedDamageAssessmentProps {
  formData: any;
  setFormData: (data: any) => void;
  claimId: string | null;
}

// Simple configuration for essential views only
const ESSENTIAL_VIEWS = [
  { 
    id: 'FRONT_VIEW', 
    label: 'Front View', 
    description: 'Capture front bumper, hood, and windshield',
    icon: '🚗'
  },
  { 
    id: 'REAR_VIEW', 
    label: 'Rear View', 
    description: 'Capture rear bumper, trunk, and rear window',
    icon: '🚙'
  },
  { 
    id: 'LEFT_SIDE', 
    label: 'Left Side', 
    description: 'Driver side - capture doors, windows, and wheels',
    icon: '⬅️'
  },
  { 
    id: 'RIGHT_SIDE', 
    label: 'Right Side', 
    description: 'Passenger side - capture doors, windows, and wheels',
    icon: '➡️'
  },
];

// Video coverage checklist
const VIDEO_CHECKLIST = [
  { id: 'start_front', label: 'Start from the front of the vehicle' },
  { id: 'move_clockwise', label: 'Move clockwise around the vehicle' },
  { id: 'complete_circle', label: 'Complete a full 360° circle' },
  { id: 'steady_pace', label: 'Maintain steady pace (30-60 seconds)' },
  { id: 'good_lighting', label: 'Ensure good lighting conditions' },
  { id: 'focus_damage', label: 'Focus on damaged areas for 3-5 seconds' },
];

function normalizeObjectUrl(objectPath: string): string {
  if (!objectPath) return '';
  if (objectPath.startsWith('https://') || objectPath.startsWith('http://')) {
    return objectPath.split('?')[0];
  }
  if (objectPath.startsWith('/objects/')) {
    return objectPath;
  }
  return objectPath;
}

export default function EnhancedDamageAssessment({
  formData,
  setFormData,
  claimId,
}: EnhancedDamageAssessmentProps) {
  const { toast } = useToast();
  const [captureMode, setCaptureMode] = useState<"photo" | "video">("photo");
  const [uploadedMedia, setUploadedMedia] = useState<Record<string, any>>({});
  const [aiAnalysisResults, setAiAnalysisResults] = useState<any[]>([]);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [videoChecklist, setVideoChecklist] = useState<Record<string, boolean>>(
    {}
  );

  const { data: existingMedia } = useQuery<{ photos: any[]; documents: any[] }>({
    queryKey: ['/api/claims', claimId, 'media'],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/claims/${claimId}/media`);
      return res.json();
    },
    enabled: !!claimId,
  });

  useEffect(() => {
    if (existingMedia?.photos && existingMedia.photos.length > 0) {
      const restoredMedia: Record<string, any> = {};
      const restoredAnalysis: any[] = [];
      let hasUnavailable = false;
      for (const photo of existingMedia.photos) {
        if (photo.angle) {
          const url = normalizeObjectUrl(photo.objectPath);
          restoredMedia[photo.angle] = {
            url,
            type: photo.angle === 'VIDEO_360' ? 'video' : 'image',
          };
          if (photo.aiAnalysisResults) {
            const raw = photo.aiAnalysisResults;
            if (raw.unavailable) {
              hasUnavailable = true;
            } else if (raw.predictions && Array.isArray(raw.predictions)) {
              for (const pred of raw.predictions) {
                restoredAnalysis.push({
                  damageType: pred.damageType || pred.class || 'unknown',
                  confidence: pred.confidence ?? 0,
                  severity: pred.severity || 'low',
                });
              }
            } else if (raw.damageType) {
              restoredAnalysis.push(raw);
            }
          }
        }
      }
      setUploadedMedia(prev => {
        if (Object.keys(prev).length === 0) return restoredMedia;
        return prev;
      });
      if (hasUnavailable && restoredAnalysis.length === 0) {
        setAiUnavailable(true);
      }
      if (restoredAnalysis.length > 0) {
        setAiAnalysisResults(prev => prev.length === 0 ? restoredAnalysis : prev);
      }
    }
  }, [existingMedia]);

  // Calculate upload progress
  const uploadProgress = useMemo(() => {
    const uploadedPhotos = ESSENTIAL_VIEWS.filter(
      (view) => uploadedMedia[view.id]
    ).length;
    const hasVideo = !!uploadedMedia["VIDEO_360"];
    const photosPercentage = (uploadedPhotos / ESSENTIAL_VIEWS.length) * 100;
    const videoChecklistComplete =
      Object.keys(videoChecklist).length === VIDEO_CHECKLIST.length &&
      Object.values(videoChecklist).every((checked) => checked);

    return {
      photosUploaded: uploadedPhotos,
      photosTotal: ESSENTIAL_VIEWS.length,
      photosPercentage,
      hasVideo,
      videoChecklistComplete,
      isPhotoComplete: uploadedPhotos === ESSENTIAL_VIEWS.length,
      isVideoComplete: hasVideo && videoChecklistComplete,
    };
  }, [uploadedMedia, videoChecklist]);

  // Upload media mutation
  const uploadMediaMutation = useMutation({
    mutationFn: async ({ mediaUrl, mediaType, angle }: any) => {
      if (!claimId) throw new Error("No claim ID");

      const response = await apiRequest(
        "POST",
        `/api/claims/${claimId}/media`,
        {
          mediaUrl,
          mediaType,
          angle,
          analyzeWithAI: true,
        }
      );

      return response.json();
    },
    onSuccess: (data) => {
      if (data.aiAnalysis) {
        if (data.aiAnalysis.unavailable) {
          setAiUnavailable(true);
        } else if (data.aiAnalysis.predictions && data.aiAnalysis.predictions.length > 0) {
          const preds = data.aiAnalysis.predictions.map((p: any) => ({
            damageType: p.damageType,
            confidence: p.confidence,
            severity: p.severity,
          }));
          setAiAnalysisResults((prev) => [...prev, ...preds]);
        }
      }
      toast({
        title: "✓ Upload Successful",
        description: "Media uploaded successfully",
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

  // AI analysis mutation
  const analyzeWithAIMutation = useMutation({
    mutationFn: async () => {
      if (!claimId) throw new Error("No claim ID");
      setIsAnalyzing(true);

      const response = await apiRequest(
        "POST",
        `/api/claims/${claimId}/analyze`,
        {
          mediaIds: Object.keys(uploadedMedia),
        }
      );

      return response.json();
    },
    onSuccess: (data) => {
      setIsAnalyzing(false);
      if (data.unavailable) {
        setAiUnavailable(true);
      } else {
        setAiAnalysisResults(data.results || []);
        toast({
          title: "✓ Analysis Complete",
          description: `Damage assessment completed`,
        });
      }
    },
    onError: (error) => {
      setIsAnalyzing(false);
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not complete AI damage analysis. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleChange = (field: string, value: any) =>
    setFormData((prev: any) => ({ ...prev, [field]: value }));

 

  const addListItem = (listName: string, newItem: object) =>
    setFormData((prev: any) => ({
      ...prev,
      [listName]: [...prev[listName], newItem],
    }));

  const removeListItem = (listName: string, index: number) =>
    setFormData((prev: any) => ({
      ...prev,
      [listName]: prev[listName].filter((_: any, i: number) => i !== index),
    }));

  const updateListItem = (
    listName: string,
    index: number,
    field: string,
    value: string
  ) => {
    setFormData((prev: any) => ({
      ...prev,
      [listName]: prev[listName].map((item: any, i: number) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

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

  const handleMediaUploadComplete = useCallback(
    (angle: string, mediaType: "image" | "video") =>
      (
        result: UploadResult<Record<string, unknown>, Record<string, unknown>>
      ) => {
        if (result.successful && result.successful[0]) {
          const uploadURL = result.successful[0].uploadURL as string;
          setUploadedMedia((prev) => ({
            ...prev,
            [angle]: { url: uploadURL, type: mediaType },
          }));
          uploadMediaMutation.mutate({
            mediaUrl: uploadURL,
            mediaType,
            angle,
          });
        }
      },
    [uploadMediaMutation]
  );

  const handleDamageChange = useCallback(
    (field: string, value: any) => {
      setFormData((prev: any) => ({
        ...prev,
        damage: {
          ...prev.damage,
          [field]: value,
        },
      }));
    },
    [setFormData]
  );

  const handleChecklistToggle = (itemId: string) => {
    setVideoChecklist((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header with Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Vehicle Damage Documentation
          </CardTitle>
          <CardDescription>
            Capture essential vehicle views and describe the damage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                Documentation Progress
              </span>
              <span className="text-sm text-muted-foreground">
                {captureMode === "photo"
                  ? `${uploadProgress.photosUploaded}/${uploadProgress.photosTotal} photos`
                  : uploadProgress.hasVideo
                  ? "✓ Video uploaded"
                  : "No video yet"}
              </span>
            </div>
            <Progress
              value={
                captureMode === "photo"
                  ? uploadProgress.photosPercentage
                  : uploadProgress.hasVideo
                  ? 100
                  : 0
              }
              className="h-2"
            />
          </div>

          {/* Damage Description */}
          <div className="space-y-2">
            <Label htmlFor="damageDescription">
              Damage Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="damageDescription"
              value={formData.damage?.vehicleDescription || ""}
              onChange={(e) =>
                handleDamageChange("vehicleDescription", e.target.value)
              }
              placeholder="Describe the damage location, type, and severity..."
              className="min-h-[100px] resize-none"
            />
          </div>

          <div>
            <h4 className="text-md font-semibold text-neutral-800 border-t pt-6">
              Inspection & Repair
            </h4>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="md:col-span-2">
                <Label htmlFor="inspectionLocation">
                  When and where can vehicle be inspected?
                </Label>
                <Input
                  id="inspectionLocation"
                  value={formData.inspectionLocation}
                  onChange={(e) =>
                    handleChange("inspectionLocation", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="repairerName">Repairer's Name</Label>
                <Input
                  id="repairerName"
                  value={formData.repairerName}
                  onChange={(e) => handleChange("repairerName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="repairerPhone">Repairer's Tel No.</Label>
                <Input
                  id="repairerPhone"
                  value={formData.repairerPhone}
                  onChange={(e) =>
                    handleChange("repairerPhone", e.target.value)
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="repairerAddress">Repairer's Address</Label>
                <Input
                  id="repairerAddress"
                  value={formData.repairerAddress}
                  onChange={(e) =>
                    handleChange("repairerAddress", e.target.value)
                  }
                />
              </div>
              <div>
                <Label className="mb-2 block">
                  Is the vehicle still in use?
                </Label>
                <RadioGroup
                  value={
                    formData.isVehicleInUse === null
                      ? ""
                      : formData.isVehicleInUse
                      ? "yes"
                      : "no"
                  }
                  onValueChange={(value) =>
                    handleChange("isVehicleInUse", value === "yes")
                  }
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="in-use-yes" />
                    <Label htmlFor="in-use-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="in-use-no" />
                    <Label htmlFor="in-use-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Damage to Goods Section */}
          <div>
            <h4 className="text-md font-semibold text-neutral-800 border-t pt-6">
              Damage to Goods Carried
            </h4>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label className="mb-2 block">Were goods damaged?</Label>
                <RadioGroup
                  value={formData.damage.goodsDamaged ? "yes" : "no"}
                  onValueChange={(value) =>
                    handleDamageChange("goodsDamaged", value === "yes")
                  }
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="goods-yes" />
                    <Label htmlFor="goods-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="goods-no" />
                    <Label htmlFor="goods-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label className="mb-2 block">Was a trailer attached?</Label>
                <RadioGroup
                  value={formData.wasTrailerAttached ? "yes" : "no"}
                  onValueChange={(value) =>
                    handleChange("wasTrailerAttached", value === "yes")
                  }
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="trailer-yes" />
                    <Label htmlFor="trailer-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="trailer-no" />
                    <Label htmlFor="trailer-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            {formData.damage.goodsDamaged && (
              <div className="space-y-4 mt-4 pt-4 border-t">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="goodsOwnerName">
                      Name of owner of goods
                    </Label>
                    <Input
                      id="goodsOwnerName"
                      value={formData.goodsOwnerName}
                      onChange={(e) =>
                        handleChange("goodsOwnerName", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="loadWeight">Weight of load</Label>
                    <Input
                      id="loadWeight"
                      value={formData.loadWeight}
                      onChange={(e) =>
                        handleChange("loadWeight", e.target.value)
                      }
                      placeholder="e.g., 7830 kgs"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="goodsDescription">Description of goods</Label>
                  <Textarea
                    id="goodsDescription"
                    value={formData.damage.goodsDescription}
                    onChange={(e) =>
                      handleDamageChange("goodsDescription", e.target.value)
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CARD: DAMAGE TO THIRD PARTY PROPERTY */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Damage to Third Party Property</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                addListItem("thirdPartyProperties", {
                  ownerName: "",
                  ownerAddress: "",
                  propertyDescription: "",
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Add Property
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.thirdPartyProperties || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No third party property damage reported.
            </p>
          ) : (
            (formData.thirdPartyProperties || []).map((prop: any, index: number) => (
              <div
                key={index}
                className="border p-4 rounded-md relative bg-muted/30"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 text-destructive"
                  onClick={() => removeListItem("thirdPartyProperties", index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Owner Name & Address</Label>
                    <Input
                      value={prop.ownerName}
                      onChange={(e) =>
                        updateListItem(
                          "thirdPartyProperties",
                          index,
                          "ownerName",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Property Damaged</Label>
                    <Textarea
                      value={prop.propertyDescription}
                      onChange={(e) =>
                        updateListItem(
                          "thirdPartyProperties",
                          index,
                          "propertyDescription",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* CARD: PERSONS INJURED */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Persons Injured</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                addListItem("injuredPersons", {
                  personName: "",
                  personAddress: "",
                  relationshipToInsured: "",
                  vehicleRegNo: "",
                  apparentInjuries: "",
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Add Person
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.injuredPersons || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No persons reported injured.
            </p>
          ) : (
            (formData.injuredPersons || []).map((person: any, index: number) => (
              <div
                key={index}
                className="border p-4 rounded-md relative bg-muted/30"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 text-destructive"
                  onClick={() => removeListItem("injuredPersons", index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name & Address</Label>
                    <Input
                      value={person.personName}
                      onChange={(e) =>
                        updateListItem(
                          "injuredPersons",
                          index,
                          "personName",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Relationship to Insured</Label>
                    <Input
                      value={person.relationshipToInsured}
                      onChange={(e) =>
                        updateListItem(
                          "injuredPersons",
                          index,
                          "relationshipToInsured",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Reg. No. of Vehicle (If passenger)</Label>
                    <Input
                      value={person.vehicleRegNo}
                      onChange={(e) =>
                        updateListItem(
                          "injuredPersons",
                          index,
                          "vehicleRegNo",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Apparent Injuries</Label>
                    <Textarea
                      value={person.apparentInjuries}
                      onChange={(e) =>
                        updateListItem(
                          "injuredPersons",
                          index,
                          "apparentInjuries",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* CARD: PASSENGERS IN YOUR VEHICLE */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Passengers In Your Vehicle</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                addListItem("passengers", {
                  passengerName: "",
                  passengerAddress: "",
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Add Passenger
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.passengers || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No passengers to report.
            </p>
          ) : (
            (formData.passengers || []).map((passenger: any, index: number) => (
              <div
                key={index}
                className="border p-4 rounded-md relative bg-muted/30"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 text-destructive"
                  onClick={() => removeListItem("passengers", index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={passenger.passengerName}
                      onChange={(e) =>
                        updateListItem(
                          "passengers",
                          index,
                          "passengerName",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input
                      value={passenger.passengerAddress}
                      onChange={(e) =>
                        updateListItem(
                          "passengers",
                          index,
                          "passengerAddress",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* CARD: INDEPENDENT WITNESSES */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Independent Witnesses</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                addListItem("witnesses", {
                  witnessName: "",
                  witnessAddress: "",
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Add Witness
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.witnesses || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No independent witnesses to report.
            </p>
          ) : (
            (formData.witnesses || []).map((witness: any, index: number) => (
              <div
                key={index}
                className="border p-4 rounded-md relative bg-muted/30"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 text-destructive"
                  onClick={() => removeListItem("witnesses", index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={witness.witnessName}
                      onChange={(e) =>
                        updateListItem(
                          "witnesses",
                          index,
                          "witnessName",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input
                      value={witness.witnessAddress}
                      onChange={(e) =>
                        updateListItem(
                          "witnesses",
                          index,
                          "witnessAddress",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Simplified Capture Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs
            value={captureMode}
            onValueChange={(v) => setCaptureMode(v as "photo" | "video")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="photo">
                <ImageIcon className="h-4 w-4 mr-2" />
                Photos
              </TabsTrigger>
              <TabsTrigger value="video">
                <Video className="h-4 w-4 mr-2" />
                360° Video
              </TabsTrigger>
            </TabsList>

            {/* Photo Mode - Simple 4 Views */}
            <TabsContent value="photo" className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Capture your vehicle from these 4 essential angles for
                  complete documentation.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {ESSENTIAL_VIEWS.map((view) => (
                  <ObjectUploader
                    key={view.id}
                    maxNumberOfFiles={1}
                    maxFileSize={10485760}
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleMediaUploadComplete(view.id, "image")}
                    buttonClassName="w-full h-full"
                  >
                    <Card
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        uploadedMedia[view.id]
                          ? "border-green-500 bg-green-50"
                          : "border-2 border-dashed hover:border-primary"
                      )}
                    >
                      <CardContent className="p-4 text-center">
                        {uploadedMedia[view.id] ? (
                          <>
                            <div className="relative w-full h-28 mb-2 rounded overflow-hidden bg-neutral-100">
                              <img
                                src={uploadedMedia[view.id].url}
                                alt={view.label}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.querySelector('.fallback')?.classList.remove('hidden');
                                }}
                              />
                              <div className="fallback hidden flex items-center justify-center w-full h-full absolute inset-0">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                              </div>
                            </div>
                            <p className="font-semibold text-green-700 text-sm">
                              {view.label}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              Uploaded - Click to replace
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="text-4xl mb-3">{view.icon}</div>
                            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="font-semibold">{view.label}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {view.description}
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </ObjectUploader>
                ))}
              </div>

              {uploadProgress.isPhotoComplete && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    All essential photos captured! You can now run AI analysis
                    or switch to video mode for additional documentation.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Video Mode - 360° Coverage */}
            <TabsContent value="video" className="space-y-6">
              <Alert className="border-blue-200 bg-blue-50">
                <RotateCw className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">
                  360° Video Documentation
                </AlertTitle>
                <AlertDescription className="text-blue-700 mt-2">
                  Record a complete walk-around video of your vehicle. This
                  ensures comprehensive coverage of all damage from every angle.
                </AlertDescription>
              </Alert>

              {/* 360° Coverage Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCheck className="h-5 w-5" />
                    360° Coverage Checklist
                  </CardTitle>
                  <CardDescription>
                    Ensure your video meets these requirements for complete
                    coverage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {VIDEO_CHECKLIST.map((item, index) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <Checkbox
                          id={item.id}
                          checked={videoChecklist[item.id] || false}
                          onCheckedChange={() => handleChecklistToggle(item.id)}
                        />
                        <Label
                          htmlFor={item.id}
                          className="text-sm font-normal cursor-pointer flex items-center gap-2"
                        >
                          <span className="font-mono text-xs text-muted-foreground">
                            {index + 1}.
                          </span>
                          {item.label}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {/* Coverage Indicator */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Coverage Quality
                      </span>
                      <Badge
                        variant={
                          uploadProgress.videoChecklistComplete
                            ? "default"
                            : "secondary"
                        }
                      >
                        {Object.values(videoChecklist).filter(Boolean).length}/
                        {VIDEO_CHECKLIST.length} Complete
                      </Badge>
                    </div>
                    <Progress
                      value={
                        (Object.values(videoChecklist).filter(Boolean).length /
                          VIDEO_CHECKLIST.length) *
                        100
                      }
                      className="h-2"
                    />
                    {uploadProgress.videoChecklistComplete && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Ready for 360° video upload
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Video Upload */}
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={104857600}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleMediaUploadComplete("VIDEO_360", "video")}
                buttonClassName="w-full"
              >
                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg",
                    uploadedMedia["VIDEO_360"]
                      ? "border-green-500 bg-green-50"
                      : "border-2 border-dashed hover:border-primary"
                  )}
                >
                  <CardContent className="py-12 text-center">
                    {uploadedMedia["VIDEO_360"] ? (
                      <>
                        <PlayCircle className="h-16 w-16 text-green-600 mx-auto mb-3" />
                        <p className="text-lg font-semibold text-green-700">
                          360° Video Uploaded
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          Complete vehicle coverage captured
                        </p>
                      </>
                    ) : (
                      <>
                        <Video className="h-16 w-16 text-muted-foreground mx-auto mb-3" />
                        <p className="text-lg font-semibold">
                          Upload 360° Walk-around Video
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          MP4 or MOV • Max 100MB
                        </p>
                        {!uploadProgress.videoChecklistComplete && (
                          <p className="text-xs text-orange-600 mt-3 flex items-center justify-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Complete checklist before uploading
                          </p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </ObjectUploader>

              {/* Visual Guide for 360° Coverage */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <RotateCw className="h-5 w-5 text-blue-600" />
                    How to Capture 360° Coverage
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {[
                      { step: "1", label: "Start at Front", icon: "🚗" },
                      { step: "2", label: "Move Right", icon: "➡️" },
                      { step: "3", label: "Continue to Rear", icon: "🚙" },
                      { step: "4", label: "Complete Circle", icon: "⬅️" },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-center text-center"
                      >
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <Badge variant="outline" className="mb-1">
                          {item.step}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {item.label}
                        </p>
                        {index < 3 && (
                          <ArrowRight className="h-4 w-4 text-blue-400 mt-2 hidden sm:block" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Analysis Section */}
      {(uploadProgress.isPhotoComplete || uploadProgress.hasVideo) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Damage Analysis
              </CardTitle>
              <Button
                onClick={() => analyzeWithAIMutation.mutate()}
                disabled={analyzeWithAIMutation.isPending || isAnalyzing}
              >
                {analyzeWithAIMutation.isPending || isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Run Analysis"
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Analyzing damage with computer vision...
                </p>
              </div>
            ) : aiUnavailable ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>AI Analysis Unavailable</AlertTitle>
                <AlertDescription>
                  AI damage detection requires a Roboflow API key. Please add your{" "}
                  <strong>ROBOFLOW_API_KEY</strong> environment variable to enable
                  automated damage analysis.
                </AlertDescription>
              </Alert>
            ) : aiAnalysisResults.length > 0 ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {aiAnalysisResults.length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Damage Points
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        Medium
                      </div>
                      <p className="text-xs text-muted-foreground">Severity</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        88%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Confidence
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Detected Issues */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Detected Damage</h4>
                  {aiAnalysisResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium">
                            {result.damageType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Confidence: {Math.round(result.confidence * 100)}%
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          result.severity === "high"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {result.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">
                  Click "Run Analysis" to detect damage using AI
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}