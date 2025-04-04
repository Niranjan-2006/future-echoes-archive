
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useRef } from "react";
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
  // Use a ref to track the last fetch time to prevent excessive refreshes
  const lastFetchTime = useRef<number>(0);
  // Flag to track if initial fetch has happened
  const initialFetchDone = useRef<boolean>(false);

  const fetchCapsules = useCallback(async (force: boolean = false) => {
    // Skip fetching if it was done recently (within last 5 seconds) unless forced
    const now = Date.now();
    if (!force && now - lastFetchTime.current < 5000 && initialFetchDone.current) {
      console.log("Skipping capsules fetch - data is recent");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get session without triggering a network request if possible
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        setLoading(false);
        setCapsules([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("time_capsules")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      
      setCapsules(data || []);
      lastFetchTime.current = now;
      initialFetchDone.current = true;
    } catch (err: any) {
      console.error("Error fetching capsules:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch capsules on initial mount only
  useEffect(() => {
    fetchCapsules(true);
  }, []);

  return (
    <CapsuleContext.Provider
      value={{
        capsules,
        loading,
        error,
        fetchCapsules: () => fetchCapsules(true),
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
