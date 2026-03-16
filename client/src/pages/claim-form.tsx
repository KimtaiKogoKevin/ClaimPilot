import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useStandaloneAuth } from "@/hooks/useStandaloneAuth";
import { useToast } from "@/hooks/use-toast";
import { useDraftManager } from "@/hooks/useDraftManager";
import { useClaimCollaboration, type FieldUpdate } from "@/hooks/useClaimCollaboration";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Clock, Type, History, ChevronDown, ChevronUp } from "lucide-react";
import ProgressBar from "@/components/claim-form/progress-bar";
import { calculateFormProgress, transformFormDataForAPI, restoreFormDataFromAPI } from "@/lib/formPersistenceUtils";
import { validateStep } from "@/lib/formValidation";
import PolicyDetailsStep from "@/components/claim-form/policy-details-step";
import VehicleAccidentStep from "@/components/claim-form/vehicle-accident-step";
import EnhancedDamageAssessment from "@/components/claim-form/enhanced-damage-assessment";
import DriverDeclarationStep from "@/components/claim-form/driver-declaration-step";
import { ClaimCollaborationStatus } from "@/components/ClaimCollaborationStatus";
import { ClaimChangeHistory } from "@/components/ClaimChangeHistory";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function ClaimForm() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  // Remove duplicate auth hook usage - auth is handled by App.tsx
  // const { isAuthenticated, isLoading } = useStandaloneAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [claimId, setClaimId] = useState<string | null>(id || null);
  const [hasShownRestoreNotification, setHasShownRestoreNotification] = useState(false);
  const hasRestoredRef = useRef(false);
  const autoSaveEnabledRef = useRef(false);
  
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

  // Get current user data for collaboration
  const { data: user } = useQuery<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }>({
    queryKey: ['/api/auth/user'],
  });

  // Track highlighted fields for remote updates
  const [highlightedFields, setHighlightedFields] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);

  const onFieldUpdateRef = useRef<(update: FieldUpdate) => void>();

  type FormData = typeof formData;
  type FormSection = 'individual' | 'corporate' | 'vehicle' | 'accident' | 'damage' | 'driver' | 'bank';

  onFieldUpdateRef.current = (update) => {
    const fieldParts = update.field.split('.');
    setFormData(prev => {
      if (fieldParts.length === 1) {
        const key = fieldParts[0] as keyof FormData;
        return { ...prev, [key]: update.value };
      }
      if (fieldParts.length === 2) {
        const section = fieldParts[0] as FormSection;
        const field = fieldParts[1];
        const sectionData = prev[section];
        if (typeof sectionData === 'object' && sectionData !== null && !Array.isArray(sectionData)) {
          return { ...prev, [section]: { ...sectionData, [field]: update.value } };
        }
      }
      return prev;
    });
    
    setHighlightedFields(prev => {
      const newSet = new Set(prev);
      newSet.add(update.field);
      return newSet;
    });
    
    toast({
      title: "Field Updated",
      description: `${update.changedBy.userName} updated ${update.field}`,
      duration: 3000,
    });
  };

  const stableOnFieldUpdate = useCallback((update: FieldUpdate) => {
    onFieldUpdateRef.current?.(update);
  }, []);

  // Collaboration hook for real-time updates (disabled for admins to prevent conflicts)
  const collaboration = useClaimCollaboration(
    user?.role === 'admin' ? undefined : (claimId || undefined),
    user?.id,
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown User',
    user?.role || 'insured',
    stableOnFieldUpdate
  );

  // Determine if form should be read-only
  const isReadOnly = collaboration.status.isLocked && !collaboration.status.isEditor;
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

  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  const lastSavedDataRef = useRef<string>("");

  // Restore draft data when loading a draft claim (fires only ONCE)
  useEffect(() => {
    if (currentDraft && !isLoadingDraft && typeof currentDraft === 'object' && !hasRestoredRef.current) {
      hasRestoredRef.current = true;
      
      const savedStep = getCurrentStep(currentDraft);
      setCurrentStep(savedStep);
      
      const restoredData = restoreFormDataFromAPI(currentDraft);
      setFormData(prev => ({
        ...prev,
        ...restoredData,
        individual: { ...prev.individual, ...restoredData.individual },
        corporate: { ...prev.corporate, ...restoredData.corporate },
        vehicle: { ...prev.vehicle, ...restoredData.vehicle },
        accident: { ...prev.accident, ...restoredData.accident },
        damage: { ...prev.damage, ...restoredData.damage },
        driver: { ...prev.driver, ...restoredData.driver },
        bank: { ...prev.bank, ...restoredData.bank },
      }));

      // Enable auto-save after 2 second delay
      setTimeout(() => {
        autoSaveEnabledRef.current = true;
      }, 2000);

      if (claimId && !hasShownRestoreNotification) {
        toast({
          title: "Draft Restored",
          description: `Continuing from step ${savedStep} where you left off.`,
          variant: "default",
        });
        setHasShownRestoreNotification(true);
      }
    }
  }, [currentDraft, isLoadingDraft, getCurrentStep, claimId, toast, hasShownRestoreNotification]);

  // Update URL when claim is created (so refresh works correctly)
  useEffect(() => {
    // Only update URL if we have a new claimId that's not already in the URL
    if (claimId && !id) {
      // Use replaceState to update URL without adding to history
      window.history.replaceState(null, '', `/claim-form/${claimId}`);
    }
  }, [claimId, id]);

  const totalSteps = 4;
  
  // Calculate progress percentage
  const calculateProgress = useCallback(() => {
    return Math.round((currentStep / totalSteps) * 100);
  }, [currentStep, totalSteps]);

  // Smart auto-save that only saves meaningful data and never overwrites complete data with empty data
  const autoSave = useCallback((stepOverride?: number) => {
    if (!claimId) {
      return;
    }
    
    const fd = formDataRef.current;
    
    // Build the data to save
    const dataToSave = {
      // Policy details
      branchName: fd.branchName || "",
      agentName: fd.agentName || "",
      policyNumber: fd.policyNumber || "",
      lastPaymentDate: fd.lastPaymentDate || "",
      typeOfCover: fd.typeOfCover || "",
      insuredType: fd.insuredType || "individual",

      // Individual details (save all individual form fields INCLUDING AGE BAND)
      individualFirstName: fd.individual?.firstName || "",
      individualMiddleName: fd.individual?.middleName || "",
      individualSurname: fd.individual?.surname || "",
      individualIdNumber: fd.individual?.idNumber || "",
      individualNationality: fd.individual?.nationality || "",
      individualDateOfBirth: fd.individual?.dateOfBirth || "",
      individualPinNumber: fd.individual?.pinNumber || "",
      individualOccupation: fd.individual?.occupation || "",
      individualResidentialPhone: fd.individual?.residentialPhone || "",
      individualOfficePhone: fd.individual?.officePhone || "",
      individualMobile: fd.individual?.mobile || "",
      individualPostalAddress: fd.individual?.postalAddress || "",
      individualPostalCode: fd.individual?.postalCode || "",
      individualPhysicalAddress: fd.individual?.physicalAddress || "",
      individualEmail: fd.individual?.email || "",
      individualTradeBusiness: fd.individual?.tradeBusiness || "",
      individualAgeBand: fd.individual?.ageBand || "",
      // Corporate details (save all corporate form fields)
      corporateRegisteredName: fd.corporate?.registeredName || "",
      corporateRegistrationNumber: fd.corporate?.registrationNumber || "",
      corporateCountryOfRegistration: fd.corporate?.countryOfRegistration || "",
      corporatePinNumber: fd.corporate?.pinNumber || "",
      corporateVatRegNumber: fd.corporate?.vatRegNumber || "",
      corporateOfficePhone: fd.corporate?.officePhone || "",
      corporateMobileContact: fd.corporate?.mobileContact || "",
      corporatePostalAddress: fd.corporate?.postalAddress || "",
      corporatePostalCode: fd.corporate?.postalCode || "",
      corporatePhysicalAddress: fd.corporate?.physicalAddress || "",
      corporateEmail: fd.corporate?.email || "",
      corporateTradeBusiness: fd.corporate?.tradeBusiness || "",
      corporateYearsInOperation: fd.corporate?.yearsInOperation || "",
      // Accident details
      accidentDate: fd.accident?.date || "",
      accidentTime: fd.accident?.time || "",
      accidentLocation: fd.accident?.location || "",
      accidentDescription: fd.accident?.description || "",
      // Damage details
      vehicleDamageDescription: fd.damage?.vehicleDescription || "",
      goodsDamaged: fd.damage?.goodsDamaged || false,
      goodsDescription: fd.damage?.goodsDescription || "",
      // Vehicle details
      vehicleMake: fd.vehicle?.make || "",
      vehicleModel: fd.vehicle?.model || "",
      vehicleYearOfManufacture: fd.vehicle?.yearOfManufacture || null,
      vehicleRegistrationNumber_primemover: fd.vehicle?.registrationNumber_primemover || "",
      vehicleRegistrationNumber_trailer: fd.vehicle?.registrationNumber_trailer || "",
      vehicleCarryingCapacity: fd.vehicle?.carryingCapacity || "",
      vehicleLoadingCapacity: fd.vehicle?.loadingCapacity || "",
      vehicleOwnerName: fd.vehicle?.ownerName || "",
      vehicleOwnerAddress: fd.vehicle?.ownerAddress || "",
      vehicleVehicleUse: fd.vehicle?.vehicleUse || "",
      
      // Driver details
      driverName: fd.driver?.name || "",
      driverOccupation: fd.driver?.occupation || "",
      driverAddress: fd.driver?.address || "",
      driverDateOfBirth: fd.driver?.dateOfBirth || "",
      driverTelephone: fd.driver?.telephone || "",
      driverLicenseNumber: fd.driver?.licenseNumber || "",
      driverEmployedByInsured: fd.driver?.employedByInsured ?? null,
      driverDrivingWithPermission: fd.driver?.drivingWithPermission ?? null,
      driverYearsOfDriving: fd.driver?.yearsOfDriving ?? null,
      driverBlameToBareForAccident: fd.driver?.blameToBareForAccident ?? null,
      driverAdmittedLiability: fd.driver?.admittedLiability ?? null,
      driverPreviousAccidents: fd.driver?.previousAccidents ?? null,
      driverPreviousAccidentsDetails: fd.driver?.previousAccidentsDetails || "",
      driverConvictions: fd.driver?.convictions ?? null,
      driverConvictionsDetails: fd.driver?.convictionsDetails || "",
      driverLicenseType: fd.driver?.licenseType || "",
      driverDrivingTestPassedDate: fd.driver?.drivingTestPassedDate || "",
      driverOwnsMotorVehicle: fd.driver?.ownsMotorVehicle ?? null,
      driverOwnVehicleInsurer: fd.driver?.ownVehicleInsurer || "",
      driverOwnVehiclePolicyNumber: fd.driver?.ownVehiclePolicyNumber || "",
      driverYearsInService: fd.driver?.yearsInService || "",
      
      // Bank details
      bankBankName: fd.bank?.bankName || "",
      bankAccountName: fd.bank?.accountName || "",
      bankAccountNumber: fd.bank?.accountNumber || "",
      bankBranch: fd.bank?.branch || "",
      bankSwiftCode: fd.bank?.swiftCode || "",
      bankSortCode: fd.bank?.sortCode || "",
      
      // Accident details
      accidentRoadSurface: fd.accident?.roadSurface || "",
      accidentVisibility: fd.accident?.visibility || "",
      accidentDriverWarningGiven: fd.accident?.driverWarningGiven || "",
      accidentVehicleLightsOn: fd.accident?.vehicleLightsOn || "",
      accidentPoliceTookParticulars: fd.accident?.policeTookParticulars || false,
      accidentPoliceConstableNumber: fd.accident?.policeConstableNumber || "",
      accidentPoliceStation: fd.accident?.policeStation || "",
      
      // STEP 3: Complete Damage Assessment Fields
      inspectionLocation: fd.inspectionLocation || "",
      repairerName: fd.repairerName || "",
      repairerPhone: fd.repairerPhone || "",
      repairerAddress: fd.repairerAddress || "",
      isVehicleInUse: fd.isVehicleInUse || false,
      thirdPartyProperties: JSON.stringify(fd.thirdPartyProperties || []),
      injuredPersons: JSON.stringify(fd.injuredPersons || []),
      passengers: JSON.stringify(fd.passengers || []),
      witnesses: JSON.stringify(fd.witnesses || []),
      
      // Finance/Loan fields
      financeCompanyName: fd.financeCompanyName ?? "",
      hasOtherInsurance: fd.hasOtherInsurance ?? false,
      otherInsuranceDetails: fd.otherInsuranceDetails ?? "",
      hasLoanRepaymentCover: fd.hasLoanRepaymentCover ?? false,
      loanPrincipalAmount: fd.loanPrincipalAmount ?? "",
      loanInterestAmount: fd.loanInterestAmount ?? "",
      monthlyInstalment: fd.monthlyInstalment ?? "",
      loanCoveragePercentage: fd.loanCoveragePercentage ?? "",
      
      // Trailer/Goods fields
      wasTrailerAttached: fd.wasTrailerAttached || false,
      goodsOwnerName: fd.goodsOwnerName || "",
      loadWeight: fd.loadWeight || "",
      
      // STEP 4: Final Declaration Fields
      ownerStatement: fd.ownerStatement || "",
      declarationName: fd.declarationName || "",
      declarationTitle: fd.declarationTitle || "",
      declarationAccepted: fd.declarationAccepted || false,
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
      return;
    }
    
    const progressPercentage = calculateProgress();
    const stepToSave = stepOverride ?? currentStep;
    
    saveDraft(claimId, stepToSave, dataToSave, progressPercentage);
  }, [claimId, currentStep, saveDraft, calculateProgress]);

  // Manual save button handler
  const handleSaveDraft = () => {
    autoSave();
  };

  const handleBackToLanding = () => {
    setLocation("/");
  };

  const handleNextStep = () => {
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
      setCurrentStep(nextStep);
      if (claimId) {
        autoSave(nextStep);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      if (claimId) {
        autoSave(prevStep);
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
      // Save all current data before submitting
      autoSave();
      // Wait for save to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const submitData = {
        driver: {
          name: formData.driver.name || "",
          licenseNumber: formData.driver.licenseNumber || "",
          occupation: formData.driver.occupation || "",
          address: formData.driver.address || "",
          telephone: formData.driver.telephone || "",
          dateOfBirth: formData.driver.dateOfBirth || "",
          employedByInsured: formData.driver.employedByInsured ?? false,
          drivingWithPermission: formData.driver.drivingWithPermission ?? false,
          yearsOfDriving: formData.driver.yearsOfDriving ?? 0,
          blameToBareForAccident: formData.driver.blameToBareForAccident ?? false,
          admittedLiability: formData.driver.admittedLiability ?? false,
          previousAccidents: formData.driver.previousAccidents ?? false,
          convictions: formData.driver.convictions ?? false,
          licenseType: formData.driver.licenseType || "",
          ownsMotorVehicle: formData.driver.ownsMotorVehicle ?? false,
        },
        bankDetails: {
          bankName: formData.bank.bankName || "",
          accountName: formData.bank.accountName || "",
          accountNumber: formData.bank.accountNumber || "",
          branch: formData.bank.branch || "",
          swiftCode: formData.bank.swiftCode || "",
          sortCode: formData.bank.sortCode || "",
        }
      };

      // Submit the claim (change status from draft to submitted)
      const response = await apiRequest('POST', `/api/claims/${claimId}/submit`, submitData);
      
      if (!response.ok) {
        const errorResult = await response.json();
        
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
  useEffect(() => {
    if (!autoSaveEnabledRef.current || !claimId) return;

    const timeoutId = setTimeout(() => {
      const currentDataStr = JSON.stringify(formDataRef.current);
      if (currentDataStr === lastSavedDataRef.current) return;
      lastSavedDataRef.current = currentDataStr;
      autoSave();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [formData, claimId, autoSave]);

  // Enable auto-save immediately when there's no draft to restore (new claim)
  useEffect(() => {
    if (!currentDraft && !isLoadingDraft && claimId) {
      autoSaveEnabledRef.current = true;
    }
  }, [currentDraft, isLoadingDraft, claimId]);

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
                data-testid="button-back-to-dashboard"
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
                  disabled={isSaving || isReadOnly}
                  className="text-neutral-700 hover:text-neutral-900"
                  data-testid="button-save-draft"
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

          {/* Collaboration Status */}
          {claimId && (
            <div className="mb-4">
              <ClaimCollaborationStatus status={collaboration.status} />
            </div>
          )}
          
          <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Change History Panel */}
        {claimId && collaboration.history.length > 0 && (
          <Collapsible open={showHistory} onOpenChange={setShowHistory} className="mb-6">
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                data-testid="button-toggle-history"
              >
                <span className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Change History ({collaboration.history.length} {collaboration.history.length === 1 ? 'change' : 'changes'})
                </span>
                {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <ClaimChangeHistory 
                history={collaboration.history}
                onRefresh={collaboration.refreshHistory}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

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
            data-testid="button-previous-step"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <div className="flex space-x-4">
            {currentStep < totalSteps ? (
              <Button 
                onClick={handleNextStep}
                className="bg-primary hover:bg-primary/90 text-white"
                disabled={isReadOnly}
                data-testid="button-next-step"
              >
                Next
                <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmitClaim} 
                className="bg-secondary hover:bg-green-600"
                disabled={isReadOnly}
                data-testid="button-submit-claim"
              >
                Submit Claim
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
