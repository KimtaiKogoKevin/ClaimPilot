// Comprehensive form validation utilities for production readiness

import { z } from 'zod';

// Section A: Policy Details Validation
export const policyDetailsSchema = z.object({
  branchName: z.string().min(1, "Branch name is required"),
  agentName: z.string().min(1, "Agent name is required"),
  policyNumber: z.string().min(1, "Policy number is required"),
  lastPaymentDate: z.string().optional(),
  insuredType: z.enum(['individual', 'corporate']),
});

// Individual Details Validation
export const individualDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  surname: z.string().min(1, "Surname is required"),
  idNumber: z.string().min(1, "ID/Passport number is required"),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(),
  pinNumber: z.string().optional(),
  occupation: z.string().optional(),
  residentialPhone: z.string().optional(),
  officePhone: z.string().optional(),
  mobile: z.string().optional(),
  postalAddress: z.string().optional(),
  postalCode: z.string().optional(),
  physicalAddress: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  tradeBusiness: z.string().optional(),
});

// Corporate Details Validation
export const corporateDetailsSchema = z.object({
  registeredName: z.string().min(1, "Company name is required"),
  registrationNumber: z.string().min(1, "Registration number is required"),
  countryOfRegistration: z.string().optional(),
  pinNumber: z.string().optional(),
  vatRegNumber: z.string().optional(),
  officePhone: z.string().optional(),
  mobileContact: z.string().optional(),
  postalAddress: z.string().optional(),
  postalCode: z.string().optional(),
  physicalAddress: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  tradeBusiness: z.string().optional(),
  yearsInOperation: z.number().optional(),
});

// Section B: Vehicle & Accident Validation
export const vehicleDetailsSchema = z.object({
  registrationNumber_primemover: z
    .string()
    .min(1, "Vehicle registration is required"),
  make: z.string().min(1, "Vehicle make is required"),
  model: z.string().min(1, "Vehicle model is required"),
  yearOfManufacture: z.number().min(1980, "Year must be 1980 or later").max(new Date().getFullYear(), "Year cannot be in the future").optional(),
  engineNumber: z.string().optional(),
  chassisNumber: z.string().optional(),
  color: z.string().optional(),
  estimatedValue: z.string().optional(),
  use: z.string().optional(),
});

export const accidentDetailsSchema = z.object({
  date: z.string().min(1, "Accident date is required"),
  time: z.string().optional(),
  location: z.string().min(1, "Accident location is required"),
  description: z
    .string()
    .min(10, "Please provide a detailed description (min 10 characters)"),

  // Add all the new fields here (mostly optional)
  roadSurface: z.enum(["dry", "murram", "wet"]).optional().or(z.literal("")),
  visibility: z.enum(["clear", "poor", "dark"]).optional().or(z.literal("")),
  driverWarningGiven: z.string().optional(),
  vehicleLightsOn: z.string().optional(),
  policeTookParticulars: z.boolean(),
  policeConstableNumber: z.string().optional(),
  policeStation: z.string().optional(),
  accidentSketchPath: z.string().optional(),
});

// Section C: Damage Assessment Validation
export const damageAssessmentSchema = z.object({
  vehicleDamageDescription: z.string().optional(),
  goodsDamaged: z.boolean(),
  goodsDescription: z.string().optional(),
  photos: z.array(z.object({
    angle: z.string(),
    url: z.string(),
    isGoodsPhoto: z.boolean(),
  })).optional(),
});

// Section D: Driver Declaration Validation
export const driverDetailsSchema = z.object({
  name: z.string().min(1, "Driver name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseExpiryDate: z.string().optional(),
  yearsOfDriving: z.string().optional(),
  relationship: z.string().optional(),
  hadAccidentBefore: z.boolean().optional(),
  accidentDetails: z.string().optional(),
  wasConvicted: z.boolean().optional(),
  convictionDetails: z.string().optional(),
  physicalDefects: z.string().optional(),
});

// Bank Details Validation
export const bankDetailsSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  branch: z.string().optional(),
  swiftCode: z.string().optional(),
});

// Complete Form Validation
export const completeFormSchema = z.object({
  // Policy details
  branchName: z.string().min(1),
  agentName: z.string().min(1),
  policyNumber: z.string().min(1),
  lastPaymentDate: z.string().optional(),
  insuredType: z.enum(['individual', 'corporate']),
  
  // Individual or Corporate (conditional)
  individual: individualDetailsSchema.optional(),
  corporate: corporateDetailsSchema.optional(),
  
  // Vehicle details
  vehicle: vehicleDetailsSchema,
  
  // Accident details
  accidentDate: z.string().min(1),
  accidentTime: z.string().min(1),
  accidentLocation: z.string().min(1),
  accidentDescription: z.string().min(10),
  vehicleDamageDescription: z.string().optional(),
  goodsDamaged: z.boolean(),
  goodsDescription: z.string().optional(),
  
  // Damage assessment
  damage: damageAssessmentSchema.optional(),
  
  // Driver details
  driver: driverDetailsSchema,
  
  // Bank details
  bank: bankDetailsSchema,
  
  // Declaration
  declaration: z.boolean(),
});

