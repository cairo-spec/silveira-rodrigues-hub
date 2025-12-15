import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import MemberDashboard from "@/components/members/MemberDashboard";
import AdminDashboard from "@/components/admin/AdminDashboard";

const Membros = () => {
  const navigate = useNavigate();
  const { user, isLoading, isAdmin } = useAuth();
  const [checkingContract, setCheckingContract] = useState(true);
  const [hasAcceptedContract, setHasAcceptedContract] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
      return;
    }

    // Check if user has accepted the contract (admins bypass this check)
    const checkContractStatus = async () => {
      if (!user) return;

      // Admins can always access
      if (isAdmin) {
        setHasAcceptedContract(true);
        setCheckingContract(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("contract_accepted, trial_active, subscription_active")
          .eq("user_id", user.id)
          .maybeSingle();

        // Allow access for all authenticated users (free, trial, or subscribers)
        // Free users have restricted features but can still access the member area
        setHasAcceptedContract(true);
      } catch (error) {
        console.error("Error checking contract status:", error);
      } finally {
        setCheckingContract(false);
      }
    };

    if (user) {
      checkContractStatus();
    }
  }, [user, isLoading, isAdmin, navigate]);

  if (isLoading || checkingContract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !hasAcceptedContract) {
    return null;
  }

  return isAdmin ? <AdminDashboard /> : <MemberDashboard />;
};

export default Membros;
