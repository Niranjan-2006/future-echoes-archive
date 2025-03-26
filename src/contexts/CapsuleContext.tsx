
import React, { createContext, useState, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CapsuleContextType {
  capsules: any[];
  loading: boolean;
  error: string | null;
  fetchCapsules: () => Promise<void>;
}

const CapsuleContext = createContext<CapsuleContextType | undefined>(undefined);

export function CapsuleProvider({ children }: { children: ReactNode }) {
  const [capsules, setCapsules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCapsules = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("time_capsules")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      
      setCapsules(data || []);
    } catch (err: any) {
      console.error("Error fetching capsules:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CapsuleContext.Provider
      value={{
        capsules,
        loading,
        error,
        fetchCapsules,
      }}
    >
      {children}
    </CapsuleContext.Provider>
  );
}

export function useCapsules() {
  const context = useContext(CapsuleContext);
  if (context === undefined) {
    throw new Error("useCapsules must be used within a CapsuleProvider");
  }
  return context;
}
