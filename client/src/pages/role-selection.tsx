import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, CheckCircle, Building } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const roles = [
  {
    id: 'insured',
    title: 'Insured/Client',
    description: 'Submit and manage your insurance claims with AI-powered damage assessment',
    icon: Users,
    color: 'bg-blue-100 text-blue-800',
    features: ['Submit new claims', 'AI damage analysis', 'Upload vehicle photos', 'Track claim progress', 'Real-time updates']
  },
  {
    id: 'insurer',
    title: 'Insurer/Underwriter',
    description: 'Review claims, assess risks, and make settlement decisions',
    icon: Shield,
    color: 'bg-purple-100 text-purple-800',
    features: ['Review AI assessments', 'Approve/reject claims', 'Risk evaluation', 'Settlement approval', 'Fraud detection']
  },
  {
    id: 'broker',
    title: 'Broker/Agent',
    description: 'Assist clients and coordinate between parties',
    icon: Building,
    color: 'bg-green-100 text-green-800', 
    features: ['Client assistance', 'Claim coordination', 'Documentation support', 'Communication hub', 'Status updates']
  },
  {
    id: 'service_provider',
    title: 'Service Provider',
    description: 'Provide repair estimates and services based on AI analysis',
    icon: CheckCircle,
    color: 'bg-orange-100 text-orange-800',
    features: ['AI damage review', 'Repair estimates', 'Service scheduling', 'Progress reporting', 'Quality assessment']
  }
];

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Check for pending role from signup flow
  useEffect(() => {
    const pendingRole = localStorage.getItem('pendingUserRole');
    if (pendingRole) {
      setSelectedRole(pendingRole);
      localStorage.removeItem('pendingUserRole');
    }
  }, []);

  const handleRoleUpdate = async () => {
    if (!selectedRole) {
      toast({
        title: "Please select a role",
        description: "Choose your role to continue",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      await apiRequest('PUT', '/api/auth/update-role', { role: selectedRole });

      toast({
        title: "Role Updated",
        description: "Your role has been updated successfully. Redirecting...",
      });

      // Redirect based on role
      setTimeout(() => {
        if (selectedRole === 'insured') {
          window.location.href = '/';
        } else {
          window.location.href = '/staff-portal';
        }
      }, 1000);

    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update your role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-neutral-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 mb-4">Choose Your Role</h1>
          <p className="text-neutral-600 text-lg">Select your role to access the appropriate features and dashboard</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <Card 
                key={role.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 rounded-full ${role.color} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="flex items-center justify-center gap-2">
                    {role.title}
                    {isSelected && <CheckCircle className="h-5 w-5 text-primary" />}
                  </CardTitle>
                  <p className="text-neutral-600 text-sm">{role.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {role.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-neutral-600">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedRole && (
          <div className="text-center">
            <div className="mb-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Selected: {roles.find(r => r.id === selectedRole)?.title}
              </Badge>
            </div>
            <Button 
              onClick={handleRoleUpdate}
              disabled={isUpdating}
              className="bg-primary hover:bg-blue-600 px-8 py-3 text-lg"
            >
              {isUpdating ? 'Updating...' : 'Continue to Dashboard'}
            </Button>
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-neutral-500 text-sm">
            You can change your role later from your profile settings
          </p>
        </div>
      </div>
    </div>
  );
}