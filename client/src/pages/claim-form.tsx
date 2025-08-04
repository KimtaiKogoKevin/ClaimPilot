import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ProgressBar from "@/components/claim-form/progress-bar";
import PolicyDetailsStep from "@/components/claim-form/policy-details-step";
import VehicleAccidentStep from "@/components/claim-form/vehicle-accident-step";
import DamageAssessmentStep from "@/components/claim-form/damage-assessment-step";
import DriverDeclarationStep from "@/components/claim-form/driver-declaration-step";

export default function ClaimForm() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [claimId, setClaimId] = useState<string | null>(id || null);
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

  const handleBackToLanding = () => {
    setLocation("/");
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
      const response = await fetch(`/api/claims/${claimId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
    const autoSave = setInterval(() => {
      // Auto-save logic would be implemented here
      console.log("Auto-saving form data...");
    }, 30000);

    return () => clearInterval(autoSave);
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
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={handleBackToLanding}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">New Claim Submission</h2>
            </div>
            <div className="text-sm text-neutral-600">
              Auto-saved <span className="text-secondary">2 minutes ago</span>
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
