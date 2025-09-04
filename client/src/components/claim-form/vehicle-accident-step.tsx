import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Upload, FileText, CheckCircle } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

interface VehicleAccidentStepProps {
  formData: any;
  setFormData: (data: any) => void;
  claimId: string | null;
}

export default function VehicleAccidentStep({ 
  formData, 
  setFormData, 
  claimId 
}: VehicleAccidentStepProps) {
  const { toast } = useToast();
  const [uploadedDocuments, setUploadedDocuments] = useState<{[key: string]: boolean}>({});

  // Auto-save vehicle details
  const saveVehicleMutation = useMutation({
    mutationFn: async (vehicleData: any) => {
      if (!claimId) throw new Error("No claim ID");
      await apiRequest("POST", `/api/claims/${claimId}/vehicle`, vehicleData);
    },
    onError: (error) => {
      console.error("Error saving vehicle details:", error);
    },
  });

  // Auto-save accident details
  const saveAccidentMutation = useMutation({
    mutationFn: async (accidentData: any) => {
      if (!claimId) throw new Error("No claim ID");
      // Map form field names to database field names
      const mappedData = {
        accidentDate: accidentData.date,
        accidentTime: accidentData.time,
        accidentLocation: accidentData.location,
        accidentDescription: accidentData.description,
      };
      await apiRequest("PUT", `/api/claims/${claimId}`, mappedData);
    },
    onError: (error) => {
      console.error("Error saving accident details:", error);
    },
  });

  // Auto-save other vehicles
  const addOtherVehicleMutation = useMutation({
    mutationFn: async (vehicleData: any) => {
      if (!claimId) throw new Error("No claim ID");
      await apiRequest("POST", `/api/claims/${claimId}/other-vehicles`, vehicleData);
    },
    onError: (error) => {
      console.error("Error adding other vehicle:", error);
      toast({
        title: "Error",
        description: "Failed to save vehicle details.",
        variant: "destructive",
      });
    },
  });

  // Document upload mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ documentUrl, documentType }: { documentUrl: string; documentType: string }) => {
      if (!claimId) throw new Error("No claim ID");
      const response = await apiRequest("POST", `/api/claims/${claimId}/documents`, {
        documentUrl,
        documentType,
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      setUploadedDocuments(prev => ({ ...prev, [variables.documentType]: true }));
      toast({
        title: "Document Uploaded",
        description: "Document uploaded successfully.",
      });
    },
    onError: (error) => {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-save is now handled by the parent claim-form component
  // This prevents form clearing and provides enterprise-grade persistence
  // with local backup, conflict resolution, and debounced saves
  
  // Save vehicle details when they change (individual API call for immediate feedback)
  useEffect(() => {
    if (claimId && formData.vehicle.make) {
      const vehicleData = {
        ...formData.vehicle,
        yearOfManufacture: formData.vehicle.yearOfManufacture ? parseInt(formData.vehicle.yearOfManufacture) : null,
      };
      saveVehicleMutation.mutate(vehicleData);
    }
  }, [claimId, formData.vehicle.make, formData.vehicle.model]); // Only trigger on key fields

  // Note: Accident details are auto-saved through the main persistence system

  const handleVehicleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      vehicle: {
        ...prev.vehicle,
        [field]: value,
      },
    }));
  };

  const handleAccidentChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      accident: {
        ...prev.accident,
        [field]: value,
      },
    }));
  };

  const addOtherVehicle = () => {
    const newVehicle = {
      ownerName: "",
      ownerAddress: "",
      registrationNumber: "",
      insurer: "",
    };
    
    setFormData((prev: any) => ({
      ...prev,
      otherVehicles: [...prev.otherVehicles, newVehicle],
    }));
  };

  const removeOtherVehicle = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      otherVehicles: prev.otherVehicles.filter((_: any, i: number) => i !== index),
    }));
  };

  const updateOtherVehicle = (index: number, field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      otherVehicles: prev.otherVehicles.map((vehicle: any, i: number) =>
        i === index ? { ...vehicle, [field]: value } : vehicle
      ),
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

  const handleDocumentUploadComplete = (documentType: string) => 
    (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
      if (result.successful && result.successful[0]) {
        const uploadURL = result.successful[0].uploadURL as string;
        uploadDocumentMutation.mutate({
          documentUrl: uploadURL,
          documentType,
        });
      }
    };

  return (
    <Card className="shadow-sm border-neutral-200">
      <CardHeader>
        <CardTitle className="text-2xl text-neutral-800">Section B: Vehicle & Accident Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Vehicle Details */}
        <div>
          <h4 className="text-lg font-semibold text-neutral-800 mb-4">Vehicle Information</h4>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="make">
                Make <span className="text-accent">*</span>
              </Label>
              <Input
                id="make"
                value={formData.vehicle.make}
                onChange={(e) => handleVehicleChange('make', e.target.value)}
                placeholder="e.g., Toyota"
                required
              />
            </div>
            <div>
              <Label htmlFor="model">
                Model <span className="text-accent">*</span>
              </Label>
              <Input
                id="model"
                value={formData.vehicle.model}
                onChange={(e) => handleVehicleChange('model', e.target.value)}
                placeholder="e.g., Camry"
                required
              />
            </div>
            <div>
              <Label htmlFor="year">Year of Manufacture</Label>
              <Input
                id="year"
                type="number"
                min="1980"
                max="2024"
                value={formData.vehicle.yearOfManufacture || ''}
                onChange={(e) => handleVehicleChange('yearOfManufacture', e.target.value)}
                placeholder="2020"
              />
            </div>
          </div>
        </div>

        {/* Accident Details */}
        <div>
          <h4 className="text-lg font-semibold text-neutral-800 mb-4">Accident Information</h4>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label htmlFor="accidentDate">
                Date of Accident <span className="text-accent">*</span>
              </Label>
              <Input
                id="accidentDate"
                type="date"
                value={formData.accident.date}
                onChange={(e) => handleAccidentChange('date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="accidentTime">Time of Accident</Label>
              <Input
                id="accidentTime"
                type="time"
                value={formData.accident.time}
                onChange={(e) => handleAccidentChange('time', e.target.value)}
              />
            </div>
          </div>
          <div className="mb-6">
            <Label htmlFor="location">
              Location of Accident <span className="text-accent">*</span>
            </Label>
            <Input
              id="location"
              value={formData.accident.location}
              onChange={(e) => handleAccidentChange('location', e.target.value)}
              placeholder="Provide detailed location"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">
              Description of What Happened <span className="text-accent">*</span>
            </Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.accident.description}
              onChange={(e) => handleAccidentChange('description', e.target.value)}
              placeholder="Please provide a detailed description of how the accident occurred..."
              required
            />
          </div>
        </div>

        {/* Supporting Documents */}
        <div>
          <h4 className="text-lg font-semibold text-neutral-800 mb-4">Supporting Documents</h4>
          <p className="text-sm text-neutral-600 mb-4">Upload relevant documents for your vehicle and accident claim</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-neutral-600" />
                  <span className="font-medium">Vehicle Registration</span>
                </div>
                {uploadedDocuments.registration && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
              <p className="text-sm text-neutral-600 mb-3">Upload your vehicle registration document</p>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={5242880}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleDocumentUploadComplete('registration')}
                buttonClassName={uploadedDocuments.registration ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadedDocuments.registration ? "Replace Document" : "Upload Document"}
              </ObjectUploader>
            </div>

            <div className="border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-neutral-600" />
                  <span className="font-medium">Insurance Policy</span>
                </div>
                {uploadedDocuments.insurance && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
              <p className="text-sm text-neutral-600 mb-3">Upload your current insurance policy document</p>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={5242880}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleDocumentUploadComplete('insurance')}
                buttonClassName={uploadedDocuments.insurance ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadedDocuments.insurance ? "Replace Document" : "Upload Document"}
              </ObjectUploader>
            </div>

            <div className="border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-neutral-600" />
                  <span className="font-medium">Driver's License</span>
                </div>
                {uploadedDocuments.license && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
              <p className="text-sm text-neutral-600 mb-3">Upload your driver's license</p>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={5242880}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleDocumentUploadComplete('license')}
                buttonClassName={uploadedDocuments.license ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadedDocuments.license ? "Replace Document" : "Upload Document"}
              </ObjectUploader>
            </div>

            <div className="border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-neutral-600" />
                  <span className="font-medium">Police Report (if applicable)</span>
                </div>
                {uploadedDocuments.police_report && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
              <p className="text-sm text-neutral-600 mb-3">Upload police report if available</p>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={5242880}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleDocumentUploadComplete('police_report')}
                buttonClassName={uploadedDocuments.police_report ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadedDocuments.police_report ? "Replace Document" : "Upload Document"}
              </ObjectUploader>
            </div>
          </div>
        </div>

        {/* Other Parties */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-neutral-800">Other Vehicles Involved</h4>
            <Button type="button" onClick={addOtherVehicle} className="bg-primary hover:bg-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
          <div className="space-y-4">
            {formData.otherVehicles.map((vehicle: any, index: number) => (
              <div key={index} className="border border-neutral-200 rounded-lg p-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor={`ownerName-${index}`}>Owner Name</Label>
                    <Input
                      id={`ownerName-${index}`}
                      value={vehicle.ownerName}
                      onChange={(e) => updateOtherVehicle(index, 'ownerName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`regNumber-${index}`}>Registration Number</Label>
                    <Input
                      id={`regNumber-${index}`}
                      value={vehicle.registrationNumber}
                      onChange={(e) => updateOtherVehicle(index, 'registrationNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`insurer-${index}`}>Insurer</Label>
                    <Input
                      id={`insurer-${index}`}
                      value={vehicle.insurer}
                      onChange={(e) => updateOtherVehicle(index, 'insurer', e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOtherVehicle(index)}
                      className="text-accent hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {formData.otherVehicles.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                No other vehicles added yet. Click "Add Vehicle" to include other parties involved.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
