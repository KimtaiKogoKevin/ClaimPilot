import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useStandaloneAuth } from "@/hooks/useStandaloneAuth";
import { useToast } from "@/hooks/use-toast";
import { useDraftManager } from "@/hooks/useDraftManager";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Clock, Type } from "lucide-react";
import ProgressBar from "@/components/claim-form/progress-bar";
import { DraftPersistenceManager } from "@/lib/draftPersistence";
import { calculateFormProgress, transformFormDataForAPI, restoreFormDataFromAPI } from "@/lib/formPersistenceUtils";
import { validateStep } from "@/lib/formValidation";
import PolicyDetailsStep from "@/components/claim-form/policy-details-step";
import VehicleAccidentStep from "@/components/claim-form/vehicle-accident-step";
import EnhancedDamageAssessment from "@/components/claim-form/enhanced-damage-assessment";
import DriverDeclarationStep from "@/components/claim-form/driver-declaration-step";

export default function ClaimForm() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  // Remove duplicate auth hook usage - auth is handled by App.tsx
  // const { isAuthenticated, isLoading } = useStandaloneAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [claimId, setClaimId] = useState<string | null>(id || null);
  const [hasShownRestoreNotification, setHasShownRestoreNotification] = useState(false);
  const [hasRestoredFromDraft, setHasRestoredFromDraft] = useState(false);
  const persistenceManagerRef = useRef<DraftPersistenceManager | null>(null);
  
  // Draft management with enterprise-grade persistence
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
    typeOfCover: "",
    insuredType: "individual" as "individual" | "corporate",
    financeCompanyName: "",
    hasOtherInsurance: false,
    otherInsuranceDetails: "",
    hasLoanRepaymentCover: false,
    loanPrincipalAmount: null as number | null,
    loanInterestAmount: null as number | null,
    monthlyInstalment: null as number | null,
    loanCoveragePercentage: null as number | null,

    inspectionLocation: "",
    repairerName: "",
    repairerAddress: "",
    repairerPhone: "",
    isVehicleInUse: null as boolean | null,
    goodsOwnerName: "",
    wasTrailerAttached: false,
    loadWeight: "",

    thirdPartyProperties: [] as Array<{
      ownerName: string;
      ownerAddress: string;
      propertyDescription: string;
    }>,
    injuredPersons: [] as Array<{
      personName: string;
      personAddress: string;
      relationshipToInsured: string;
      vehicleRegNo: string;
      apparentInjuries: string;
    }>,
    passengers: [] as Array<{
      passengerName: string;
      passengerAddress: string;
    }>,
    witnesses: [] as Array<{
      witnessName: string;
      witnessAddress: string;
    }>,
    ownerStatement: "",
    declarationName: "",
    declarationTitle: "",
    declarationAccepted: false,

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
      ageBand: "",
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
      registrationNumber_primemover: "",
      registrationNumber_trailer: "",
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
      roadSurface: "", // 'dry', 'murram', 'wet'
      visibility: "", // 'clear', 'poor', 'dark'
      driverWarningGiven: "",
      vehicleLightsOn: "",
      policeTookParticulars: false,
      policeConstableNumber: "",
      policeStation: "",
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
      yearsInService: "",
      employedByInsured: null as boolean | null,
      drivingWithPermission: null as boolean | null,
      yearsOfDriving: null as number | null,
      blameToBareForAccident: null as boolean | null,
      admittedLiability: null as boolean | null,
      previousAccidents: null as boolean | null,
      previousAccidentsDetails: "",
      convictions: null as boolean | null,
      convictionsDetails: "",
      licenseNumber: "",
      licenseType: "", // "Full" or "Provisional"
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
    // Only restore if we haven't already restored from this draft
    if (currentDraft && !isLoadingDraft && typeof currentDraft === 'object' && !hasRestoredFromDraft) {
      console.log("=== RESTORING DRAFT DATA ===");
      console.log("Loading draft data:", JSON.stringify(currentDraft, null, 2));
      console.log("Current form data before restore:", JSON.stringify(formData, null, 2));
      
      const savedStep = getCurrentStep(currentDraft);
      console.log("Restoring to step:", savedStep);
      setCurrentStep(savedStep);
      setHasRestoredFromDraft(true); // Mark that we've restored from this draft
      
      // Use the proper transformation function instead of manual mapping
      const restoredData = restoreFormDataFromAPI(currentDraft);
      console.log("Restored form data:", JSON.stringify(restoredData, null, 2));
      setFormData(restoredData);
      
      console.log("=== RESTORATION COMPLETE ===");
      
      // Log the restored form data after state update
      setTimeout(() => {
        console.log("=== FORM DATA AFTER RESTORATION (delayed check) ===");
      }, 100);

      // Show restoration notification only once
      if (claimId && !hasShownRestoreNotification) {
        toast({
          title: "Draft Restored",
          description: `Continuing from step ${savedStep} where you left off.`,
          variant: "default",
        });
        setHasShownRestoreNotification(true);
      }
    }
  }, [currentDraft, isLoadingDraft, getCurrentStep, claimId, toast, hasShownRestoreNotification, hasRestoredFromDraft]);

  // Initialize persistence manager
  useEffect(() => {
    if (claimId && !persistenceManagerRef.current) {
      persistenceManagerRef.current = new DraftPersistenceManager({
        claimId,
        autoSaveDelay: 2000, // 2 second debounce
        enableLocalBackup: true,
        conflictResolution: 'merge'
      });
    }
    
    return () => {
      persistenceManagerRef.current?.destroy();
    };
  }, [claimId]);

  const totalSteps = 4;
  
  // Calculate progress percentage
  const calculateProgress = useCallback(() => {
    return Math.round((currentStep / totalSteps) * 100);
  }, [currentStep, totalSteps]);

  // Smart auto-save that only saves meaningful data and never overwrites complete data with empty data
  const autoSave = useCallback(() => {
    if (!claimId) {
      console.log("No claimId, skipping auto-save");
      return;
    }
    
    // Build the data to save
    const dataToSave = {
      // Policy details
      branchName: formData.branchName || "",
      agentName: formData.agentName || "",
      policyNumber: formData.policyNumber || "",
      lastPaymentDate: formData.lastPaymentDate || "",
      typeOfCover: formData.typeOfCover || "",
      insuredType: formData.insuredType || "individual",

      // Individual details (save all individual form fields INCLUDING AGE BAND)
      individualFirstName: formData.individual?.firstName || "",
      individualMiddleName: formData.individual?.middleName || "",
      individualSurname: formData.individual?.surname || "",
      individualIdNumber: formData.individual?.idNumber || "",
      individualNationality: formData.individual?.nationality || "",
      individualDateOfBirth: formData.individual?.dateOfBirth || "",
      individualPinNumber: formData.individual?.pinNumber || "",
      individualOccupation: formData.individual?.occupation || "",
      individualResidentialPhone: formData.individual?.residentialPhone || "",
      individualOfficePhone: formData.individual?.officePhone || "",
      individualMobile: formData.individual?.mobile || "",
      individualPostalAddress: formData.individual?.postalAddress || "",
      individualPostalCode: formData.individual?.postalCode || "",
      individualPhysicalAddress: formData.individual?.physicalAddress || "",
      individualEmail: formData.individual?.email || "",
      individualTradeBusiness: formData.individual?.tradeBusiness || "",
      individualAgeBand: formData.individual?.ageBand || "", // ← CRITICAL: The missing age band field!
      // Corporate details (save all corporate form fields)
      corporateRegisteredName: formData.corporate?.registeredName || "",
      corporateRegistrationNumber: formData.corporate?.registrationNumber || "",
      corporateCountryOfRegistration: formData.corporate?.countryOfRegistration || "",
      corporatePinNumber: formData.corporate?.pinNumber || "",
      corporateVatRegNumber: formData.corporate?.vatRegNumber || "",
      corporateOfficePhone: formData.corporate?.officePhone || "",
      corporateMobileContact: formData.corporate?.mobileContact || "",
      corporatePostalAddress: formData.corporate?.postalAddress || "",
      corporatePostalCode: formData.corporate?.postalCode || "",
      corporatePhysicalAddress: formData.corporate?.physicalAddress || "",
      corporateEmail: formData.corporate?.email || "",
      corporateTradeBusiness: formData.corporate?.tradeBusiness || "",
      corporateYearsInOperation: formData.corporate?.yearsInOperation || "",
      // Accident details
      accidentDate: formData.accident?.date || "",
      accidentTime: formData.accident?.time || "",
      accidentLocation: formData.accident?.location || "",
      accidentDescription: formData.accident?.description || "",
      // Damage details
      vehicleDamageDescription: formData.damage?.vehicleDescription || "",
      goodsDamaged: formData.damage?.goodsDamaged || false,
      goodsDescription: formData.damage?.goodsDescription || "",
      // COMPLETE Vehicle details - ALL fields
      vehicleMake: formData.vehicle?.make || "",
      vehicleModel: formData.vehicle?.model || "",
      vehicleYearOfManufacture: formData.vehicle?.yearOfManufacture || null,
      vehicleRegistrationNumber_primemover: formData.vehicle?.registrationNumber_primemover || "",
      vehicleRegistrationNumber_trailer: formData.vehicle?.registrationNumber_trailer || "",
      vehicleCarryingCapacity: formData.vehicle?.carryingCapacity || "",
      vehicleLoadingCapacity: formData.vehicle?.loadingCapacity || "",
      vehicleOwnerName: formData.vehicle?.ownerName || "",
      vehicleOwnerAddress: formData.vehicle?.ownerAddress || "",
      vehicleVehicleUse: formData.vehicle?.vehicleUse || "",
      
      // COMPLETE Driver details - ALL fields
      driverName: formData.driver?.name || "",
      driverOccupation: formData.driver?.occupation || "",
      driverAddress: formData.driver?.address || "",
      driverDateOfBirth: formData.driver?.dateOfBirth || "",
      driverTelephone: formData.driver?.telephone || "",
      driverLicenseNumber: formData.driver?.licenseNumber || "",
      driverEmployedByInsured: formData.driver?.employedByInsured || false,
      driverDrivingWithPermission: formData.driver?.drivingWithPermission || false,
      driverYearsOfDriving: formData.driver?.yearsOfDriving || null,
      driverBlameToBareForAccident: formData.driver?.blameToBareForAccident || false,
      driverAdmittedLiability: formData.driver?.admittedLiability || false,
      driverPreviousAccidents: formData.driver?.previousAccidents || false,
      driverPreviousAccidentsDetails: formData.driver?.previousAccidentsDetails || "",
      driverConvictions: formData.driver?.convictions || false,
      driverConvictionsDetails: formData.driver?.convictionsDetails || "",
      driverLicenseType: formData.driver?.licenseType || "",
      driverDrivingTestPassedDate: formData.driver?.drivingTestPassedDate || "",
      driverOwnsMotorVehicle: formData.driver?.ownsMotorVehicle || false,
      driverOwnVehicleInsurer: formData.driver?.ownVehicleInsurer || "",
      driverOwnVehiclePolicyNumber: formData.driver?.ownVehiclePolicyNumber || "",
      driverYearsInService: formData.driver?.yearsInService || "",
      
      // COMPLETE Bank details - ALL fields
      bankBankName: formData.bank?.bankName || "",
      bankAccountName: formData.bank?.accountName || "",
      bankAccountNumber: formData.bank?.accountNumber || "",
      bankBranch: formData.bank?.branch || "",
      bankSwiftCode: formData.bank?.swiftCode || "",
      bankSortCode: formData.bank?.sortCode || "",
      
      // COMPLETE Accident details - ALL fields  
      accidentRoadSurface: formData.accident?.roadSurface || "",
      accidentVisibility: formData.accident?.visibility || "",
      accidentDriverWarningGiven: formData.accident?.driverWarningGiven || "",
      accidentVehicleLightsOn: formData.accident?.vehicleLightsOn || "",
      accidentPoliceTookParticulars: formData.accident?.policeTookParticulars || false,
      accidentPoliceConstableNumber: formData.accident?.policeConstableNumber || "",
      accidentPoliceStation: formData.accident?.policeStation || "",
      
      // STEP 3: Complete Damage Assessment Fields
      inspectionLocation: formData.inspectionLocation || "",
      repairerName: formData.repairerName || "",
      repairerPhone: formData.repairerPhone || "",
      repairerAddress: formData.repairerAddress || "",
      isVehicleInUse: formData.isVehicleInUse || false,
      thirdPartyProperties: JSON.stringify((formData as any).thirdPartyProperties || []),
      personsInjured: JSON.stringify((formData as any).personsInjured || []),
      
      // STEP 4: Final Declaration Fields
      ownerStatement: formData.ownerStatement || "",
      declarationName: formData.declarationName || "",
      declarationTitle: formData.declarationTitle || "",
      declarationAccepted: formData.declarationAccepted || false,
    };
    
    // Check if we have meaningful data to save (not just empty strings)
    const hasBasicPolicyData = dataToSave.branchName || dataToSave.agentName || dataToSave.policyNumber;
    const hasIndividualData = dataToSave.individualFirstName || dataToSave.individualSurname || dataToSave.individualIdNumber || dataToSave.individualAgeBand;
    const hasCorporateData = dataToSave.corporateRegisteredName || dataToSave.corporateRegistrationNumber;
    const hasAccidentData = dataToSave.accidentDate || dataToSave.accidentLocation || dataToSave.accidentDescription || dataToSave.inspectionLocation || dataToSave.repairerName;
    const hasVehicleData = dataToSave.vehicleMake || dataToSave.vehicleModel || dataToSave.vehicleRegistrationNumber_primemover || dataToSave.vehicleRegistrationNumber_trailer || dataToSave.vehicleOwnerName;
    const hasDriverData = dataToSave.driverName || dataToSave.driverLicenseNumber || dataToSave.driverAddress || dataToSave.driverOccupation || dataToSave.driverTelephone;
    const hasBankData = dataToSave.bankBankName || dataToSave.bankAccountNumber || dataToSave.bankAccountName || dataToSave.bankBranch || dataToSave.ownerStatement || dataToSave.declarationName;
    
    // Only save if we have meaningful data in at least one section
    const hasMeaningfulData = hasBasicPolicyData || hasIndividualData || hasCorporateData || hasAccidentData || hasVehicleData || hasDriverData || hasBankData;
    
    if (!hasMeaningfulData) {
      console.log("Skipping auto-save - no meaningful data to save");
      return;
    }
    
    console.log("Auto-saving form data with meaningful content...");
    console.log("🔍 DRIVER DATA DEBUG:", {
      driverObject: formData.driver,
      driverName: formData.driver?.name,
      driverLicense: formData.driver?.licenseNumber,
      flatDriverName: dataToSave.driverName,
      flatDriverLicense: dataToSave.driverLicenseNumber
    });
    console.log("🔍 BANK DATA DEBUG:", {
      bankObject: formData.bank,
      bankName: formData.bank?.bankName,
      accountNumber: formData.bank?.accountNumber,
      flatBankName: dataToSave.bankBankName,
      flatAccountNumber: dataToSave.bankAccountNumber
    });
    const progressPercentage = calculateProgress();
    
    console.log("Saving data with step:", currentStep, "Sections with data:", {
      hasBasicPolicyData,
      hasIndividualData,
      hasCorporateData,
      hasAccidentData,
      hasVehicleData,
      hasDriverData,
      hasBankData
    });
    
    saveDraft(claimId, currentStep, dataToSave, progressPercentage);
  }, [claimId, currentStep, formData, saveDraft, calculateProgress]);

  // Manual save button handler
  const handleManualSave = () => {
    console.log("Manual save triggered");
    if (!claimId) {
      console.log("No claimId for manual save");
      return;
    }
    
    autoSave();
    toast({
      title: "Draft Saved",
      description: "Your progress has been saved successfully.",
    });
  };
  const handleSaveDraft = () => {
    autoSave();
  };

  const handleBackToLanding = () => {
    setLocation("/");
  };

  const handleNextStep = () => {
    console.log("Next button clicked, current step:", currentStep, "total steps:", totalSteps);
    
    // Validate current step before proceeding
    const validation = validateStep(currentStep, formData);
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(", "),
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      console.log("Moving to next step:", nextStep);
      setCurrentStep(nextStep);
      // Auto-save when moving to next step
      if (claimId) {
        console.log("Auto-saving before moving to next step");
        autoSave();
      }
    } else {
      console.log("Already at last step, cannot proceed");
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
    
    // Validate all steps before submission
    for (let step = 1; step <= totalSteps; step++) {
      const validation = validateStep(step, formData);
      if (!validation.isValid) {
        toast({
          title: `Step ${step} Validation Error`,
          description: validation.errors.join(", "),
          variant: "destructive",
        });
        setCurrentStep(step);
        return;
      }
    }

    try {
      console.log("🔍 SUBMIT - Force-saving data before submission...");
      // CRITICAL: Force-save all current data before submitting
      autoSave();
      // Wait for save to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("🔍 SUBMIT - Current form data:", {
        driver: formData.driver,
        bank: formData.bank
      });
      
      // Transform data to match server validation requirements
      const formDataAny = formData as any;
      const submitData = {
        // Driver details - READ FROM CORRECT NESTED LOCATION
        driver: {
          name: formDataAny.driver?.name || "",
          licenseNumber: formDataAny.driver?.licenseNumber || "",
          occupation: formDataAny.driver?.occupation || "",
          address: formDataAny.driver?.address || "",
          telephone: formDataAny.driver?.telephone || "",
          dateOfBirth: formDataAny.driver?.dateOfBirth || "",
          employedByInsured: formDataAny.driver?.employedByInsured || false,
          drivingWithPermission: formDataAny.driver?.drivingWithPermission || false,
          yearsOfDriving: formDataAny.driver?.yearsOfDriving || 0,
          blameToBareForAccident: formDataAny.driver?.blameToBareForAccident || false,
          admittedLiability: formDataAny.driver?.admittedLiability || false,
          previousAccidents: formDataAny.driver?.previousAccidents || false,
          convictions: formDataAny.driver?.convictions || false,
          licenseType: formDataAny.driver?.licenseType || "",
          ownsMotorVehicle: formDataAny.driver?.ownsMotorVehicle || false,
        },
        // Bank details - READ FROM CORRECT NESTED LOCATION
        bankDetails: {
          bankName: formDataAny.bank?.bankName || "",
          accountName: formDataAny.bank?.accountName || "",
          accountNumber: formDataAny.bank?.accountNumber || "",
          branch: formDataAny.bank?.branch || "",
          swiftCode: formDataAny.bank?.swiftCode || "",
          sortCode: formDataAny.bank?.sortCode || "",
        }
      };

      console.log("🔍 SUBMIT - Transformed submit data:", submitData);

      // Submit the claim (change status from draft to submitted)
      const response = await apiRequest('POST', `/api/claims/${claimId}/submit`, submitData);
      
      if (!response.ok) {
        const errorResult = await response.json();
        console.log("🔍 SUBMIT ERROR RESPONSE:", errorResult);
        
        // Show detailed validation errors if available
        if (errorResult.errors && Array.isArray(errorResult.errors)) {
          toast({
            title: "Claim Incomplete",
            description: errorResult.errors.join(", "),
            variant: "destructive",
          });
        } else {
          toast({
            title: "Submission Failed",
            description: errorResult.message || 'Submission failed',
            variant: "destructive",
          });
        }
        return;
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
      const errorMessage = (error as Error).message || "Failed to submit your claim. Please try again or contact support.";
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Auto-save functionality
  // Smart auto-save that triggers only when there's meaningful data
  useEffect(() => {
    // Only trigger auto-save if we have meaningful form data and haven't just restored from draft
    if (!hasRestoredFromDraft && claimId) {
      const timeoutId = setTimeout(() => {
        autoSave();
      }, 2000); // 2 second delay to allow user to finish typing
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData, autoSave, hasRestoredFromDraft, claimId]);

  // Remove duplicate authentication checks - handled by App.tsx router
  // The Router in App.tsx already ensures only authenticated users reach this component

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
          <EnhancedDamageAssessment
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
            <Button variant="outline" onClick={handleManualSave}>
              Save Draft
            </Button>
            {currentStep < totalSteps ? (
              <Button 
                onClick={handleNextStep}
                className="bg-primary hover:bg-primary/90 text-white"
              >
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
