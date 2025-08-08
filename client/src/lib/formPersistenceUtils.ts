/**
 * Form Persistence Utilities
 * 
 * Senior-level utilities for managing form persistence across all form components.
 * This provides a consistent interface for form steps to interact with the
 * enterprise-grade persistence system.
 */

export interface FormStep {
  stepNumber: number;
  stepName: string;
  requiredFields: string[];
  validateData: (data: any) => boolean;
}

export const FORM_STEPS: FormStep[] = [
  {
    stepNumber: 1,
    stepName: "Policy Details",
    requiredFields: ["branchName", "agentName", "policyNumber"],
    validateData: (data: any) => {
      return !!(data.branchName && data.agentName && data.policyNumber);
    }
  },
  {
    stepNumber: 2,
    stepName: "Vehicle & Accident",
    requiredFields: ["vehicle.make", "vehicle.model", "accident.date", "accident.location"],
    validateData: (data: any) => {
      return !!(data.vehicle?.make && data.vehicle?.model && data.accident?.date && data.accident?.location);
    }
  },
  {
    stepNumber: 3,
    stepName: "Damage Assessment",
    requiredFields: ["damage.vehicleDescription"],
    validateData: (data: any) => {
      return !!(data.damage?.vehicleDescription);
    }
  },
  {
    stepNumber: 4,
    stepName: "Driver Declaration",
    requiredFields: ["driver.name", "driver.licenseNumber", "bank.bankName", "bank.accountNumber"],
    validateData: (data: any) => {
      return !!(data.driver?.name && data.driver?.licenseNumber && data.bank?.bankName && data.bank?.accountNumber);
    }
  }
];

/**
 * Calculate form completion percentage based on filled required fields
 */
export function calculateFormProgress(formData: any, currentStep: number): number {
  let totalRequiredFields = 0;
  let completedFields = 0;

  // Only count fields from current step and previous steps
  const relevantSteps = FORM_STEPS.filter(step => step.stepNumber <= currentStep);
  
  relevantSteps.forEach(step => {
    totalRequiredFields += step.requiredFields.length;
    
    step.requiredFields.forEach(field => {
      const fieldValue = getNestedValue(formData, field);
      if (fieldValue && fieldValue !== '') {
        completedFields++;
      }
    });
  });

  return totalRequiredFields > 0 ? Math.round((completedFields / totalRequiredFields) * 100) : 0;
}

/**
 * Get nested object value by dot notation path
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}

/**
 * Validate if a step is complete
 */
export function isStepComplete(formData: any, stepNumber: number): boolean {
  const step = FORM_STEPS.find(s => s.stepNumber === stepNumber);
  if (!step) return false;
  
  return step.validateData(formData);
}

/**
 * Get the furthest step the user can proceed to based on completed steps
 */
export function getMaxAllowedStep(formData: any): number {
  let maxStep = 1;
  
  for (const step of FORM_STEPS) {
    if (isStepComplete(formData, step.stepNumber)) {
      maxStep = step.stepNumber + 1;
    } else {
      break;
    }
  }
  
  return Math.min(maxStep, FORM_STEPS.length);
}

/**
 * Transform form data for API persistence
 */
export function transformFormDataForAPI(formData: any): any {
  return {
    // Policy details
    branchName: formData.branchName || "",
    agentName: formData.agentName || "",
    policyNumber: formData.policyNumber || "",
    lastPaymentDate: formData.lastPaymentDate || "",
    insuredType: formData.insuredType || "individual",
    
    // Individual details (flattened for dual storage)
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
    
    // Corporate details (flattened for dual storage)
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
  };
}

/**
 * Restore form data from API response
 */
