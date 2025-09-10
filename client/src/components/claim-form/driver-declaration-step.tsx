import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "../ui/button";

interface DriverDeclarationStepProps {
  formData: any;
  setFormData: (data: any) => void;
  claimId: string | null;
}

export default function DriverDeclarationStep({
  formData,
  setFormData,
  claimId,
}: DriverDeclarationStepProps) {
  // --- HANDLER FUNCTIONS ---

  // For top-level properties like declaration fields
  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // For properties nested in formData.driver
  const handleDriverChange = (field: string, value: any) => {
    let processedValue = value;
    
    // Convert yearsOfDriving to number
    if (field === 'yearsOfDriving') {
      processedValue = value === '' || value === null || value === undefined 
        ? null 
        : parseInt(value, 10) || null;
    }
    
    setFormData((prev: any) => ({
      ...prev,
      driver: { ...prev.driver, [field]: processedValue },
    }));
  };

  // For properties nested in formData.bank
  const handleBankChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      bank: { ...prev.bank, [field]: value },
    }));
  };

  return (
    <div className="space-y-8">
      {/* ======================================================================= */}
      {/* CARD: DRIVER'S DETAILS                                                  */}
      {/* ======================================================================= */}
      <Card>
        <CardHeader>
          <CardTitle>Section D: Driver's Details</CardTitle>
          <CardDescription>
            This section should be completed by the owner/insured, even if they
            were the driver.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* --- Basic Information --- */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="driverName">Name</Label>
              <Input
                id="driverName"
                value={formData.driver.name}
                onChange={(e) => handleDriverChange("name", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="driverOccupation">Occupation</Label>
              <Input
                id="driverOccupation"
                value={formData.driver.occupation}
                onChange={(e) =>
                  handleDriverChange("occupation", e.target.value)
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="driverAddress">Address</Label>
              <Input
                id="driverAddress"
                value={formData.driver.address}
                onChange={(e) => handleDriverChange("address", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="driverDob">Date of Birth</Label>
              <Input
                id="driverDob"
                type="date"
                value={formData.driver.dateOfBirth}
                onChange={(e) =>
                  handleDriverChange("dateOfBirth", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="driverTelephone">Tel No.</Label>
              <Input
                id="driverTelephone"
                value={formData.driver.telephone}
                onChange={(e) =>
                  handleDriverChange("telephone", e.target.value)
                }
              />
            </div>
          </div>

          {/* --- Employment & Experience --- */}
          <div className="grid md:grid-cols-2 gap-6 pt-6 border-t">
            <div>
              <Label>Is he/she employed by you?</Label>
              <RadioGroup
                value={
                  formData.driver.employedByInsured === null
                    ? ""
                    : String(formData.driver.employedByInsured)
                }
                onValueChange={(v) =>
                  handleDriverChange("employedByInsured", v === "true")
                }
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="emp-yes" />
                  <Label htmlFor="emp-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="emp-no" />
                  <Label htmlFor="emp-no">No</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="yearsInService">How long in your service?</Label>
              <Input
                id="yearsInService"
                value={formData.driver.yearsInService}
                onChange={(e) =>
                  handleDriverChange("yearsInService", e.target.value)
                }
              />
            </div>
            <div>
              <Label>Was he/she driving with your permission?</Label>
              <RadioGroup
                value={
                  formData.driver.drivingWithPermission === null
                    ? ""
                    : String(formData.driver.drivingWithPermission)
                }
                onValueChange={(v) =>
                  handleDriverChange("drivingWithPermission", v === "true")
                }
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="perm-yes" />
                  <Label htmlFor="perm-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="perm-no" />
                  <Label htmlFor="perm-no">No</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="yearsOfDriving">
                How long has he/she been driving motor vehicles?
              </Label>
              <Input
                id="yearsOfDriving"
                type="number"
                min="0"
                value={formData.driver.yearsOfDriving?.toString() || ''}
                onChange={(e) =>
                  handleDriverChange("yearsOfDriving", e.target.value)
                }
              />
            </div>
          </div>

          {/* --- Accident Liability --- */}
          <div className="grid md:grid-cols-2 gap-6 pt-6 border-t">
            <div>
              <Label>Was he/she in any way to blame for the accident?</Label>
              <RadioGroup
                value={
                  formData.driver.blameToBareForAccident === null
                    ? ""
                    : String(formData.driver.blameToBareForAccident)
                }
                onValueChange={(v) =>
                  handleDriverChange("blameToBareForAccident", v === "true")
                }
                className="flex space-x-4 mt-2"
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
              <Label>Did he/she admit liability?</Label>
              <RadioGroup
                value={
                  formData.driver.admittedLiability === null
                    ? ""
                    : String(formData.driver.admittedLiability)
                }
                onValueChange={(v) =>
                  handleDriverChange("admittedLiability", v === "true")
                }
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="liab-yes" />
                  <Label htmlFor="liab-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="liab-no" />
                  <Label htmlFor="liab-no">No</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* --- Driving History --- */}
          <div className="space-y-6 pt-6 border-t">
            <div>
              <Label>Did he/she have any previous accidents?</Label>
              <RadioGroup
                value={
                  formData.driver.previousAccidents === null
                    ? ""
                    : String(formData.driver.previousAccidents)
                }
                onValueChange={(v) =>
                  handleDriverChange("previousAccidents", v === "true")
                }
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="prev-acc-yes" />
                  <Label htmlFor="prev-acc-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="prev-acc-no" />
                  <Label htmlFor="prev-acc-no">No</Label>
                </div>
              </RadioGroup>
              {formData.driver.previousAccidents && (
                <div className="mt-2 space-y-2">
                  <Label htmlFor="accidentsDetails">
                    If so, how many, and approximate date?
                  </Label>
                  <Textarea
                    id="accidentsDetails"
                    value={formData.driver.previousAccidentsDetails}
                    onChange={(e) =>
                      handleDriverChange(
                        "previousAccidentsDetails",
                        e.target.value
                      )
                    }
                  />
                </div>
              )}
            </div>
            <div>
              <Label>
                Has he/she any conviction for any offence in connection with any
                motor vehicle?
              </Label>
              <RadioGroup
                value={
                  formData.driver.convictions === null
                    ? ""
                    : String(formData.driver.convictions)
                }
                onValueChange={(v) =>
                  handleDriverChange("convictions", v === "true")
                }
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="conv-yes" />
                  <Label htmlFor="conv-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="conv-no" />
                  <Label htmlFor="conv-no">No</Label>
                </div>
              </RadioGroup>
              {formData.driver.convictions && (
                <div className="mt-2 space-y-2">
                  <Label htmlFor="convictionsDetails">
                    If so, give details including dates
                  </Label>
                  <Textarea
                    id="convictionsDetails"
                    value={formData.driver.convictionsDetails}
                    onChange={(e) =>
                      handleDriverChange("convictionsDetails", e.target.value)
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* --- License & Vehicle Ownership --- */}
          <div className="space-y-6 pt-6 border-t">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="licenseNumber">
                  Driver's Licence Number <span className="text-accent">*</span>
                </Label>
                <Input
                  id="licenseNumber"
                  value={formData.driver.licenseNumber}
                  onChange={(e) =>
                    handleDriverChange("licenseNumber", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label>Full or Provisional License?</Label>
                <RadioGroup
                  value={formData.driver.licenseType}
                  onValueChange={(v) => handleDriverChange("licenseType", v)}
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Full" id="lic-full" />
                    <Label htmlFor="lic-full">Full</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Provisional" id="lic-prov" />
                    <Label htmlFor="lic-prov">Provisional</Label>
                  </div>
                </RadioGroup>
              </div>
              {formData.driver.licenseType === "Full" && (
                <div>
                  <Label htmlFor="testPassedDate">
                    If full, state date when driving test first passed
                  </Label>
                  <Input
                    id="testPassedDate"
                    value={formData.driver.drivingTestPassedDate}
                    onChange={(e) =>
                      handleDriverChange(
                        "drivingTestPassedDate",
                        e.target.value
                      )
                    }
                  />
                </div>
              )}
            </div>
            <div>
              <Label>Does he/she own a Motor Vehicle?</Label>
              <RadioGroup
                value={
                  formData.driver.ownsMotorVehicle === null
                    ? ""
                    : String(formData.driver.ownsMotorVehicle)
                }
                onValueChange={(v) =>
                  handleDriverChange("ownsMotorVehicle", v === "true")
                }
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="owns-yes" />
                  <Label htmlFor="owns-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="owns-no" />
                  <Label htmlFor="owns-no">No</Label>
                </div>
              </RadioGroup>
              {formData.driver.ownsMotorVehicle && (
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="ownVehicleInsurer">
                      If so, give name and address of Insurer
                    </Label>
                    <Input
                      id="ownVehicleInsurer"
                      value={formData.driver.ownVehicleInsurer}
                      onChange={(e) =>
                        handleDriverChange("ownVehicleInsurer", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownVehiclePolicyNumber">
                      Driver's Policy No.
                    </Label>
                    <Input
                      id="ownVehiclePolicyNumber"
                      value={formData.driver.ownVehiclePolicyNumber}
                      onChange={(e) =>
                        handleDriverChange(
                          "ownVehiclePolicyNumber",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================================= */}
      {/* CARD: OWNER STATEMENT & BANK DETAILS                                    */}
      {/* ======================================================================= */}
      <Card>
        <CardHeader>
          <CardTitle>Owner/Insured Statement & Bank Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="ownerStatement">Statement by Owner/Insured</Label>
            <Textarea
              id="ownerStatement"
              value={formData.ownerStatement}
              onChange={(e) => handleChange("ownerStatement", e.target.value)}
              placeholder="If the below space is not enough, attach a detailed statement on a separate sheet..."
              rows={5}
            />
          </div>
          <div className="pt-6 border-t">
            <h4 className="text-md font-semibold text-neutral-800 mb-4">
              Bank Details for Payment
            </h4>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="bankName">
                  Bank Name <span className="text-accent">*</span>
                </Label>
                <Input
                  id="bankName"
                  value={formData.bank.bankName}
                  onChange={(e) => handleBankChange("bankName", e.target.value)}
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
                  onChange={(e) =>
                    handleBankChange("accountName", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleBankChange("accountNumber", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={formData.bank.branch}
                  onChange={(e) => handleBankChange("branch", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="swiftCode">Bank Swift Code</Label>
                <Input
                  id="swiftCode"
                  value={formData.bank.swiftCode}
                  onChange={(e) =>
                    handleBankChange("swiftCode", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="sortCode">Bank Sort Code</Label>
                <Input
                  id="sortCode"
                  value={formData.bank.sortCode}
                  onChange={(e) => handleBankChange("sortCode", e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================================= */}
      {/* CARD: DECLARATION                                                       */}
      {/* ======================================================================= */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>Declaration by Owner/Insured</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-neutral-700">
            I/We declare that all the answers are true and complete to the best
            of my/our knowledge. I/We hereby claim for the loss or damage as set
            out above.
          </p>
          <div className="grid md:grid-cols-3 gap-6 pt-4">
            <div>
              <Label htmlFor="declarationName">Name</Label>
              <Input
                id="declarationName"
                value={formData.declarationName}
                onChange={(e) =>
                  handleChange("declarationName", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="declarationTitle">Title</Label>
              <Input
                id="declarationTitle"
                value={formData.declarationTitle}
                onChange={(e) =>
                  handleChange("declarationTitle", e.target.value)
                }
                placeholder="e.g., Mr, Ms, Dr"
              />
            </div>
            <div>
              <Label>Signature</Label>
              <Button variant="outline" className="w-full" disabled>
                Upload Signature
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-4">
            <Checkbox
              id="declarationAccepted"
              checked={formData.declarationAccepted}
              onCheckedChange={(checked) =>
                handleChange("declarationAccepted", checked)
              }
            />
            <Label
              htmlFor="declarationAccepted"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              By checking this box, I confirm the above declaration.
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
