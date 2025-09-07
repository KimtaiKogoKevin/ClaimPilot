import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useStandaloneAuth } from "@/hooks/useStandaloneAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Download, FileText, AlertCircle, Car, User, CheckCircle, Clock, XCircle, Camera, CreditCard, Truck, Info, MapPin, Calendar, Eye } from "lucide-react";
import type { ClaimWithDetails } from "@shared/schema";

export default function ClaimDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useStandaloneAuth();
  const { toast } = useToast();
  const [claim, setClaim] = useState<ClaimWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch claim details
  useEffect(() => {
    if (!id || !isAuthenticated) return;

    const fetchClaim = async () => {
      try {
        const response = await fetch(`/api/claims/${id}`);
        if (!response.ok) {
          if (response.status === 401) {
            toast({
              title: "Unauthorized",
              description: "You are logged out. Logging in again...",
              variant: "destructive",
            });
            setTimeout(() => {
              window.location.href = "/auth";
            }, 500);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const claimData = await response.json();
        setClaim(claimData);
      } catch (error) {
        console.error("Error fetching claim:", error);
        if (isUnauthorizedError(error as Error)) {
          toast({
            title: "Unauthorized",
            description: "You are logged out. Logging in again...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/auth";
          }, 500);
          return;
        }
        toast({
          title: "Error",
          description: "Failed to load claim details. Please try again.",
          variant: "destructive",
        });
        setLocation("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchClaim();
  }, [id, isAuthenticated, toast, setLocation]);

  const handleDownloadPDF = async () => {
    if (!claim) return;
    
    try {
      const response = await fetch(`/api/staff/claims/${claim.id}/pdf`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Unauthorized",
            description: "You are logged out. Logging in again...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/auth";
          }, 500);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `claim-${claim.id.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF Downloaded",
        description: "Your claim report has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading claim details...</p>
        </div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Claim not found</p>
          <Button onClick={() => setLocation("/dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Claim Details
                </h1>
                <p className="text-gray-600">Claim ID: {claim.id}</p>
              </div>
              <div className="flex space-x-3">
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                    claim.status
                  )}`}
                >
                  {claim.status.replace("_", " ").toUpperCase()}
                </span>
                <Button
                  onClick={handleDownloadPDF}
                  className="flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>

                <Dialog
                  open={isIncidentModalOpen}
                  onOpenChange={setIsIncidentModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Info className="h-4 w-4 mr-2" />
                      View Incident Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center text-xl font-bold text-gray-800">
                        <AlertCircle className="h-6 w-6 mr-2 text-red-500" />
                        Complete Incident Information
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 mt-6">
                      {/* Accident Details Section */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h3 className="flex items-center text-lg font-semibold text-red-800 mb-4">
                          <MapPin className="h-5 w-5 mr-2" />
                          Accident Information
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-red-700 mb-1">
                              Date & Time
                            </label>
                            <div className="bg-white p-3 rounded border border-red-200">
                              <div className="flex items-center text-gray-900">
                                <Calendar className="h-4 w-4 mr-2 text-red-500" />
                                {claim?.accidentDate
                                  ? new Date(
                                      claim.accidentDate
                                    ).toLocaleDateString()
                                  : "Not specified"}
                                {claim?.accidentTime &&
                                  ` at ${claim.accidentTime}`}
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-red-700 mb-1">
                              Location
                            </label>
                            <div className="bg-white p-3 rounded border border-red-200">
                              <div className="text-gray-900">
                                {claim?.accidentLocation || "Not specified"}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-red-700 mb-1">
                            Description of Incident
                          </label>
                          <div className="bg-white p-4 rounded border border-red-200">
                            <div className="text-gray-900 whitespace-pre-wrap">
                              {claim?.accidentDescription ||
                                "No description provided"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Vehicle Information Section */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="flex items-center text-lg font-semibold text-blue-800 mb-4">
                          <Car className="h-5 w-5 mr-2" />
                          Vehicle Information
                        </h3>
                        {claim?.vehicle ? (
                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-blue-700 mb-1">
                                Make & Model
                              </label>
                              <div className="bg-white p-3 rounded border border-blue-200">
                                <div className="text-gray-900">
                                  {claim.vehicle.make} {claim.vehicle.model}
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-blue-700 mb-1">
                                Year
                              </label>
                              <div className="bg-white p-3 rounded border border-blue-200">
                                <div className="text-gray-900">
                                  {claim.vehicle.yearOfManufacture ||
                                    "Not specified"}
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-blue-700 mb-1">
                                Registration Number (prime Mover / Truck)
                              </label>
                              <div className="bg-white p-3 rounded border border-blue-200">
                                <div className="text-gray-900">
                                  {claim.vehicle
                                    .registrationNumber_primemover ||
                                    "Not specified"}
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-blue-700 mb-1">
                                Registration Number Trailer 
                              </label>
                              <div className="bg-white p-3 rounded border border-blue-200">
                                <div className="text-gray-900">
                                  {claim.vehicle
                                    .registrationNumber_trailer ||
                                    "Not specified"}
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-blue-700 mb-1">
                                Owner
                              </label>
                              <div className="bg-white p-3 rounded border border-blue-200">
                                <div className="text-gray-900">
                                  {claim.vehicle.ownerName || "Not specified"}
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-blue-700 mb-1">
                                Vehicle Use
                              </label>
                              <div className="bg-white p-3 rounded border border-blue-200">
                                <div className="text-gray-900">
                                  {claim.vehicle.vehicleUse || "Not specified"}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-600">
                            No vehicle information available
                          </div>
                        )}
                      </div>

                      {/* Other Vehicles Section */}
                      {claim?.otherVehicles &&
                        claim.otherVehicles.length > 0 && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                            <h3 className="flex items-center text-lg font-semibold text-orange-800 mb-4">
                              <Truck className="h-5 w-5 mr-2" />
                              Other Vehicles Involved
                            </h3>
                            <div className="space-y-4">
                              {claim.otherVehicles.map((vehicle, index) => (
                                <div
                                  key={index}
                                  className="bg-white border border-orange-200 rounded-lg p-4"
                                >
                                  <h4 className="font-medium text-orange-800 mb-3">
                                    Vehicle {index + 1}
                                  </h4>
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-orange-700 mb-1">
                                        Owner Name
                                      </label>
                                      <div className="bg-orange-50 p-2 rounded border border-orange-200">
                                        <div className="text-gray-900">
                                          {vehicle.ownerName || "Not specified"}
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-orange-700 mb-1">
                                        Registration
                                      </label>
                                      <div className="bg-orange-50 p-2 rounded border border-orange-200">
                                        <div className="text-gray-900">
                                          {vehicle.registrationNumber ||
                                            "Not specified"}
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-orange-700 mb-1">
                                        Owner Address
                                      </label>
                                      <div className="bg-orange-50 p-2 rounded border border-orange-200">
                                        <div className="text-gray-900">
                                          {vehicle.ownerAddress ||
                                            "Not specified"}
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-orange-700 mb-1">
                                        Insurer
                                      </label>
                                      <div className="bg-orange-50 p-2 rounded border border-orange-200">
                                        <div className="text-gray-900">
                                          {vehicle.insurer || "Not specified"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Damage Assessment Section */}
                      {claim?.damagedPhotos &&
                        claim.damagedPhotos.length > 0 && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                            <h3 className="flex items-center text-lg font-semibold text-purple-800 mb-4">
                              <Camera className="h-5 w-5 mr-2" />
                              Damage Assessment
                            </h3>
                            <div className="space-y-4">
                              {claim.damagedPhotos.map((photo, index) => (
                                <div
                                  key={index}
                                  className="bg-white border border-purple-200 rounded-lg p-4"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-purple-800">
                                      Photo {index + 1}: {photo.angle}
                                    </h4>
                                    <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded">
                                      {photo.isGoodsPhoto
                                        ? "Goods Photo"
                                        : "Vehicle Photo"}
                                    </span>
                                  </div>

                                  {photo.detectedDamages &&
                                  photo.detectedDamages.length > 0 ? (
                                    <div className="space-y-2">
                                      <div className="font-medium text-purple-700">
                                        AI Detected Damages:
                                      </div>
                                      {photo.detectedDamages.map(
                                        (damage, damageIndex) => (
                                          <div
                                            key={damageIndex}
                                            className="bg-purple-50 border border-purple-200 rounded p-3"
                                          >
                                            <div className="text-sm text-purple-800">
                                              <strong>
                                                Damage {damageIndex + 1}:
                                              </strong>{" "}
                                              {damage.damageType ||
                                                "Unspecified type"}
                                            </div>
                                            <div className="text-sm text-purple-600 mt-1">
                                              Confidence:{" "}
                                              {damage.confidence
                                                ? (
                                                    parseFloat(
                                                      damage.confidence
                                                    ) * 100
                                                  ).toFixed(1) + "%"
                                                : "N/A"}
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-purple-600 text-sm">
                                      No damages detected in this photo
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    <div className="flex justify-end mt-6 pt-4 border-t">
                      <Button
                        onClick={() => setIsIncidentModalOpen(false)}
                        className="bg-gray-600 hover:bg-gray-700 text-white"
                      >
                        Close
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Claim Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Policy Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Policy Information
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Policy Number
                  </p>
                  <p className="text-gray-900">{claim.policyNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Insured Type
                  </p>
                  <p className="text-gray-900 capitalize">
                    {claim.insuredType}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Branch Name
                  </p>
                  <p className="text-gray-900">{claim.branchName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Agent Name
                  </p>
                  <p className="text-gray-900">{claim.agentName || "N/A"}</p>
                </div>
                {/* NEW: Type of Cover Display */}
                <div>
                  {" "}
                  {/* You can integrate this into the grid above if it fits better */}
                  <p className="text-sm font-medium text-gray-500">
                    Type of Cover
                  </p>
                  <p className="text-gray-900">{claim.typeOfCover || "N/A"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Last Payment Date
                </p>
                <p className="text-gray-900">
                  {claim.lastPaymentDate
                    ? new Date(claim.lastPaymentDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Claimant Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Claimant Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-gray-900">
                  {claim.claimant.firstName} {claim.claimant.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-900">{claim.claimant.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Date Created
                  </p>
                  <p className="text-gray-900">
                    {new Date(claim.createdAt!).toLocaleDateString()}
                  </p>
                </div>
                {claim.submittedAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Date Submitted
                    </p>
                    <p className="text-gray-900">
                      {new Date(claim.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          {claim.vehicle && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Vehicle Information
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Make</p>
                    <p className="text-gray-900">{claim.vehicle.make}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Model</p>
                    <p className="text-gray-900">{claim.vehicle.model}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Year</p>
                    <p className="text-gray-900">
                      {claim.vehicle.yearOfManufacture || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Registration (Prime Mover / Truck)
                    </p>
                    <p className="text-gray-900">
                      {claim.vehicle.registrationNumber_primemover || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Registration (Trailer)
                    </p>
                    <p className="text-gray-900">
                      {claim.vehicle.registrationNumber_trailer|| "N/A"}
                    </p>
                  </div>
                
                  
                  </div>
                </div>
              </div>
            
          )}

          {/* Accident Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Accident Details
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-gray-900">
                    {claim.accidentDate
                      ? new Date(claim.accidentDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <p className="text-gray-900">{claim.accidentTime || "N/A"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-gray-900">
                  {claim.accidentLocation || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-gray-900">
                  {claim.accidentDescription || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Driver Information */}
          {claim.driver && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-green-600" />
                Driver Information
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-gray-900">{claim.driver.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      ID Number
                    </p>
                    <p className="text-gray-900">
                      {claim.driver.licenseNumber || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      License Number
                    </p>
                    <p className="text-gray-900">
                      {claim.driver.licenseNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Years of Driving
                    </p>
                    <p className="text-gray-900">
                      {claim.driver.yearsOfDriving || "N/A"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-gray-900">
                    {claim.driver.address || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Telephone</p>
                  <p className="text-gray-900">
                    {claim.driver.telephone || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bank Details */}
          {claim.bankDetails && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-purple-600" />
                Bank Details
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Bank Name
                    </p>
                    <p className="text-gray-900">
                      {claim.bankDetails.bankName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Branch</p>
                    <p className="text-gray-900">
                      {claim.bankDetails.branch || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Account Number
                    </p>
                    <p className="text-gray-900">
                      {claim.bankDetails.accountNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Swift Code
                    </p>
                    <p className="text-gray-900">
                      {claim.bankDetails.swiftCode || "N/A"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Account Name
                  </p>
                  <p className="text-gray-900">
                    {claim.bankDetails.accountName}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Other Vehicles */}
          {claim.otherVehicles && claim.otherVehicles.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2 text-orange-600" />
                Other Vehicles Involved
              </h2>
              <div className="space-y-4">
                {claim.otherVehicles.map((vehicle, index) => (
                  <div
                    key={vehicle.id}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <h3 className="font-medium text-gray-900 mb-2">
                      Vehicle {index + 1}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Owner Name
                        </p>
                        <p className="text-gray-900">
                          {vehicle.ownerName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Owner Address
                        </p>
                        <p className="text-gray-900">
                          {vehicle.ownerAddress || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Registration
                        </p>
                        <p className="text-gray-900">
                          {vehicle.registrationNumber || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Insurer
                        </p>
                        <p className="text-gray-900">
                          {vehicle.insurer || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Details */}
          {claim.individualDetails && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Individual Details
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p className="text-gray-900">
                    {claim.individualDetails.firstName}{" "}
                    {claim.individualDetails.middleName || ""}{" "}
                    {claim.individualDetails.surname}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      ID Number
                    </p>
                    <p className="text-gray-900">
                      {claim.individualDetails.idNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Nationality
                    </p>
                    <p className="text-gray-900">
                      {claim.individualDetails.nationality || "N/A"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-gray-900">
                    {claim.individualDetails.physicalAddress || "N/A"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-gray-900">
                      {claim.individualDetails.mobile || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">
                      {claim.individualDetails.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Corporate Details */}
          {claim.corporateDetails && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Corporate Details
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Company Name
                  </p>
                  <p className="text-gray-900">
                    {claim.corporateDetails.registeredName}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Registration Number
                    </p>
                    <p className="text-gray-900">
                      {claim.corporateDetails.registrationNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Years in Operation
                    </p>
                    <p className="text-gray-900">
                      {claim.corporateDetails.yearsInOperation || "N/A"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-gray-900">
                    {claim.corporateDetails.physicalAddress || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Driver Information */}
          {claim.driver && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Driver Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-gray-900">{claim.driver.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      License Number
                    </p>
                    <p className="text-gray-900">
                      {claim.driver.licenseNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      License Type
                    </p>
                    <p className="text-gray-900">
                      {claim.driver.licenseType || "N/A"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Years of Driving
                  </p>
                  <p className="text-gray-900">
                    {claim.driver.yearsOfDriving || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bank Details */}
          {claim.bankDetails && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Bank Details
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Bank Name
                    </p>
                    <p className="text-gray-900">
                      {claim.bankDetails.bankName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Account Name
                    </p>
                    <p className="text-gray-900">
                      {claim.bankDetails.accountName}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Account Number
                    </p>
                    <p className="text-gray-900">
                      {claim.bankDetails.accountNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Branch</p>
                    <p className="text-gray-900">
                      {claim.bankDetails.branch || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Damage Photos */}
        {claim.damagedPhotos && claim.damagedPhotos.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Damage Photos & AI Analysis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {claim.damagedPhotos.map((photo, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <img
                    src={`/objects/${photo.objectPath.split("/objects/")[1]}`}
                    alt={`${photo.angle} damage view`}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML =
                          '<div class="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">Image not available</div>';
                      }
                    }}
                  />
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {photo.angle?.replace("_", " ") || "Damage Photo"}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {photo.isGoodsPhoto ? "Goods Damage" : "Vehicle Damage"}
                    </p>
                    {photo.detectedDamages &&
                      photo.detectedDamages.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-green-600 mb-2">
                            ✓ {photo.detectedDamages.length} damage
                            {photo.detectedDamages.length !== 1 ? "s" : ""}{" "}
                            detected
                          </p>
                          <div className="space-y-1">
                            {photo.detectedDamages.map(
                              (damage, damageIndex) => (
                                <div
                                  key={damageIndex}
                                  className="text-xs bg-gray-100 rounded px-2 py-1"
                                >
                                  {damage.damageType}:{" "}
                                  {Math.round(
                                    parseFloat(damage.confidence || "0") * 100
                                  )}
                                  % confidence
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Damage Assessment */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Damage Assessment
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Vehicle Damage Description
              </p>
              <p className="text-gray-900">
                {claim.vehicleDamageDescription || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Goods Damaged</p>
              <p className="text-gray-900">
                {claim.goodsDamaged ? "Yes" : "No"}
              </p>
            </div>
            {claim.goodsDamaged && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Goods Description
                </p>
                <p className="text-gray-900">
                  {claim.goodsDescription || "N/A"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}