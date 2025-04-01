
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CapsuleProvider } from "@/contexts/CapsuleContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import CreateCapsule from "./pages/CreateCapsule";
import Capsules from "./pages/Capsules";

const queryClient = new QueryClient({
  // Configure React Query to reduce network requests
  defaultOptions: {
    queries: {
      staleTime: 60000, // Data stays fresh for 1 minute
      gcTime: 300000, // Cache is kept for 5 minutes (formerly cacheTime)
      retry: 1, // Only retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
    },
  },
});

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check current session just once on initial load
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error("Error checking session:", error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkInitialSession();

    // Listen for auth changes without unnecessary rerenders
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (["SIGNED_IN", "TOKEN_REFRESHED"].includes(event)) {
        setIsAuthenticated(true);
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Show nothing while checking auth to prevent flashing of login screen
  if (isCheckingAuth) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <CapsuleProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={isAuthenticated ? <Index /> : <Navigate to="/auth" />}
              />
              <Route
                path="/create"
                element={isAuthenticated ? <CreateCapsule /> : <Navigate to="/auth" />}
              />
              <Route
                path="/capsules"
                element={isAuthenticated ? <Capsules /> : <Navigate to="/auth" />}
              />
              <Route
                path="/auth"
                element={!isAuthenticated ? <Auth /> : <Navigate to="/" />}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CapsuleProvider>
    </QueryClientProvider>
  );
};

export default App;