// Validation helper functions
export function validateStep(step: number, formData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  let isValid = true;

  try {
    switch (step) {
      case 1: // Policy Details
        policyDetailsSchema.parse({
          branchName: formData.branchName,
          agentName: formData.agentName,
          policyNumber: formData.policyNumber,
          lastPaymentDate: formData.lastPaymentDate,
          insuredType: formData.insuredType,
        });
        
        if (formData.insuredType === 'individual') {
          individualDetailsSchema.parse(formData.individual);
        } else if (formData.insuredType === 'corporate') {
          corporateDetailsSchema.parse(formData.corporate);
        }
        break;
        
      case 2: // Vehicle & Accident
        vehicleDetailsSchema.parse(formData.vehicle);
        accidentDetailsSchema.parse(formData.accident);
        break;
        
      case 3: // Damage Assessment
        // Photo upload is optional, just validate descriptions
        if (formData.goodsDamaged && !formData.goodsDescription) {
          errors.push("Please describe the goods damaged");
        }
        break;
        
      case 4: // Driver Declaration & Bank Details
        driverDetailsSchema.parse(formData.driver);
        bankDetailsSchema.parse(formData.bank);
        break;
        
      default:
        break;
    }
  } catch (error) {
    isValid = false;
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
    } else {
      errors.push('Validation error occurred');
    }
  }

  return { isValid, errors };
}

// Get required fields for each step
export function getRequiredFields(step: number, insuredType?: 'individual' | 'corporate'): string[] {
  switch (step) {
    case 1:
      const baseFields = ['branchName', 'agentName', 'policyNumber'];
      if (insuredType === 'individual') {
        return [...baseFields, 'individual.firstName', 'individual.surname', 'individual.idNumber'];
      } else if (insuredType === 'corporate') {
        return [...baseFields, 'corporate.registeredName', 'corporate.registrationNumber'];
      }
      return baseFields;
      
    case 2:
      return [
        'vehicle.registrationNumber_primemover',
        'vehicle.make',
        'vehicle.model',
        'accidentDate',
        'accidentTime',
        'accidentLocation',
        'accidentDescription'
      ];
      
    case 3:
      return []; // No required fields for damage assessment
      
    case 4:
      return [
        'driver.name',
        'driver.licenseNumber',
        'bank.bankName',
        'bank.accountName',
        'bank.accountNumber'
      ];
      
    default:
      return [];
  }
}

// Calculate form progress percentage
export function calculateProgress(formData: any): number {
  let totalFields = 0;
  let completedFields = 0;

  // Step 1: Policy Details
  const step1Fields = ['branchName', 'agentName', 'policyNumber'];
  totalFields += step1Fields.length;
  completedFields += step1Fields.filter(f => formData[f]).length;

  if (formData.insuredType === 'individual') {
    const individualFields = ['firstName', 'surname', 'idNumber'];
    totalFields += individualFields.length;
    completedFields += individualFields.filter(f => formData.individual?.[f]).length;
  } else if (formData.insuredType === 'corporate') {
    const corporateFields = ['registeredName', 'registrationNumber'];
    totalFields += corporateFields.length;
    completedFields += corporateFields.filter(f => formData.corporate?.[f]).length;
  }

  // Step 2: Vehicle & Accident
  const vehicleFields = ['registrationNumber', 'make', 'model'];
  totalFields += vehicleFields.length;
  completedFields += vehicleFields.filter(f => formData.vehicle?.[f]).length;

  const accidentFields = ['accidentDate', 'accidentTime', 'accidentLocation', 'accidentDescription'];
  totalFields += accidentFields.length;
  completedFields += accidentFields.filter(f => formData[f]).length;

  // Step 4: Driver & Bank
  const driverFields = ['name', 'licenseNumber'];
  totalFields += driverFields.length;
  completedFields += driverFields.filter(f => formData.driver?.[f]).length;

  const bankFields = ['bankName', 'accountName', 'accountNumber'];
  totalFields += bankFields.length;
  completedFields += bankFields.filter(f => formData.bank?.[f]).length;

  return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
}