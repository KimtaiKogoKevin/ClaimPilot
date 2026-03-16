/**
 * Form Persistence Utilities
 * 
 * Transforms form data between the client-side nested structure and the
 * flat API payload used for draft save/restore.
 */

function safeJsonParse(value: any, defaultValue: any = null): any {
  if (!value) return defaultValue;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
}

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
    
    // Finance/Loan fields
    financeCompanyName: formData.financeCompanyName ?? "",
    hasOtherInsurance: formData.hasOtherInsurance ?? false,
    otherInsuranceDetails: formData.otherInsuranceDetails ?? "",
    hasLoanRepaymentCover: formData.hasLoanRepaymentCover ?? false,
    loanPrincipalAmount: formData.loanPrincipalAmount ?? "",
    loanInterestAmount: formData.loanInterestAmount ?? "",
    monthlyInstalment: formData.monthlyInstalment ?? "",
    loanCoveragePercentage: formData.loanCoveragePercentage ?? "",
    
    // Trailer/Goods fields
    wasTrailerAttached: formData.wasTrailerAttached ?? false,
    goodsOwnerName: formData.goodsOwnerName || "",
    loadWeight: formData.loadWeight || "",
    
    // Declaration
    declarationAccepted: formData.declarationAccepted ?? false,
    ownerStatement: formData.ownerStatement || "",
    declarationName: formData.declarationName || "",
    declarationTitle: formData.declarationTitle || "",
    
    // Dynamic arrays
    thirdPartyProperties: JSON.stringify(formData.thirdPartyProperties || []),
    injuredPersons: JSON.stringify(formData.injuredPersons || []),
    passengers: JSON.stringify(formData.passengers || []),
    witnesses: JSON.stringify(formData.witnesses || []),
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
    
    // Individual details (restored from flattened fields OR nested individualDetails object)
    individual: {
      firstName: apiData.individualFirstName || apiData.individualDetails?.firstName || "",
      middleName: apiData.individualMiddleName || apiData.individualDetails?.middleName || "",
      surname: apiData.individualSurname || apiData.individualDetails?.surname || "",
      idNumber: apiData.individualIdNumber || apiData.individualDetails?.idNumber || "",
      nationality: apiData.individualNationality || apiData.individualDetails?.nationality || "",
      dateOfBirth: apiData.individualDateOfBirth || apiData.individualDetails?.dateOfBirth || "",
      pinNumber: apiData.individualPinNumber || apiData.individualDetails?.pinNumber || "",
      occupation: apiData.individualOccupation || apiData.individualDetails?.occupation || "",
      residentialPhone: apiData.individualResidentialPhone || apiData.individualDetails?.residentialPhone || "",
      officePhone: apiData.individualOfficePhone || apiData.individualDetails?.officePhone || "",
      mobile: apiData.individualMobile || apiData.individualDetails?.mobile || "",
      postalAddress: apiData.individualPostalAddress || apiData.individualDetails?.postalAddress || "",
      postalCode: apiData.individualPostalCode || apiData.individualDetails?.postalCode || "",
      physicalAddress: apiData.individualPhysicalAddress || apiData.individualDetails?.physicalAddress || "",
      email: apiData.individualEmail || apiData.individualDetails?.email || "",
      tradeBusiness: apiData.individualTradeBusiness || apiData.individualDetails?.tradeBusiness || "",
      ageBand: apiData.individualAgeBand || apiData.individualDetails?.ageBand || "",
    },
    
    // Corporate details (restored from flattened fields OR nested corporateDetails object)
    corporate: {
      registeredName: apiData.corporateRegisteredName || apiData.corporateDetails?.registeredName || "",
      registrationNumber: apiData.corporateRegistrationNumber || apiData.corporateDetails?.registrationNumber || "",
      countryOfRegistration: apiData.corporateCountryOfRegistration || apiData.corporateDetails?.countryOfRegistration || "",
      pinNumber: apiData.corporatePinNumber || apiData.corporateDetails?.pinNumber || "",
      vatRegNumber: apiData.corporateVatRegNumber || apiData.corporateDetails?.vatRegNumber || "",
      officePhone: apiData.corporateOfficePhone || apiData.corporateDetails?.officePhone || "",
      mobileContact: apiData.corporateMobileContact || apiData.corporateDetails?.mobileContact || "",
      postalAddress: apiData.corporatePostalAddress || apiData.corporateDetails?.postalAddress || "",
      postalCode: apiData.corporatePostalCode || apiData.corporateDetails?.postalCode || "",
      physicalAddress: apiData.corporatePhysicalAddress || apiData.corporateDetails?.physicalAddress || "",
      email: apiData.corporateEmail || apiData.corporateDetails?.email || "",
      tradeBusiness: apiData.corporateTradeBusiness || apiData.corporateDetails?.tradeBusiness || "",
      yearsInOperation: apiData.corporateYearsInOperation || apiData.corporateDetails?.yearsInOperation || "",
    },
    
    // Vehicle details (restored from flattened fields OR nested vehicle object)
    vehicle: {
      make: apiData.vehicleMake || apiData.vehicle?.make || "",
      model: apiData.vehicleModel || apiData.vehicle?.model || "",
      yearOfManufacture: apiData.vehicleYearOfManufacture || apiData.vehicle?.yearOfManufacture || null,
      registrationNumber_primemover: apiData.vehicleRegistrationNumber_primemover || apiData.vehicle?.registrationNumber_primemover || apiData.vehicle?.registrationNumber || "",
      registrationNumber_trailer: apiData.vehicleRegistrationNumber_trailer || apiData.vehicle?.registrationNumber_trailer || "",
      carryingCapacity: apiData.vehicleCarryingCapacity || apiData.vehicle?.carryingCapacity || "",
      loadingCapacity: apiData.vehicleLoadingCapacity || apiData.vehicle?.loadingCapacity || "",
      ownerName: apiData.vehicleOwnerName || apiData.vehicle?.ownerName || "",
      ownerAddress: apiData.vehicleOwnerAddress || apiData.vehicle?.ownerAddress || "",
      vehicleUse: apiData.vehicleVehicleUse || apiData.vehicle?.vehicleUse || "",
    },
    
    // Accident details (direct claim columns)
    accident: {
      date: apiData.accidentDate ? new Date(apiData.accidentDate).toISOString().split('T')[0] : "",
      time: apiData.accidentTime || "",
      location: apiData.accidentLocation || "",
      description: apiData.accidentDescription || "",
      roadSurface: apiData.roadSurface || "",
      visibility: apiData.visibility || "",
      driverWarningGiven: apiData.driverWarningGiven || "",
      vehicleLightsOn: apiData.vehicleLightsOn || "",
      policeTookParticulars: apiData.policeTookParticulars ?? false,
      policeConstableNumber: apiData.policeConstableNumber || "",
      policeStation: apiData.policeStation || "",
    },
    
    // Damage details (restored from flattened fields)
    damage: {
      vehicleDescription: apiData.vehicleDamageDescription || "",
      goodsDamaged: apiData.goodsDamaged || false,
      goodsDescription: apiData.goodsDescription || "",
    },
    
    // Driver details (restored from flattened fields OR nested driver object)
    driver: {
      name: apiData.driverName || apiData.driver?.name || "",
      occupation: apiData.driverOccupation || apiData.driver?.occupation || "",
      address: apiData.driverAddress || apiData.driver?.address || "",
      dateOfBirth: apiData.driverDateOfBirth || apiData.driver?.dateOfBirth || "",
      telephone: apiData.driverTelephone || apiData.driver?.telephone || "",
      licenseNumber: apiData.driverLicenseNumber || apiData.driver?.licenseNumber || "",
      employedByInsured: apiData.driverEmployedByInsured ?? apiData.driver?.employedByInsured ?? false,
      drivingWithPermission: apiData.driverDrivingWithPermission ?? apiData.driver?.drivingWithPermission ?? false,
      yearsOfDriving: apiData.driverYearsOfDriving ?? apiData.driver?.yearsOfDriving ?? null,
      blameToBareForAccident: apiData.driverBlameToBareForAccident ?? apiData.driver?.blameToBareForAccident ?? false,
      admittedLiability: apiData.driverAdmittedLiability ?? apiData.driver?.admittedLiability ?? false,
      previousAccidents: apiData.driverPreviousAccidents ?? apiData.driver?.previousAccidents ?? false,
      previousAccidentsDetails: apiData.driverPreviousAccidentsDetails || apiData.driver?.previousAccidentsDetails || "",
      convictions: apiData.driverConvictions ?? apiData.driver?.convictions ?? false,
      convictionsDetails: apiData.driverConvictionsDetails || apiData.driver?.convictionsDetails || "",
      licenseType: apiData.driverLicenseType || apiData.driver?.licenseType || "",
      drivingTestPassedDate: apiData.driverDrivingTestPassedDate || apiData.driver?.drivingTestPassedDate || "",
      ownsMotorVehicle: apiData.driverOwnsMotorVehicle ?? apiData.driver?.ownsMotorVehicle ?? false,
      ownVehicleInsurer: apiData.driverOwnVehicleInsurer || apiData.driver?.ownVehicleInsurer || "",
      ownVehiclePolicyNumber: apiData.driverOwnVehiclePolicyNumber || apiData.driver?.ownVehiclePolicyNumber || "",
      yearsInService: apiData.yearsInService || apiData.driver?.yearsInService || "",
    },
    
    // Bank details (restored from flattened fields OR nested bankDetails object)
    bank: {
      bankName: apiData.bankBankName || apiData.bankDetails?.bankName || "",
      accountName: apiData.bankAccountName || apiData.bankDetails?.accountName || "",
      accountNumber: apiData.bankAccountNumber || apiData.bankDetails?.accountNumber || "",
      branch: apiData.bankBranch || apiData.bankDetails?.branch || "",
      swiftCode: apiData.bankSwiftCode || apiData.bankDetails?.swiftCode || "",
      sortCode: apiData.bankSortCode || apiData.bankDetails?.sortCode || "",
    },
    
    // Additional details
    inspectionLocation: apiData.inspectionLocation || "",
    repairerName: apiData.repairerName || "",
    repairerPhone: apiData.repairerPhone || "",
    repairerAddress: apiData.repairerAddress || "",
    isVehicleInUse: apiData.isVehicleInUse ?? null,
    thirdPartyProperties: safeJsonParse(apiData.thirdPartyProperties, []),
    injuredPersons: safeJsonParse(apiData.injuredPersons, []),
    passengers: safeJsonParse(apiData.passengers, []),
    witnesses: safeJsonParse(apiData.witnesses, []),
    ownerStatement: apiData.ownerStatement || "",
    declarationName: apiData.declarationName || "",
    declarationTitle: apiData.declarationTitle || "",
    declarationAccepted: apiData.declarationAccepted ?? false,
    
    // Finance/Loan fields
    financeCompanyName: apiData.financeCompanyName ?? "",
    hasOtherInsurance: apiData.hasOtherInsurance ?? false,
    otherInsuranceDetails: apiData.otherInsuranceDetails ?? "",
    hasLoanRepaymentCover: apiData.hasLoanRepaymentCover ?? false,
    loanPrincipalAmount: apiData.loanPrincipalAmount ?? "",
    loanInterestAmount: apiData.loanInterestAmount ?? "",
    monthlyInstalment: apiData.monthlyInstalment ?? "",
    loanCoveragePercentage: apiData.loanCoveragePercentage ?? "",
    
    // Trailer/Goods fields
    wasTrailerAttached: apiData.wasTrailerAttached ?? false,
    goodsOwnerName: apiData.goodsOwnerName || "",
    loadWeight: apiData.loadWeight || "",
    
    // Other vehicles
    otherVehicles: apiData.otherVehicles || [],
  };
}