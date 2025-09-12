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
    
    // Vehicle details (flattened for dual storage)
    vehicleMake: formData.vehicle?.make || "",
    vehicleModel: formData.vehicle?.model || "",
    vehicleYearOfManufacture: formData.vehicle?.yearOfManufacture || null,
    vehicleRegistrationNumber: formData.vehicle?.registrationNumber_primemover || formData.vehicle?.registrationNumber || "",
    vehicleCarryingCapacity: formData.vehicle?.carryingCapacity || "",
    vehicleLoadingCapacity: formData.vehicle?.loadingCapacity || "",
    vehicleOwnerName: formData.vehicle?.ownerName || "",
    vehicleOwnerAddress: formData.vehicle?.ownerAddress || "",
    vehicleVehicleUse: formData.vehicle?.vehicleUse || "",
    
    // Driver details (flattened for dual storage)
    driverName: formData.driver?.name || "",
    driverOccupation: formData.driver?.occupation || "",
    driverAddress: formData.driver?.address || "",
    driverDateOfBirth: formData.driver?.dateOfBirth || "",
    driverTelephone: formData.driver?.telephone || "",
    driverYearsInService: formData.driver?.yearsInService || "",
    driverEmployedByInsured: formData.driver?.employedByInsured ?? null,
    driverDrivingWithPermission: formData.driver?.drivingWithPermission ?? null,
    driverYearsOfDriving: formData.driver?.yearsOfDriving ?? null,
    driverBlameToBareForAccident: formData.driver?.blameToBareForAccident ?? null,
    driverAdmittedLiability: formData.driver?.admittedLiability ?? null,
    driverPreviousAccidents: formData.driver?.previousAccidents ?? null,
    driverPreviousAccidentsDetails: formData.driver?.previousAccidentsDetails || "",
    driverConvictions: formData.driver?.convictions ?? null,
    driverConvictionsDetails: formData.driver?.convictionsDetails || "",
    driverLicenseNumber: formData.driver?.licenseNumber || "",
    driverLicenseType: formData.driver?.licenseType || "",
    driverDrivingTestPassedDate: formData.driver?.drivingTestPassedDate || "",
    driverOwnsMotorVehicle: formData.driver?.ownsMotorVehicle ?? null,
    driverOwnVehicleInsurer: formData.driver?.ownVehicleInsurer || "",
    driverOwnVehiclePolicyNumber: formData.driver?.ownVehiclePolicyNumber || "",
    
    // Bank details (flattened for dual storage)
    bankBankName: formData.bank?.bankName || "",
    bankAccountName: formData.bank?.accountName || "",
    bankAccountNumber: formData.bank?.accountNumber || "",
    bankBranch: formData.bank?.branch || "",
    bankSwiftCode: formData.bank?.swiftCode || "",
    bankSortCode: formData.bank?.sortCode || "",
  };
}

/**
 * Restore form data from API response
 * Maps flattened server data back to nested UI structure
 */
