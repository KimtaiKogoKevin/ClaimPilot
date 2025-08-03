import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User, Building } from "lucide-react";

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
  setClaimId 
}: PolicyDetailsStepProps) {
  const { toast } = useToast();
  const [isCreatingClaim, setIsCreatingClaim] = useState(false);

  // Create claim mutation
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

  // Auto-save individual/corporate details
  const saveDetailsMutation = useMutation({
    mutationFn: async ({ endpoint, data }: { endpoint: string; data: any }) => {
      await apiRequest("POST", endpoint, data);
    },
    onError: (error) => {
      console.error("Error saving details:", error);
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
        insuredType: formData.insuredType,
        status: 'draft',
      });
    }
  }, [formData.policyNumber, claimId, isCreatingClaim]);

  // Auto-save details when claim ID is available
  useEffect(() => {
    if (claimId && formData.insuredType === 'individual' && formData.individual.firstName) {
      saveDetailsMutation.mutate({
        endpoint: `/api/claims/${claimId}/individual-details`,
        data: formData.individual,
      });
    }
  }, [claimId, formData.individual]);

  useEffect(() => {
    if (claimId && formData.insuredType === 'corporate' && formData.corporate.registeredName) {
      saveDetailsMutation.mutate({
        endpoint: `/api/claims/${claimId}/corporate-details`,
        data: formData.corporate,
      });
    }
  }, [claimId, formData.corporate]);

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

  const handleInsuredTypeChange = (value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      insuredType: value,
    }));
  };

  return (
    <Card className="shadow-sm border-neutral-200">
      <CardHeader>
        <CardTitle className="text-2xl text-neutral-800">Section A: Policy & Insurance Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Insured Type Selection */}
        <div>
          <Label className="text-sm font-medium text-neutral-700 mb-3 block">Insured Type</Label>
          <RadioGroup
            value={formData.insuredType}
            onValueChange={handleInsuredTypeChange}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem value="individual" id="individual" className="peer sr-only" />
              <Label
                htmlFor="individual"
                className="flex items-center space-x-3 border-2 border-neutral-200 rounded-xl p-4 cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary peer-checked:bg-opacity-5 hover:border-neutral-300"
              >
                <User className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold text-neutral-800">Individual</div>
                  <div className="text-sm text-neutral-600">Personal insurance policy</div>
                </div>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="corporate" id="corporate" className="peer sr-only" />
              <Label
                htmlFor="corporate"
                className="flex items-center space-x-3 border-2 border-neutral-200 rounded-xl p-4 cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary peer-checked:bg-opacity-5 hover:border-neutral-300"
              >
                <Building className="h-5 w-5 text-neutral-400 peer-checked:text-primary" />
                <div>
                  <div className="font-semibold text-neutral-800">Corporate</div>
                  <div className="text-sm text-neutral-600">Business insurance policy</div>
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
              onChange={(e) => handleDirectFieldChange('branchName', e.target.value)}
              placeholder="Enter branch name"
            />
          </div>
          <div>
            <Label htmlFor="agentName">Agent Name</Label>
            <Input
              id="agentName"
              value={formData.agentName}
              onChange={(e) => handleDirectFieldChange('agentName', e.target.value)}
              placeholder="Enter agent name"
            />
          </div>
          <div>
            <Label htmlFor="policyNumber">
              Policy Number <span className="text-accent">*</span>
            </Label>
            <Input
              id="policyNumber"
              value={formData.policyNumber}
              onChange={(e) => handleDirectFieldChange('policyNumber', e.target.value)}
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
              onChange={(e) => handleDirectFieldChange('lastPaymentDate', e.target.value)}
            />
          </div>
        </div>

        {/* Individual Details */}
        {formData.insuredType === 'individual' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-neutral-800 border-b border-neutral-200 pb-2">
              Individual Insured Details
            </h4>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="firstName">
                  First Name <span className="text-accent">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.individual.firstName}
                  onChange={(e) => handleInputChange('individual', 'firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  value={formData.individual.middleName}
                  onChange={(e) => handleInputChange('individual', 'middleName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="surname">
                  Surname <span className="text-accent">*</span>
                </Label>
                <Input
                  id="surname"
                  value={formData.individual.surname}
                  onChange={(e) => handleInputChange('individual', 'surname', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="idNumber">
                  ID/Passport Number <span className="text-accent">*</span>
                </Label>
                <Input
                  id="idNumber"
                  value={formData.individual.idNumber}
                  onChange={(e) => handleInputChange('individual', 'idNumber', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.individual.dateOfBirth}
                  onChange={(e) => handleInputChange('individual', 'dateOfBirth', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Corporate Details */}
        {formData.insuredType === 'corporate' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-neutral-800 border-b border-neutral-200 pb-2">
              Corporate Insured Details
            </h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="registeredName">
                  Company Registered Name <span className="text-accent">*</span>
                </Label>
                <Input
                  id="registeredName"
                  value={formData.corporate.registeredName}
                  onChange={(e) => handleInputChange('corporate', 'registeredName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="registrationNumber">
                  Registration Number <span className="text-accent">*</span>
                </Label>
                <Input
                  id="registrationNumber"
                  value={formData.corporate.registrationNumber}
                  onChange={(e) => handleInputChange('corporate', 'registrationNumber', e.target.value)}
                />
              </div>
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