export function restoreFormDataFromAPI(apiData: any): any {
  return {
    // Policy details
    branchName: apiData.branchName || "",
    agentName: apiData.agentName || "",
    policyNumber: apiData.policyNumber || "",
    lastPaymentDate: apiData.lastPaymentDate ? new Date(apiData.lastPaymentDate).toISOString().split('T')[0] : "",
    insuredType: apiData.insuredType || "individual",
    
    // Individual details (check both relation and flattened fields)
    individual: {
      firstName: apiData.individualDetails?.firstName || apiData.individualFirstName || "",
      middleName: apiData.individualDetails?.middleName || apiData.individualMiddleName || "",
      surname: apiData.individualDetails?.surname || apiData.individualSurname || "",
      idNumber: apiData.individualDetails?.idNumber || apiData.individualIdNumber || "",
      nationality: apiData.individualDetails?.nationality || apiData.individualNationality || "",
      dateOfBirth: apiData.individualDetails?.dateOfBirth || apiData.individualDateOfBirth || "",
      pinNumber: apiData.individualDetails?.pinNumber || apiData.individualPinNumber || "",
      occupation: apiData.individualDetails?.occupation || apiData.individualOccupation || "",
      residentialPhone: apiData.individualDetails?.residentialPhone || apiData.individualResidentialPhone || "",
      officePhone: apiData.individualDetails?.officePhone || apiData.individualOfficePhone || "",
      mobile: apiData.individualDetails?.mobile || apiData.individualMobile || "",
      postalAddress: apiData.individualDetails?.postalAddress || apiData.individualPostalAddress || "",
      postalCode: apiData.individualDetails?.postalCode || apiData.individualPostalCode || "",
      physicalAddress: apiData.individualDetails?.physicalAddress || apiData.individualPhysicalAddress || "",
      email: apiData.individualDetails?.email || apiData.individualEmail || "",
      tradeBusiness: apiData.individualDetails?.tradeBusiness || apiData.individualTradeBusiness || "",
    },
    
    // Corporate details (check both relation and flattened fields)
    corporate: {
      registeredName: apiData.corporateDetails?.registeredName || apiData.corporateRegisteredName || "",
      registrationNumber: apiData.corporateDetails?.registrationNumber || apiData.corporateRegistrationNumber || "",
      countryOfRegistration: apiData.corporateDetails?.countryOfRegistration || apiData.corporateCountryOfRegistration || "",
      pinNumber: apiData.corporateDetails?.pinNumber || apiData.corporatePinNumber || "",
      vatRegNumber: apiData.corporateDetails?.vatRegNumber || apiData.corporateVatRegNumber || "",
      officePhone: apiData.corporateDetails?.officePhone || apiData.corporateOfficePhone || "",
      mobileContact: apiData.corporateDetails?.mobileContact || apiData.corporateMobileContact || "",
      postalAddress: apiData.corporateDetails?.postalAddress || apiData.corporatePostalAddress || "",
      postalCode: apiData.corporateDetails?.postalCode || apiData.corporatePostalCode || "",
      physicalAddress: apiData.corporateDetails?.physicalAddress || apiData.corporatePhysicalAddress || "",
      email: apiData.corporateDetails?.email || apiData.corporateEmail || "",
      tradeBusiness: apiData.corporateDetails?.tradeBusiness || apiData.corporateTradeBusiness || "",
      yearsInOperation: apiData.corporateDetails?.yearsInOperation || apiData.corporateYearsInOperation || "",
    },
    
    // Vehicle details
    vehicle: apiData.vehicle ? {
      make: apiData.vehicle.make || "",
      model: apiData.vehicle.model || "",
      yearOfManufacture: apiData.vehicle.yearOfManufacture || null,
      registrationNumber: apiData.vehicle.registrationNumber || "",
      carryingCapacity: apiData.vehicle.carryingCapacity || "",
      loadingCapacity: apiData.vehicle.loadingCapacity || "",
      ownerName: apiData.vehicle.ownerName || "",
      ownerAddress: apiData.vehicle.ownerAddress || "",
      vehicleUse: apiData.vehicle.vehicleUse || "",
    } : {
      make: "", model: "", yearOfManufacture: null, registrationNumber: "",
      carryingCapacity: "", loadingCapacity: "", ownerName: "", ownerAddress: "", vehicleUse: ""
    },
    
    // Accident details
    accident: {
      date: apiData.accidentDate ? new Date(apiData.accidentDate).toISOString().split('T')[0] : "",
      time: apiData.accidentTime || "",
      location: apiData.accidentLocation || "",
      description: apiData.accidentDescription || "",
    },
    
    // Damage details
    damage: {
      vehicleDescription: apiData.vehicleDamageDescription || "",
      goodsDamaged: apiData.goodsDamaged || false,
      goodsDescription: apiData.goodsDescription || "",
    },
    
    // Driver details
    driver: apiData.driver ? {
      name: apiData.driver.name || "",
      occupation: apiData.driver.occupation || "",
      address: apiData.driver.address || "",
      dateOfBirth: apiData.driver.dateOfBirth || "",
      telephone: apiData.driver.telephone || "",
      licenseNumber: apiData.driver.licenseNumber || "",
      employedByInsured: apiData.driver.employedByInsured || null,
      drivingWithPermission: apiData.driver.drivingWithPermission || null,
      yearsOfDriving: apiData.driver.yearsOfDriving || null,
      blameToBareForAccident: apiData.driver.blameToBareForAccident || null,
      admittedLiability: apiData.driver.admittedLiability || null,
      previousAccidents: apiData.driver.previousAccidents || null,
      previousAccidentsDetails: apiData.driver.previousAccidentsDetails || "",
      convictions: apiData.driver.convictions || null,
      convictionsDetails: apiData.driver.convictionsDetails || "",
      licenseType: apiData.driver.licenseType || "",
      drivingTestPassedDate: apiData.driver.drivingTestPassedDate || "",
      ownsMotorVehicle: apiData.driver.ownsMotorVehicle || null,
      ownVehicleInsurer: apiData.driver.ownVehicleInsurer || "",
      ownVehiclePolicyNumber: apiData.driver.ownVehiclePolicyNumber || "",
    } : {
      name: "", occupation: "", address: "", dateOfBirth: "", telephone: "", licenseNumber: "",
      employedByInsured: null, drivingWithPermission: null, yearsOfDriving: null,
      blameToBareForAccident: null, admittedLiability: null, previousAccidents: null,
      previousAccidentsDetails: "", convictions: null, convictionsDetails: "",
      licenseType: "", drivingTestPassedDate: "", ownsMotorVehicle: null,
      ownVehicleInsurer: "", ownVehiclePolicyNumber: "",
    },
    
    // Bank details
    bank: apiData.bankDetails ? {
      bankName: apiData.bankDetails.bankName || "",
      accountName: apiData.bankDetails.accountName || "",
      accountNumber: apiData.bankDetails.accountNumber || "",
      branch: apiData.bankDetails.branch || "",
      swiftCode: apiData.bankDetails.swiftCode || "",
      sortCode: apiData.bankDetails.sortCode || "",
    } : {
      bankName: "", accountName: "", accountNumber: "", branch: "", swiftCode: "", sortCode: ""
    },
    
    // Other vehicles
    otherVehicles: apiData.otherVehicles || [],
  };
}