export function restoreFormDataFromAPI(apiData: any): any {
  return {
    // Policy details
    branchName: apiData.branchName || "",
    agentName: apiData.agentName || "",
    policyNumber: apiData.policyNumber || "",
    lastPaymentDate: apiData.lastPaymentDate ? new Date(apiData.lastPaymentDate).toISOString().split('T')[0] : "",
    typeOfCover: apiData.typeOfCover || "",
    insuredType: apiData.insuredType || "individual",
    
    // Individual details (restored from flattened fields)
    individual: {
      firstName: apiData.individualFirstName || "",
      middleName: apiData.individualMiddleName || "",
      surname: apiData.individualSurname || "",
      idNumber: apiData.individualIdNumber || "",
      nationality: apiData.individualNationality || "",
      dateOfBirth: apiData.individualDateOfBirth || "",
      pinNumber: apiData.individualPinNumber || "",
      occupation: apiData.individualOccupation || "",
      residentialPhone: apiData.individualResidentialPhone || "",
      officePhone: apiData.individualOfficePhone || "",
      mobile: apiData.individualMobile || "",
      postalAddress: apiData.individualPostalAddress || "",
      postalCode: apiData.individualPostalCode || "",
      physicalAddress: apiData.individualPhysicalAddress || "",
      email: apiData.individualEmail || "",
      tradeBusiness: apiData.individualTradeBusiness || "",
      ageBand: apiData.individualAgeBand || "",
    },
    
    // Corporate details (restored from flattened fields)
    corporate: {
      registeredName: apiData.corporateRegisteredName || "",
      registrationNumber: apiData.corporateRegistrationNumber || "",
      countryOfRegistration: apiData.corporateCountryOfRegistration || "",
      pinNumber: apiData.corporatePinNumber || "",
      vatRegNumber: apiData.corporateVatRegNumber || "",
      officePhone: apiData.corporateOfficePhone || "",
      mobileContact: apiData.corporateMobileContact || "",
      postalAddress: apiData.corporatePostalAddress || "",
      postalCode: apiData.corporatePostalCode || "",
      physicalAddress: apiData.corporatePhysicalAddress || "",
      email: apiData.corporateEmail || "",
      tradeBusiness: apiData.corporateTradeBusiness || "",
      yearsInOperation: apiData.corporateYearsInOperation || "",
    },
    
    // Vehicle details (restored from flattened fields)
    vehicle: {
      make: apiData.vehicleMake || "",
      model: apiData.vehicleModel || "",
      yearOfManufacture: apiData.vehicleYearOfManufacture || null,
      registrationNumber_primemover: apiData.vehicleRegistrationNumber_primemover || "",
      registrationNumber_trailer: apiData.vehicleRegistrationNumber_trailer || "",
      carryingCapacity: apiData.vehicleCarryingCapacity || "",
      loadingCapacity: apiData.vehicleLoadingCapacity || "",
      ownerName: apiData.vehicleOwnerName || "",
      ownerAddress: apiData.vehicleOwnerAddress || "",
      vehicleUse: apiData.vehicleVehicleUse || "",
    },
    
    // Accident details (restored from flattened fields)
    accident: {
      date: apiData.accidentDate ? new Date(apiData.accidentDate).toISOString().split('T')[0] : "",
      time: apiData.accidentTime || "",
      location: apiData.accidentLocation || "",
      description: apiData.accidentDescription || "",
      roadSurface: apiData.accidentRoadSurface || "",
      visibility: apiData.accidentVisibility || "",
      driverWarningGiven: apiData.accidentDriverWarningGiven || "",
      vehicleLightsOn: apiData.accidentVehicleLightsOn || "",
      policeTookParticulars: apiData.accidentPoliceTookParticulars || false,
      policeConstableNumber: apiData.accidentPoliceConstableNumber || "",
      policeStation: apiData.accidentPoliceStation || "",
    },
    
    // Damage details (restored from flattened fields)
    damage: {
      vehicleDescription: apiData.vehicleDamageDescription || "",
      goodsDamaged: apiData.goodsDamaged || false,
      goodsDescription: apiData.goodsDescription || "",
    },
    
    // Driver details (restored from flattened fields)
    driver: {
      name: apiData.driverName || "",
      occupation: apiData.driverOccupation || "",
      address: apiData.driverAddress || "",
      dateOfBirth: apiData.driverDateOfBirth || "",
      telephone: apiData.driverTelephone || "",
      licenseNumber: apiData.driverLicenseNumber || "",
      employedByInsured: apiData.driverEmployedByInsured ?? false,
      drivingWithPermission: apiData.driverDrivingWithPermission ?? false,
      yearsOfDriving: apiData.driverYearsOfDriving ?? null,
      blameToBareForAccident: apiData.driverBlameToBareForAccident ?? false,
      admittedLiability: apiData.driverAdmittedLiability ?? false,
      previousAccidents: apiData.driverPreviousAccidents ?? false,
      previousAccidentsDetails: apiData.driverPreviousAccidentsDetails || "",
      convictions: apiData.driverConvictions ?? false,
      convictionsDetails: apiData.driverConvictionsDetails || "",
      licenseType: apiData.driverLicenseType || "",
      drivingTestPassedDate: apiData.driverDrivingTestPassedDate || "",
      ownsMotorVehicle: apiData.driverOwnsMotorVehicle ?? false,
      ownVehicleInsurer: apiData.driverOwnVehicleInsurer || "",
      ownVehiclePolicyNumber: apiData.driverOwnVehiclePolicyNumber || "",
      yearsInService: apiData.driverYearsInService || "",
    },
    
    // Bank details (restored from flattened fields)
    bank: {
      bankName: apiData.bankBankName || "",
      accountName: apiData.bankAccountName || "",
      accountNumber: apiData.bankAccountNumber || "",
      branch: apiData.bankBranch || "",
      swiftCode: apiData.bankSwiftCode || "",
      sortCode: apiData.bankSortCode || "",
    },
    
    // Additional details
    inspectionLocation: apiData.inspectionLocation || "",
    repairerName: apiData.repairerName || "",
    repairerPhone: apiData.repairerPhone || "",
    repairerAddress: apiData.repairerAddress || "",
    isVehicleInUse: apiData.isVehicleInUse ?? null,
    thirdPartyProperties: apiData.thirdPartyProperties ? JSON.parse(apiData.thirdPartyProperties) : [],
    personsInjured: apiData.personsInjured ? JSON.parse(apiData.personsInjured) : [],
    ownerStatement: apiData.ownerStatement || "",
    declarationName: apiData.declarationName || "",
    declarationTitle: apiData.declarationTitle || "",
    declarationAccepted: apiData.declarationAccepted ?? false,
    
    // Other vehicles
    otherVehicles: apiData.otherVehicles || [],
  };
}