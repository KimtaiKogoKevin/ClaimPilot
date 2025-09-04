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
  claimId,
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
      otherVehicles: prev.otherVehicles.filter(
        (_: any, i: number) => i !== index
      ),
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
        <CardTitle className="text-2xl text-neutral-800">
          Section B: Vehicle & Accident Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* VVVVVV THIS IS THE UPDATED AND REORGANIZED SECTION VVVVVV */}
        {/* Vehicle Details */}
        <div>
          <h4 className="text-lg font-semibold text-neutral-800 border-b border-neutral-200 pb-2 mb-6">
            Vehicle Information
          </h4>
          <div className="grid md:grid-cols-3 gap-6">
            {/* --- Row 1 --- */}
            <div>
              <Label htmlFor="make">
                Make <span className="text-accent">*</span>
              </Label>
              <Input
                id="make"
                value={formData.vehicle.make}
                onChange={(e) => handleVehicleChange("make", e.target.value)}
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
                onChange={(e) => handleVehicleChange("model", e.target.value)}
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
                max={new Date().getFullYear()} // Dynamically set max year
                value={formData.vehicle.yearOfManufacture || ""}
                onChange={(e) =>
                  handleVehicleChange("yearOfManufacture", e.target.value)
                }
                placeholder="e.g., 2020"
              />
            </div>

            {/* --- Row 2 --- */}
            <div>
              <Label htmlFor="registrationNumber_primemover">
                Registration (Prime Mover)
              </Label>
              <Input
                id="registrationNumber_primemover"
                value={formData.vehicle.registrationNumber_primemover}
                onChange={(e) =>
                  handleVehicleChange(
                    "registrationNumber_primemover",
                    e.target.value
                  )
                }
                placeholder="e.g., KDA 123A"
              />
            </div>
            <div>
              <Label htmlFor="registrationNumber_trailer">
                Registration (Trailer)
              </Label>
              <Input
                id="registrationNumber_trailer"
                value={formData.vehicle.registrationNumber_trailer}
                onChange={(e) =>
                  handleVehicleChange(
                    "registrationNumber_trailer",
                    e.target.value
                  )
                }
                placeholder="e.g., ZD 456B"
              />
            </div>
            <div>
              <Label htmlFor="vehicleUse">Use of Vehicle</Label>
              <Input
                id="vehicleUse"
                value={formData.vehicle.vehicleUse}
                onChange={(e) =>
                  handleVehicleChange("vehicleUse", e.target.value)
                }
                placeholder="e.g., Commercial, Personal"
              />
            </div>

            {/* --- Row 3 --- */}
            <div>
              <Label htmlFor="carryingCapacity">Carrying Capacity</Label>
              <Input
                id="carryingCapacity"
                value={formData.vehicle.carryingCapacity}
                onChange={(e) =>
                  handleVehicleChange("carryingCapacity", e.target.value)
                }
                placeholder="e.g., 5 Tons"
              />
            </div>
            <div>
              <Label htmlFor="loadingCapacity">Loading Capacity</Label>
              <Input
                id="loadingCapacity"
                value={formData.vehicle.loadingCapacity}
                onChange={(e) =>
                  handleVehicleChange("loadingCapacity", e.target.value)
                }
                placeholder="e.g., 10 Tons"
              />
            </div>
            <div>
              <Label htmlFor="ownerName">Owner's Name</Label>
              <Input
                id="ownerName"
                value={formData.vehicle.ownerName}
                onChange={(e) =>
                  handleVehicleChange("ownerName", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="ownerName">Owner's Address</Label>
              <Input
                id="ownerName"
                value={formData.vehicle.ownerAddress}
                onChange={(e) =>
                  handleVehicleChange("ownerName", e.target.value)
                }
              />
            </div>

            {/* --- Row 4 (Spanning) --- */}
            <div className="md:col-span-3">
              <Label htmlFor="ownerAddress">
                State the Exact Purpose of the vehicle
              </Label>
              <Textarea
                id="ownerAddress"
                value={formData.vehicle.vehicleuse}
                onChange={(e) =>
                  handleVehicleChange("vehicleuse", e.target.value)
                }
                placeholder="e.g was caryring bags of cement"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Accident Details */}
        {/* ... (This section is perfect as is) ... */}
        {/* Accident Details */}
        <div>
          <h4 className="text-lg font-semibold text-neutral-800 border-b border-neutral-200 pb-2 mb-6">
            Accident Information
          </h4>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label htmlFor="accidentDate">
                Date of Accident <span className="text-accent">*</span>
              </Label>
              <Input
                id="accidentDate"
                type="date"
                value={formData.accident.date}
                onChange={(e) => handleAccidentChange("date", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="accidentTime">Time of Accident</Label>
              <Input
                id="accidentTime"
                type="time"
                value={formData.accident.time}
                onChange={(e) => handleAccidentChange("time", e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="location">
                Location of Accident <span className="text-accent">*</span>
              </Label>
              <Input
                id="location"
                value={formData.accident.location}
                onChange={(e) =>
                  handleAccidentChange("location", e.target.value)
                }
                placeholder="e.g., Murototi area along Amboseli-muram road"
                required
              />
            </div>
          </div>

          {/* --- New Detailed Accident Fields --- */}
          <div className="space-y-6 mb-6">
            {/* VVVVVV STYLED ROAD SURFACE SELECTION VVVVVV */}
            <div>
              <Label className="mb-3 block font-medium">
                Type of road surface?
              </Label>
              <RadioGroup
                value={formData.accident.roadSurface}
                onValueChange={(value) =>
                  handleAccidentChange("roadSurface", value)
                }
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="dry"
                    id="road-dry"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="road-dry"
                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                  >
                    Dry
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="murram"
                    id="road-murram"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="road-murram"
                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                  >
                    Murram
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="wet"
                    id="road-wet"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="road-wet"
                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                  >
                    Wet
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* VVVVVV STYLED VISIBILITY SELECTION VVVVVV */}
            <div>
              <Label className="mb-3 block font-medium">Visibility?</Label>
              <RadioGroup
                value={formData.accident.visibility}
                onValueChange={(value) =>
                  handleAccidentChange("visibility", value)
                }
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="clear"
                    id="vis-clear"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="vis-clear"
                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                  >
                    Clear
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="poor"
                    id="vis-poor"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="vis-poor"
                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                  >
                    Poor
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="dark"
                    id="vis-dark"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="vis-dark"
                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                  >
                    Dark
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label htmlFor="driverWarningGiven">
                What warning did your driver give?
              </Label>
              <Input
                id="driverWarningGiven"
                value={formData.accident.driverWarningGiven}
                onChange={(e) =>
                  handleAccidentChange("driverWarningGiven", e.target.value)
                }
                placeholder="e.g., Hooting, Hand signal"
              />
            </div>
            <div>
              <Label htmlFor="vehicleLightsOn">
                What lights were showing on your vehicle?
              </Label>
              <Input
                id="vehicleLightsOn"
                value={formData.accident.vehicleLightsOn}
                onChange={(e) =>
                  handleAccidentChange("vehicleLightsOn", e.target.value)
                }
                placeholder="e.g., Headlights, Indicators"
              />
            </div>
          </div>

          {/* --- Police Information with Conditional Logic --- */}
          <div className="space-y-4">
            <div>
              <Label className="mb-3 block font-medium">
                Did Police take particulars?
              </Label>
              <RadioGroup
                value={formData.accident.policeTookParticulars ? "yes" : "no"}
                onValueChange={(value) =>
                  handleAccidentChange("policeTookParticulars", value === "yes")
                }
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="yes"
                    id="police-yes"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="police-yes"
                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                  >
                    Yes
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="no"
                    id="police-no"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="police-no"
                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                  >
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* CONDITIONAL FIELDS */}
            {formData.accident.policeTookParticulars && (
              <div className="grid md:grid-cols-2 gap-6 p-4 border rounded-md bg-muted/30">
                <div>
                  <Label htmlFor="policeConstableNumber">
                    Constable's number
                  </Label>
                  <Input
                    id="policeConstableNumber"
                    value={formData.accident.policeConstableNumber}
                    onChange={(e) =>
                      handleAccidentChange(
                        "policeConstableNumber",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="policeStation">Police Station</Label>
                  <Input
                    id="policeStation"
                    value={formData.accident.policeStation}
                    onChange={(e) =>
                      handleAccidentChange("policeStation", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="prosecutionNotice">
                    Attach copy Notice of Intended Prosecution (if any)
                  </Label>
                  {/* NOTE: File upload is a more complex component, using a placeholder for now */}
                  <Input id="prosecutionNotice" type="file" className="mt-1" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <Label htmlFor="description">
              Description of What Happened{" "}
              <span className="text-accent">*</span>
            </Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.accident.description}
              onChange={(e) =>
                handleAccidentChange("description", e.target.value)
              }
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
        {/* ... (This section is perfect as is) ... */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-neutral-800">
              Other Vehicles Involved
            </h4>
            <Button
              type="button"
              onClick={addOtherVehicle}
              className="bg-primary hover:bg-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
          <div className="space-y-4">
            {formData.otherVehicles.map((vehicle: any, index: number) => (
              <div
                key={index}
                className="border border-neutral-200 rounded-lg p-4"
              >
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor={`ownerName-${index}`}>Owner Name</Label>
                    <Input
                      id={`ownerName-${index}`}
                      value={vehicle.ownerName}
                      onChange={(e) =>
                        updateOtherVehicle(index, "ownerName", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`regNumber-${index}`}>
                      Registration Number
                    </Label>
                    <Input
                      id={`regNumber-${index}`}
                      value={vehicle.registrationNumber}
                      onChange={(e) =>
                        updateOtherVehicle(
                          index,
                          "registrationNumber",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`insurer-${index}`}>Insurer</Label>
                    <Input
                      id={`insurer-${index}`}
                      value={vehicle.insurer}
                      onChange={(e) =>
                        updateOtherVehicle(index, "insurer", e.target.value)
                      }
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
                No other vehicles added yet. Click "Add Vehicle" to include
                other parties involved.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
