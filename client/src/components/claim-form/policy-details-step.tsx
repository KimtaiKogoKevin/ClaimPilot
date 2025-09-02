import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User, Building } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // FIX: Corrected import path

interface PolicyDetailsStepProps {
  formData: any;
  setFormData: (data: any) => void;
  claimId: string | null;
  setClaimId: (id: string) => void;
}

export default function PolicyDetailsStep({
  formData,
  setFormData,
  claimId,
  setClaimId,
}: PolicyDetailsStepProps) {
  const { toast } = useToast();
  const [isCreatingClaim, setIsCreatingClaim] = useState(false);

  // Create claim mutation (no changes needed)
  const createClaimMutation = useMutation({
    mutationFn: async (claimData: any) => {
      const response = await apiRequest("POST", "/api/claims", claimData);
      return response.json();
    },
    onSuccess: (data) => {
      setClaimId(data.id);
      toast({
        title: "Claim Created",
        description: "Your claim has been created and saved.",
      });
    },
    onError: (error) => {
      console.error("Error creating claim:", error);
      toast({
        title: "Error",
        description: "Failed to create claim. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create claim when we have sufficient data
  useEffect(() => {
    if (!claimId && formData.policyNumber && !isCreatingClaim) {
      setIsCreatingClaim(true);
      createClaimMutation.mutate({
        policyNumber: formData.policyNumber,
        branchName: formData.branchName,
        agentName: formData.agentName,
        lastPaymentDate: formData.lastPaymentDate || null,
        typeOfCover: formData.typeOfCover, // FIX: Use consistent camelCase
        insuredType: formData.insuredType,
        status: "draft",
      });
    }
  }, [formData.policyNumber, claimId, isCreatingClaim]);

  // Handler functions (no changes needed)
  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleDirectFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInsuredTypeChange = (value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      insuredType: value,
    }));
  };

  const handleRadioChange = (field: string, value: string) => {
    handleDirectFieldChange(field, value === "yes");
  };

  return (
    <Card className="shadow-sm border-neutral-200">
      <CardHeader>
        <CardTitle className="text-2xl text-neutral-800">
          Section A: Policy, Finance & Insured Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Insured Type Selection */}
        <div>
          <Label className="text-sm font-medium text-neutral-700 mb-3 block">
            Insured Type
          </Label>
          <RadioGroup
            value={formData.insuredType}
            onValueChange={handleInsuredTypeChange}
            className="grid grid-cols-2 gap-4"
          >
            {/* ... Individual and Corporate Radio Labels ... */}
            <div>
              <RadioGroupItem
                value="individual"
                id="individual"
                className="peer sr-only"
              />
              <Label
                htmlFor="individual"
                className="flex items-center space-x-3 border-2 border-neutral-200 rounded-xl p-4 cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary peer-checked:bg-opacity-5 hover:border-neutral-300"
              >
                <User className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold text-neutral-800">
                    Individual
                  </div>
                  <div className="text-sm text-neutral-600">
                    Personal insurance policy
                  </div>
                </div>
              </Label>
            </div>
            <div>
              <RadioGroupItem
                value="corporate"
                id="corporate"
                className="peer sr-only"
              />
              <Label
                htmlFor="corporate"
                className="flex items-center space-x-3 border-2 border-neutral-200 rounded-xl p-4 cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary peer-checked:bg-opacity-5 hover:border-neutral-300"
              >
                <Building className="h-5 w-5 text-neutral-400 peer-checked:text-primary" />
                <div>
                  <div className="font-semibold text-neutral-800">
                    Corporate
                  </div>
                  <div className="text-sm text-neutral-600">
                    Business insurance policy
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Policy Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="branchName">Branch Name</Label>
            <Input
              id="branchName"
              value={formData.branchName}
              onChange={(e) =>
                handleDirectFieldChange("branchName", e.target.value)
              }
              placeholder="Enter branch name"
            />
          </div>
          <div>
            <Label htmlFor="agentName">Agent Name</Label>
            <Input
              id="agentName"
              value={formData.agentName}
              onChange={(e) =>
                handleDirectFieldChange("agentName", e.target.value)
              }
              placeholder="Enter agent name"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="policyNumber">
              Policy Number <span className="text-accent">*</span>
            </Label>
            <Input
              id="policyNumber"
              value={formData.policyNumber}
              onChange={(e) =>
                handleDirectFieldChange("policyNumber", e.target.value)
              }
              placeholder="Enter policy number"
              required
            />
          </div>
          <div>
            <Label htmlFor="lastPaymentDate">Last Premium Payment Date</Label>
            <Input
              id="lastPaymentDate"
              type="date"
              value={formData.lastPaymentDate}
              onChange={(e) =>
                handleDirectFieldChange("lastPaymentDate", e.target.value)
              }
            />
          </div>
          <div>
            <Label htmlFor="typeOfCover">
              Type of Cover <span className="text-accent">*</span>
            </Label>
            <Select
              value={formData.typeOfCover} // FIX: Use consistent camelCase
              onValueChange={(value) =>
                handleSelectChange("typeOfCover", value)
              }
            >
              <SelectTrigger id="typeOfCover">
                <SelectValue placeholder="Select cover type" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                <SelectItem value="TPF&T">
                  Third Party, Fire & Theft (TPF&T)
                </SelectItem>
                <SelectItem value="TPO">Third Party Only (TPO)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Finance & Insurance Information */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-neutral-800 border-b border-neutral-200 pb-2">
            Finance & Additional Insurance
          </h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="financeCompanyName">
                Name of hire purchase or finance company (if any)
              </Label>
              <Input
                id="financeCompanyName"
                value={formData.financeCompanyName}
                onChange={(e) =>
                  handleDirectFieldChange("financeCompanyName", e.target.value)
                }
                placeholder="Enter company name"
              />
            </div>
            <div>
              <Label className="mb-2 block">
                Is there any other insurance in force upon the vehicle?
              </Label>
              <RadioGroup
                value={formData.hasOtherInsurance ? "yes" : "no"}
                onValueChange={(value) =>
                  handleRadioChange("hasOtherInsurance", value)
                }
                className="flex space-x-4"
              >
                {/* ... RadioGroupItems ... */}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="other-insurance-yes" />
                  <Label htmlFor="other-insurance-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="other-insurance-no" />
                  <Label htmlFor="other-insurance-no">No</Label>
                </div>
              </RadioGroup>
            </div>
            {formData.hasOtherInsurance && (
              <div className="md:col-span-2">
                <Label htmlFor="otherInsuranceDetails">
                  If so, please supply details
                </Label>
                <Textarea
                  id="otherInsuranceDetails"
                  value={formData.otherInsuranceDetails}
                  onChange={(e) =>
                    handleDirectFieldChange(
                      "otherInsuranceDetails",
                      e.target.value
                    )
                  }
                  placeholder="Enter name of insurer, policy number, etc."
                />
              </div>
            )}
            <div>
              <Label className="mb-2 block">
                Did you purchase a loan repayment cover?
              </Label>
              <RadioGroup
                value={formData.hasLoanRepaymentCover ? "yes" : "no"}
                onValueChange={(value) =>
                  handleRadioChange("hasLoanRepaymentCover", value)
                }
                className="flex space-x-4"
              >
                {/* ... RadioGroupItems ... */}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="loan-cover-yes" />
                  <Label htmlFor="loan-cover-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="loan-cover-no" />
                  <Label htmlFor="loan-cover-no">No</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          {formData.hasLoanRepaymentCover && (
            <div className="grid md:grid-cols-4 gap-6 pt-4">
              {/* ... Loan Detail Inputs ... */}
              <div>
                <Label htmlFor="loanPrincipalAmount">
                  Total Principal Loan Amount
                </Label>
                <Input
                  id="loanPrincipalAmount"
                  type="number"
                  step="0.01"
                  value={formData.loanPrincipalAmount || ""}
                  onChange={(e) =>
                    handleDirectFieldChange(
                      "loanPrincipalAmount",
                      parseFloat(e.target.value)
                    )
                  }
                  placeholder="e.g., 50000"
                />
              </div>
              <div>
                <Label htmlFor="loanInterestAmount">Total Interest</Label>
                <Input
                  id="loanInterestAmount"
                  type="number"
                  step="0.01"
                  value={formData.loanInterestAmount || ""}
                  onChange={(e) =>
                    handleDirectFieldChange(
                      "loanInterestAmount",
                      parseFloat(e.target.value)
                    )
                  }
                  placeholder="e.g., 5000"
                />
              </div>
              <div>
                <Label htmlFor="monthlyInstalment">Monthly Instalment</Label>
                <Input
                  id="monthlyInstalment"
                  type="number"
                  step="0.01"
                  value={formData.monthlyInstalment || ""}
                  onChange={(e) =>
                    handleDirectFieldChange(
                      "monthlyInstalment",
                      parseFloat(e.target.value)
                    )
                  }
                  placeholder="e.g., 1500"
                />
              </div>
              <div>
                <Label htmlFor="loanCoveragePercentage">
                  Percentage Covered
                </Label>
                <div className="relative">
                  <Input
                    id="loanCoveragePercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.loanCoveragePercentage || ""}
                    onChange={(e) =>
                      handleDirectFieldChange(
                        "loanCoveragePercentage",
                        parseFloat(e.target.value)
                      )
                    }
                    placeholder="e.g., 85"
                    className="pr-8"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Individual Details */}
        {formData.insuredType === "individual" && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-neutral-800 border-b border-neutral-200 pb-2">
              Individual Insured Details
            </h4>

            {/* --- Personal Information Group --- */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* ... Personal Info Inputs ... */}
              <div>
                <Label htmlFor="firstName">
                  First Name <span className="text-accent">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.individual.firstName}
                  onChange={(e) =>
                    handleInputChange("individual", "firstName", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  value={formData.individual.middleName}
                  onChange={(e) =>
                    handleInputChange(
                      "individual",
                      "middleName",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="surname">
                  Surname <span className="text-accent">*</span>
                </Label>
                <Input
                  id="surname"
                  value={formData.individual.surname}
                  onChange={(e) =>
                    handleInputChange("individual", "surname", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="idNumber">
                  ID/Passport Number <span className="text-accent">*</span>
                </Label>
                <Input
                  id="idNumber"
                  value={formData.individual.idNumber}
                  onChange={(e) =>
                    handleInputChange("individual", "idNumber", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.individual.dateOfBirth}
                  onChange={(e) =>
                    handleInputChange(
                      "individual",
                      "dateOfBirth",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={formData.individual.nationality}
                  onChange={(e) =>
                    handleInputChange(
                      "individual",
                      "nationality",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            {/* --- Professional Information Group --- */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* ... Professional Info Inputs ... */}
              <div>
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={formData.individual.occupation}
                  onChange={(e) =>
                    handleInputChange(
                      "individual",
                      "occupation",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="pinNumber">PIN Number</Label>
                <Input
                  id="pinNumber"
                  value={formData.individual.pinNumber}
                  onChange={(e) =>
                    handleInputChange("individual", "pinNumber", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="tradeBusiness">Trade/Business</Label>
                <Input
                  id="tradeBusiness"
                  value={formData.individual.tradeBusiness}
                  onChange={(e) =>
                    handleInputChange(
                      "individual",
                      "tradeBusiness",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            {/* --- Contact Information Group --- */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* ... Contact Info Inputs ... */}
              <div>
                <Label htmlFor="mobile">
                  Mobile Phone <span className="text-accent">*</span>
                </Label>
                <Input
                  id="mobile"
                  value={formData.individual.mobile}
                  onChange={(e) =>
                    handleInputChange("individual", "mobile", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="residentialPhone">Residential Phone</Label>
                <Input
                  id="residentialPhone"
                  value={formData.individual.residentialPhone}
                  onChange={(e) =>
                    handleInputChange(
                      "individual",
                      "residentialPhone",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="officePhone">Office Phone</Label>
                <Input
                  id="officePhone"
                  value={formData.individual.officePhone}
                  onChange={(e) =>
                    handleInputChange(
                      "individual",
                      "officePhone",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            {/* --- Address Information Group --- */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* ... Address Info Inputs ... */}
              <div>
                <Label htmlFor="email">
                  Email Address <span className="text-accent">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.individual.email}
                  onChange={(e) =>
                    handleInputChange("individual", "email", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="physicalAddress">Physical Address</Label>
                <Input
                  id="physicalAddress"
                  value={formData.individual.physicalAddress}
                  onChange={(e) =>
                    handleInputChange(
                      "individual",
                      "physicalAddress",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="postalAddress">Postal Address</Label>
                <Input
                  id="postalAddress"
                  value={formData.individual.postalAddress}
                  onChange={(e) =>
                    handleInputChange(
                      "individual",
                      "postalAddress",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.individual.postalCode}
                  onChange={(e) =>
                    handleInputChange(
                      "individual",
                      "postalCode",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
            {/* --- Age Band Selection --- */}
            {/* FIX: Removed the duplicated code block */}
            <div>
              <Label className="text-sm font-medium text-neutral-700 mb-3 block">
                Age Band <span className="text-accent">*</span>
              </Label>
              <RadioGroup
                value={formData.individual.ageBand}
                onValueChange={(value) =>
                  handleInputChange("individual", "ageBand", value)
                }
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="18-21"
                    id="age-18-21"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="age-18-21"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    18-21 yrs
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="22-40"
                    id="age-22-40"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="age-22-40"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    22-40 yrs
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="41-69"
                    id="age-41-69"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="age-41-69"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    41-69 yrs
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="70+"
                    id="age-70-plus"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="age-70-plus"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    Above 70
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Corporate Details */}
        {formData.insuredType === "corporate" && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-neutral-800 border-b border-neutral-200 pb-2">
              Corporate Insured Details
            </h4>

            {/* --- Company Information Group --- */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="registeredName">
                  Company Registered Name <span className="text-accent">*</span>
                </Label>
                <Input
                  id="registeredName"
                  value={formData.corporate.registeredName}
                  onChange={(e) =>
                    handleInputChange(
                      "corporate",
                      "registeredName",
                      e.target.value
                    )
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="registrationNumber">
                  Registration Number <span className="text-accent">*</span>
                </Label>
                <Input
                  id="registrationNumber"
                  value={formData.corporate.registrationNumber}
                  onChange={(e) =>
                    handleInputChange(
                      "corporate",
                      "registrationNumber",
                      e.target.value
                    )
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="countryOfRegistration">
                  Country of Registration
                </Label>
                <Input
                  id="countryOfRegistration"
                  value={formData.corporate.countryOfRegistration}
                  onChange={(e) =>
                    handleInputChange(
                      "corporate",
                      "countryOfRegistration",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="yearsInOperation">Years in Operation</Label>
                <Input
                  id="yearsInOperation"
                  type="number"
                  value={formData.corporate.yearsInOperation || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "corporate",
                      "yearsInOperation",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="pinNumber">PIN Number</Label>
                <Input
                  id="pinNumber"
                  value={formData.corporate.pinNumber}
                  onChange={(e) =>
                    handleInputChange("corporate", "pinNumber", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="vatRegNumber">VAT Registration Number</Label>
                <Input
                  id="vatRegNumber"
                  value={formData.corporate.vatRegNumber}
                  onChange={(e) =>
                    handleInputChange(
                      "corporate",
                      "vatRegNumber",
                      e.target.value
                    )
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="tradeBusiness">Trade/Business</Label>
                <Input
                  id="tradeBusiness"
                  value={formData.corporate.tradeBusiness}
                  onChange={(e) =>
                    handleInputChange(
                      "corporate",
                      "tradeBusiness",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            {/* --- Contact & Address Information Group --- */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="email">
                  Company Email Address <span className="text-accent">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.corporate.email}
                  onChange={(e) =>
                    handleInputChange("corporate", "email", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="officePhone">
                  Office Phone <span className="text-accent">*</span>
                </Label>
                <Input
                  id="officePhone"
                  value={formData.corporate.officePhone}
                  onChange={(e) =>
                    handleInputChange(
                      "corporate",
                      "officePhone",
                      e.target.value
                    )
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="mobileContact">Mobile Contact</Label>
                <Input
                  id="mobileContact"
                  value={formData.corporate.mobileContact}
                  onChange={(e) =>
                    handleInputChange(
                      "corporate",
                      "mobileContact",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="physicalAddress">Physical Address</Label>
                <Input
                  id="physicalAddress"
                  value={formData.corporate.physicalAddress}
                  onChange={(e) =>
                    handleInputChange(
                      "corporate",
                      "physicalAddress",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="postalAddress">Postal Address</Label>
                <Input
                  id="postalAddress"
                  value={formData.corporate.postalAddress}
                  onChange={(e) =>
                    handleInputChange(
                      "corporate",
                      "postalAddress",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.corporate.postalCode}
                  onChange={(e) =>
                    handleInputChange("corporate", "postalCode", e.target.value)
                  }
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-neutral-700 mb-3 block">
                How long has the company been in operation?{" "}
                <span className="text-accent">*</span>
              </Label>
              <RadioGroup
                value={formData.corporate.yearsInOperation}
                onValueChange={(value) =>
                  handleInputChange("corporate", "yearsInOperation", value)
                }
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {/* Option 1 */}
                <div>
                  <RadioGroupItem
                    value="0-1"
                    id="op-years-0-1"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="op-years-0-1"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    0-1 yrs
                  </Label>
                </div>
                {/* Option 2 */}
                <div>
                  <RadioGroupItem
                    value="2-3"
                    id="op-years-2-3"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="op-years-2-3"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    2-3 yrs
                  </Label>
                </div>
                {/* Option 3 */}
                <div>
                  <RadioGroupItem
                    value="4-5"
                    id="op-years-4-5"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="op-years-4-5"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    4-5 yrs
                  </Label>
                </div>
                {/* Option 4 */}
                <div>
                  <RadioGroupItem
                    value="5+"
                    id="op-years-5-plus"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="op-years-5-plus"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    Over 5 yrs
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Status indicator */}
        {createClaimMutation.isPending && (
          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Creating claim...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
