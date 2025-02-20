
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  industry: string;
  created_at: string;
}

interface JobRole {
  id: string;
  title: string;
  company_id: string;
  created_at: string;
}

interface InterviewSession {
  id: string;
  user_id: string;
  role_id: string;
  status: 'pending' | 'completed' | 'in_progress';
  created_at: string;
}

const Setup = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };

    const fetchCompanies = async () => {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*');
        if (error) throw error;
        setCompanies(data || []);
      } catch (error: any) {
        toast.error("Failed to fetch companies");
      }
    };

    checkAuth();
    fetchCompanies();
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!selectedCompany) {
        setRoles([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('job_roles')
          .select('*')
          .eq('company_id', selectedCompany);
        if (error) throw error;
        setRoles(data || []);
      } catch (error: any) {
        toast.error("Failed to fetch roles");
      }
    };

    fetchRoles();
  }, [selectedCompany]);

  const startInterview = async () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: user.id,
          role_id: selectedRole,
          status: 'pending'
        } as Partial<InterviewSession>)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("No data returned");
      
      navigate(`/interview/${data.id}`);
    } catch (error: any) {
      toast.error("Failed to start interview");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto max-w-2xl pt-16">
        <Card>
          <CardHeader>
            <CardTitle>Setup Your Interview</CardTitle>
            <CardDescription>
              Select the company and role you're interested in practicing for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Company</label>
              <Select
                value={selectedCompany}
                onValueChange={setSelectedCompany}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Role</label>
              <Select
                value={selectedRole}
                onValueChange={setSelectedRole}
                disabled={!selectedCompany}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={startInterview}
              className="w-full"
              disabled={!selectedRole}
            >
              Start Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Setup;
