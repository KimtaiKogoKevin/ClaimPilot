import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface DriverDeclarationStepProps {
  formData: any;
  setFormData: (data: any) => void;
  claimId: string | null;
}

export default function DriverDeclarationStep({ 
  formData, 
  setFormData, 
  claimId 
}: DriverDeclarationStepProps) {
  const { toast } = useToast();

  // Auto-save driver details
  const saveDriverMutation = useMutation({
    mutationFn: async (driverData: any) => {
      if (!claimId) throw new Error("No claim ID");
      await apiRequest("POST", `/api/claims/${claimId}/driver`, driverData);
    },
    onError: (error) => {
      console.error("Error saving driver details:", error);
    },
  });

  // Auto-save bank details
  const saveBankMutation = useMutation({
    mutationFn: async (bankData: any) => {
      if (!claimId) throw new Error("No claim ID");
      await apiRequest("POST", `/api/claims/${claimId}/bank-details`, bankData);
    },
    onError: (error) => {
      console.error("Error saving bank details:", error);
    },
  });

  // Auto-save driver details when key fields change (for immediate feedback)
  useEffect(() => {
    if (claimId && formData.driver.name && formData.driver.licenseNumber) {
      const driverData = {
        ...formData.driver,
        yearsOfDriving: formData.driver.yearsOfDriving ? parseInt(formData.driver.yearsOfDriving) : null,
      };
      saveDriverMutation.mutate(driverData);
    }
  }, [claimId, formData.driver.name, formData.driver.licenseNumber]); // Only trigger on key fields

  // Auto-save bank details when key fields change (for immediate feedback)
  useEffect(() => {
    if (claimId && formData.bank.bankName && formData.bank.accountName && formData.bank.accountNumber) {
      saveBankMutation.mutate(formData.bank);
    }
  }, [claimId, formData.bank.bankName, formData.bank.accountName, formData.bank.accountNumber]); // Only trigger on key fields

  // Note: Complete form data is auto-saved through the main persistence system

  const handleDriverChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      driver: {
        ...prev.driver,
        [field]: value,
      },
    }));
  };

  const handleBankChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      bank: {
        ...prev.bank,
        [field]: value,
      },
    }));
  };

  return (
    <Card className="shadow-sm border-neutral-200">
      <CardHeader>
        <CardTitle className="text-2xl text-neutral-800">Section D: Driver Details & Declaration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Driver Information */}
        <div>
          <h4 className="text-lg font-semibold text-neutral-800 mb-4">Driver Information</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="driverName">
                Driver Name <span className="text-accent">*</span>
              </Label>
              <Input
                id="driverName"
                value={formData.driver.name}
                onChange={(e) => handleDriverChange('name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="licenseNumber">
                Driver License Number <span className="text-accent">*</span>
              </Label>
              <Input
                id="licenseNumber"
                value={formData.driver.licenseNumber}
                onChange={(e) => handleDriverChange('licenseNumber', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="driverOccupation">Occupation</Label>
              <Input
                id="driverOccupation"
                value={formData.driver.occupation}
                onChange={(e) => handleDriverChange('occupation', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="driverTelephone">Telephone</Label>
              <Input
                id="driverTelephone"
                value={formData.driver.telephone}
                onChange={(e) => handleDriverChange('telephone', e.target.value)}
              />
            </div>
          </div>
          <div className="mt-6">
            <Label htmlFor="driverAddress">Address</Label>
            <Textarea
              id="driverAddress"
              rows={2}
              value={formData.driver.address}
              onChange={(e) => handleDriverChange('address', e.target.value)}
            />
          </div>
        </div>

        {/* Conditional Questions */}
        <div className="space-y-6">
          <div className="bg-neutral-50 rounded-lg p-6">
            <h5 className="font-medium text-neutral-800 mb-4">Driver Assessment Questions</h5>
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-neutral-700 mb-3 block">
                  Was the driver employed by you?
                </Label>
                <RadioGroup
                  value={formData.driver.employedByInsured?.toString() || ""}
                  onValueChange={(value) => handleDriverChange('employedByInsured', value === 'true')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="employed-yes" />
                    <Label htmlFor="employed-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="employed-no" />
                    <Label htmlFor="employed-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium text-neutral-700 mb-3 block">
                  Was the driver driving with your permission?
                </Label>
                <RadioGroup
                  value={formData.driver.drivingWithPermission?.toString() || ""}
                  onValueChange={(value) => handleDriverChange('drivingWithPermission', value === 'true')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="permission-yes" />
                    <Label htmlFor="permission-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="permission-no" />
                    <Label htmlFor="permission-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium text-neutral-700 mb-3 block">
                  Was the driver in any way to blame for the accident?
                </Label>
                <RadioGroup
                  value={formData.driver.blameToBareForAccident?.toString() || ""}
                  onValueChange={(value) => handleDriverChange('blameToBareForAccident', value === 'true')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="blame-yes" />
                    <Label htmlFor="blame-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="blame-no" />
                    <Label htmlFor="blame-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium text-neutral-700 mb-3 block">
                  Did the driver admit liability?
                </Label>
                <RadioGroup
                  value={formData.driver.admittedLiability?.toString() || ""}
                  onValueChange={(value) => handleDriverChange('admittedLiability', value === 'true')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="liability-yes" />
                    <Label htmlFor="liability-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="liability-no" />
                    <Label htmlFor="liability-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium text-neutral-700 mb-3 block">
                  Has the driver had any previous accidents?
                </Label>
                <RadioGroup
                  value={formData.driver.previousAccidents?.toString() || ""}
                  onValueChange={(value) => handleDriverChange('previousAccidents', value === 'true')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="accidents-yes" />
                    <Label htmlFor="accidents-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="accidents-no" />
                    <Label htmlFor="accidents-no">No</Label>
                  </div>
                </RadioGroup>
                {formData.driver.previousAccidents && (
                  <div className="mt-3">
                    <Label htmlFor="accidentsDetails">Please provide details</Label>
                    <Textarea
                      id="accidentsDetails"
                      rows={2}
                      value={formData.driver.previousAccidentsDetails}
                      onChange={(e) => handleDriverChange('previousAccidentsDetails', e.target.value)}
                      placeholder="Provide details about previous accidents..."
                    />
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-neutral-700 mb-3 block">
                  Does the driver have any convictions for motor vehicle offences?
                </Label>
                <RadioGroup
                  value={formData.driver.convictions?.toString() || ""}
                  onValueChange={(value) => handleDriverChange('convictions', value === 'true')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="convictions-yes" />
                    <Label htmlFor="convictions-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="convictions-no" />
                    <Label htmlFor="convictions-no">No</Label>
                  </div>
                </RadioGroup>
                {formData.driver.convictions && (
                  <div className="mt-3">
                    <Label htmlFor="convictionsDetails">Please provide details</Label>
                    <Textarea
                      id="convictionsDetails"
                      rows={2}
                      value={formData.driver.convictionsDetails}
                      onChange={(e) => handleDriverChange('convictionsDetails', e.target.value)}
                      placeholder="Provide details about convictions..."
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div>
          <h4 className="text-lg font-semibold text-neutral-800 mb-4">Bank Details for Payment</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="bankName">
                Bank Name <span className="text-accent">*</span>
              </Label>
              <Input
                id="bankName"
                value={formData.bank.bankName}
                onChange={(e) => handleBankChange('bankName', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="accountName">
                Account Name <span className="text-accent">*</span>
              </Label>
              <Input
                id="accountName"
                value={formData.bank.accountName}
                onChange={(e) => handleBankChange('accountName', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="accountNumber">
                Account Number <span className="text-accent">*</span>
              </Label>
              <Input
                id="accountNumber"
                value={formData.bank.accountNumber}
                onChange={(e) => handleBankChange('accountNumber', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="swiftCode">Swift Code</Label>
              <Input
                id="swiftCode"
                value={formData.bank.swiftCode}
                onChange={(e) => handleBankChange('swiftCode', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="branch">Branch</Label>
              <Input
                id="branch"
                value={formData.bank.branch}
                onChange={(e) => handleBankChange('branch', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sortCode">Sort Code</Label>
              <Input
                id="sortCode"
                value={formData.bank.sortCode}
                onChange={(e) => handleBankChange('sortCode', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Declaration */}
        <div className="bg-neutral-50 rounded-lg p-6">
          <h5 className="font-medium text-neutral-800 mb-4">Declaration</h5>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox id="declaration1" required className="mt-1" />
              <Label htmlFor="declaration1" className="text-sm text-neutral-700">
                I declare that the information provided is true and accurate to the best of my knowledge.
              </Label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="declaration2" required className="mt-1" />
              <Label htmlFor="declaration2" className="text-sm text-neutral-700">
                I authorize the insurance company to process this claim based on the provided information and documentation.
              </Label>
            </div>
          </div>
        </div>

        {/* Status indicators */}
        {(saveDriverMutation.isPending || saveBankMutation.isPending) && (
          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Saving details...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
