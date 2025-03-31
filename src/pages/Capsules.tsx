
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useCapsules } from "@/contexts/CapsuleContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Clock, Unlock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Capsules = () => {
  const { capsules, loading, error, fetchCapsules } = useCapsules();
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchCapsules();
  }, [fetchCapsules]);

  const handleCreateNew = () => {
    navigate("/create");
  };

  // Filter capsules to only show revealed ones with current time
  const revealedCapsules = capsules.filter(capsule => {
    const now = new Date(); // Get current time for each evaluation
    return new Date(capsule.reveal_date) <= now || capsule.is_revealed;
  });

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <div className="container mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Revealed Virtual Capsules</h1>
          <Button onClick={handleCreateNew}>Create New Capsule</Button>
        </div>
        
        {error && (
          <div className="text-center text-red-500 py-8">
            <p>Error loading virtual capsules: {error}</p>
            <Button className="mt-4" onClick={fetchCapsules}>Try Again</Button>
          </div>
        )}

        {!error && revealedCapsules.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-medium mb-4">No revealed virtual capsules yet</h2>
            <p className="text-muted-foreground mb-6">You don't have any revealed virtual capsules yet. They will appear here when their reveal date is reached.</p>
            <Button onClick={handleCreateNew}>Create a Virtual Capsule</Button>
          </div>
        )}

        {!error && revealedCapsules.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {revealedCapsules.map((capsule) => (
              <Card key={capsule.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Revealed Capsule
                    <Unlock className="h-5 w-5 text-green-500" />
                  </CardTitle>
                  <CardDescription>
                    Created on {format(new Date(capsule.created_at), "PPP")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="mb-4">{capsule.message}</p>
                    {capsule.image_url && (
                      <div className="mt-4 rounded-md overflow-hidden">
                        <img
                          src={capsule.image_url}
                          alt="Capsule attachment"
                          className="w-full h-auto max-h-48 object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Revealed on {format(new Date(capsule.reveal_date), "PPP")}
                  </p>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Capsules;
