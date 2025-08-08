import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useStandaloneAuth } from "@/hooks/useStandaloneAuth";
import { useToast } from "@/hooks/use-toast";
import { useDraftManager } from "@/hooks/useDraftManager";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Clock } from "lucide-react";
import ProgressBar from "@/components/claim-form/progress-bar";
import PolicyDetailsStep from "@/components/claim-form/policy-details-step";
import VehicleAccidentStep from "@/components/claim-form/vehicle-accident-step";
import DamageAssessmentStep from "@/components/claim-form/damage-assessment-step";
import DriverDeclarationStep from "@/components/claim-form/driver-declaration-step";

export default function ClaimForm() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useStandaloneAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [claimId, setClaimId] = useState<string | null>(id || null);
  
  // Draft management
  const { 
    currentDraft, 
    isLoadingDraft, 
    isSaving, 
    saveDraft, 
    getProgress, 
    getCurrentStep, 
    getLastSaved 
  } = useDraftManager(claimId || undefined);
  const [formData, setFormData] = useState({
    // Policy details
    branchName: "",
    agentName: "",
    policyNumber: "",
    lastPaymentDate: "",
    insuredType: "individual" as "individual" | "corporate",
    
    // Individual details
    individual: {
      firstName: "",
      middleName: "",
      surname: "",
      idNumber: "",
      nationality: "",
      dateOfBirth: "",
      pinNumber: "",
      occupation: "",
      residentialPhone: "",
      officePhone: "",
      mobile: "",
      postalAddress: "",
      postalCode: "",
      physicalAddress: "",
      email: "",
      tradeBusiness: "",
    },
    
    // Corporate details
    corporate: {
      registeredName: "",
      registrationNumber: "",
      countryOfRegistration: "",
      pinNumber: "",
      vatRegNumber: "",
      officePhone: "",
      mobileContact: "",
      postalAddress: "",
      postalCode: "",
      physicalAddress: "",
      email: "",
      tradeBusiness: "",
      yearsInOperation: "",
    },
    
    // Vehicle details
    vehicle: {
      make: "",
      model: "",
      yearOfManufacture: null as number | null,
      registrationNumber: "",
      carryingCapacity: "",
      loadingCapacity: "",
      ownerName: "",
      ownerAddress: "",
      vehicleUse: "",
    },
    
    // Accident details
    accident: {
      date: "",
      time: "",
      location: "",
      description: "",
    },
    
    // Damage details
    damage: {
      vehicleDescription: "",
      goodsDamaged: false,
      goodsDescription: "",
    },
    
    // Driver details
    driver: {
      name: "",
      occupation: "",
      address: "",
      dateOfBirth: "",
      telephone: "",
      licenseNumber: "",
      employedByInsured: null as boolean | null,
      drivingWithPermission: null as boolean | null,
      yearsOfDriving: null as number | null,
      blameToBareForAccident: null as boolean | null,
      admittedLiability: null as boolean | null,
      previousAccidents: null as boolean | null,
      previousAccidentsDetails: "",
      convictions: null as boolean | null,
      convictionsDetails: "",
      licenseType: "",
      drivingTestPassedDate: "",
      ownsMotorVehicle: null as boolean | null,
      ownVehicleInsurer: "",
      ownVehiclePolicyNumber: "",
    },
    
    // Bank details
    bank: {
      bankName: "",
      accountName: "",
      accountNumber: "",
      branch: "",
      swiftCode: "",
      sortCode: "",
    },
    
    // Other vehicles
    otherVehicles: [] as Array<{
      id?: string;
      ownerName: string;
      ownerAddress: string;
      registrationNumber: string;
      insurer: string;
    }>,
  });

  // Restore draft data when loading a draft claim
  useEffect(() => {
    if (currentDraft && !isLoadingDraft && typeof currentDraft === 'object') {
      console.log("Loading draft data:", currentDraft); // Debug log
      setCurrentStep(getCurrentStep(currentDraft));
      
      // Only restore the basic claim fields, not the detailed sections if they're null
      // This prevents overwriting user input with empty strings
      setFormData(prev => ({
        ...prev,
        branchName: (currentDraft as any).branchName || prev.branchName,
        agentName: (currentDraft as any).agentName || prev.agentName,
        policyNumber: (currentDraft as any).policyNumber || prev.policyNumber,
        lastPaymentDate: (currentDraft as any).lastPaymentDate || prev.lastPaymentDate,
        insuredType: (currentDraft as any).insuredType || prev.insuredType,
        // Only restore individual details if they exist in the draft
        individual: (currentDraft as any).individualDetails ? {
          firstName: (currentDraft as any).individualDetails.firstName || "",
          middleName: (currentDraft as any).individualDetails.middleName || "",
          surname: (currentDraft as any).individualDetails.surname || "",
          idNumber: (currentDraft as any).individualDetails.idNumber || "",
          nationality: (currentDraft as any).individualDetails.nationality || "",
          dateOfBirth: (currentDraft as any).individualDetails.dateOfBirth || "",
          pinNumber: (currentDraft as any).individualDetails.pinNumber || "",
          occupation: (currentDraft as any).individualDetails.occupation || "",
          residentialPhone: (currentDraft as any).individualDetails.residentialPhone || "",
          officePhone: (currentDraft as any).individualDetails.officePhone || "",
          mobile: (currentDraft as any).individualDetails.mobile || "",
          postalAddress: (currentDraft as any).individualDetails.postalAddress || "",
          postalCode: (currentDraft as any).individualDetails.postalCode || "",
          physicalAddress: (currentDraft as any).individualDetails.physicalAddress || "",
          email: (currentDraft as any).individualDetails.email || "",
          tradeBusiness: (currentDraft as any).individualDetails.tradeBusiness || "",
        } : prev.individual,
        // Only restore corporate details if they exist in the draft
        corporate: (currentDraft as any).corporateDetails ? {
          registeredName: (currentDraft as any).corporateDetails.registeredName || "",
          registrationNumber: (currentDraft as any).corporateDetails.registrationNumber || "",
          countryOfRegistration: (currentDraft as any).corporateDetails.countryOfRegistration || "",
          pinNumber: (currentDraft as any).corporateDetails.pinNumber || "",
          vatRegNumber: (currentDraft as any).corporateDetails.vatRegNumber || "",
          officePhone: (currentDraft as any).corporateDetails.officePhone || "",
          mobileContact: (currentDraft as any).corporateDetails.mobileContact || "",
          postalAddress: (currentDraft as any).corporateDetails.postalAddress || "",
          postalCode: (currentDraft as any).corporateDetails.postalCode || "",
          physicalAddress: (currentDraft as any).corporateDetails.physicalAddress || "",
          email: (currentDraft as any).corporateDetails.email || "",
          tradeBusiness: (currentDraft as any).corporateDetails.tradeBusiness || "",
          yearsInOperation: (currentDraft as any).corporateDetails.yearsInOperation || "",
        } : prev.corporate,
        // Only restore vehicle details if they exist in the draft
        vehicle: (currentDraft as any).vehicle ? {
          make: (currentDraft as any).vehicle.make || "",
          model: (currentDraft as any).vehicle.model || "",
          yearOfManufacture: (currentDraft as any).vehicle.yearOfManufacture || null,
          registrationNumber: (currentDraft as any).vehicle.registrationNumber || "",
          carryingCapacity: (currentDraft as any).vehicle.carryingCapacity || "",
          loadingCapacity: (currentDraft as any).vehicle.loadingCapacity || "",
          ownerName: (currentDraft as any).vehicle.ownerName || "",
          ownerAddress: (currentDraft as any).vehicle.ownerAddress || "",
          vehicleUse: (currentDraft as any).vehicle.vehicleUse || "",
        } : prev.vehicle,
        accident: {
          date: (currentDraft as any).accidentDate || "",
          time: (currentDraft as any).accidentTime || "",
          location: (currentDraft as any).accidentLocation || "",
          description: (currentDraft as any).accidentDescription || "",
        },
        damage: {
          vehicleDescription: (currentDraft as any).vehicleDamageDescription || "",
          goodsDamaged: (currentDraft as any).goodsDamaged || false,
          goodsDescription: (currentDraft as any).goodsDescription || "",
        },
        driver: {
          name: (currentDraft as any).driver?.name || "",
          occupation: (currentDraft as any).driver?.occupation || "",
          address: (currentDraft as any).driver?.address || "",
          dateOfBirth: (currentDraft as any).driver?.dateOfBirth || "",
          telephone: (currentDraft as any).driver?.telephone || "",
          licenseNumber: (currentDraft as any).driver?.licenseNumber || "",
          employedByInsured: (currentDraft as any).driver?.employedByInsured || null,
          drivingWithPermission: (currentDraft as any).driver?.drivingWithPermission || null,
          yearsOfDriving: (currentDraft as any).driver?.yearsOfDriving || null,
          blameToBareForAccident: (currentDraft as any).driver?.blameToBareForAccident || null,
          admittedLiability: (currentDraft as any).driver?.admittedLiability || null,
          previousAccidents: (currentDraft as any).driver?.previousAccidents || null,
          previousAccidentsDetails: (currentDraft as any).driver?.previousAccidentsDetails || "",
          convictions: (currentDraft as any).driver?.convictions || null,
          convictionsDetails: (currentDraft as any).driver?.convictionsDetails || "",
          licenseType: (currentDraft as any).driver?.licenseType || "",
          drivingTestPassedDate: (currentDraft as any).driver?.drivingTestPassedDate || "",
          ownsMotorVehicle: (currentDraft as any).driver?.ownsMotorVehicle || null,
          ownVehicleInsurer: (currentDraft as any).driver?.ownVehicleInsurer || "",
          ownVehiclePolicyNumber: (currentDraft as any).driver?.ownVehiclePolicyNumber || "",
        },
        bank: {
          bankName: (currentDraft as any).bankDetails?.bankName || "",
          accountName: (currentDraft as any).bankDetails?.accountName || "",
          accountNumber: (currentDraft as any).bankDetails?.accountNumber || "",
          branch: (currentDraft as any).bankDetails?.branch || "",
          swiftCode: (currentDraft as any).bankDetails?.swiftCode || "",
          sortCode: (currentDraft as any).bankDetails?.sortCode || "",
        },
        otherVehicles: (currentDraft as any).otherVehicles || [],
      }));

      if (claimId) {
        toast({
          title: "Draft Restored",
          description: `Continuing from step ${getCurrentStep(currentDraft)} where you left off.`,
          variant: "default",
        });
      }
    }
  }, [currentDraft, isLoadingDraft, getCurrentStep, claimId, toast]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit a claim.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const totalSteps = 4;
  
  // Calculate progress percentage
  const calculateProgress = useCallback(() => {
    return Math.round((currentStep / totalSteps) * 100);
  }, [currentStep, totalSteps]);

  // Auto-save draft when form data changes
  const autoSave = useCallback(() => {
    if (!claimId) return;
    
    const progressPercentage = calculateProgress();
    const dataToSave = {
      // Policy details
      branchName: formData.branchName,
      agentName: formData.agentName,
      policyNumber: formData.policyNumber,
      lastPaymentDate: formData.lastPaymentDate,
      insuredType: formData.insuredType,
      // Accident details
      accidentDate: formData.accident.date,
      accidentTime: formData.accident.time,
      accidentLocation: formData.accident.location,
      accidentDescription: formData.accident.description,
      // Damage details
      vehicleDamageDescription: formData.damage.vehicleDescription,
      goodsDamaged: formData.damage.goodsDamaged,
      goodsDescription: formData.damage.goodsDescription,
    };
    
    saveDraft(claimId, currentStep, dataToSave, progressPercentage);
  }, [claimId, currentStep, formData, saveDraft, calculateProgress]);

  // Manual save button handler
  const handleSaveDraft = () => {
    autoSave();
  };

  const handleBackToLanding = () => {
    setLocation("/");
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // Auto-save when moving to next step
      if (claimId) {
        autoSave();
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      // Auto-save when moving to previous step
      if (claimId) {
        autoSave();
      }
    }
  };

  const handleSubmitClaim = async () => {
    if (!claimId) {
      toast({
        title: "Error",
        description: "No claim ID found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Submit the claim (change status from draft to submitted)
      const response = await apiRequest('POST', `/api/claims/${claimId}/submit`);
      const result = await response.json();
      
      toast({
        title: "Claim Submitted Successfully",
        description: "Your claim has been submitted for review. You will receive updates via email.",
      });
      
      // Redirect to dashboard after successful submission
      setTimeout(() => {
        setLocation("/");
      }, 1500);
      
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      console.error("Error submitting claim:", error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your claim. Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  // Auto-save functionality
  useEffect(() => {
    // Auto-save disabled temporarily to prevent form clearing
    // const autoSave = setInterval(() => {
    //   // Auto-save logic would be implemented here
    //   console.log("Auto-saving form data...");
    // }, 30000);

    // return () => clearInterval(autoSave);
  }, [formData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Progress Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToLanding}
                className="text-neutral-600 hover:text-neutral-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              
              {/* Draft status indicator */}
              {claimId && (
                <div className="flex items-center space-x-2 text-sm text-neutral-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {getLastSaved(currentDraft) 
                      ? `Last saved: ${getLastSaved(currentDraft)?.toLocaleTimeString()}`
                      : 'Draft not saved'
                    }
                  </span>
                  {isSaving && <span className="text-blue-600">Saving...</span>}
                </div>
              )}
            </div>
            
            {/* Save draft button */}
            <div className="flex items-center space-x-2">
              {claimId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="text-neutral-700 hover:text-neutral-900"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
              )}
              
              <div className="text-sm text-neutral-600">
                Step {currentStep} of {totalSteps} ({calculateProgress()}% complete)
              </div>
            </div>
          </div>
          
          <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {currentStep === 1 && (
          <PolicyDetailsStep
            formData={formData}
            setFormData={setFormData}
            claimId={claimId}
            setClaimId={setClaimId}
          />
        )}
        {currentStep === 2 && (
          <VehicleAccidentStep
            formData={formData}
            setFormData={setFormData}
            claimId={claimId}
          />
        )}
        {currentStep === 3 && (
          <DamageAssessmentStep
            formData={formData}
            setFormData={setFormData}
            claimId={claimId}
          />
        )}
        {currentStep === 4 && (
          <DriverDeclarationStep
            formData={formData}
            setFormData={setFormData}
            claimId={claimId}
          />
        )}

        {/* Form Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-neutral-200">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <div className="flex space-x-4">
            <Button variant="outline">
              Save Draft
            </Button>
            {currentStep < totalSteps ? (
              <Button onClick={handleNextStep}>
                Next
                <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
              </Button>
            ) : (
              <Button onClick={handleSubmitClaim} className="bg-secondary hover:bg-green-600">
                Submit Claim
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
