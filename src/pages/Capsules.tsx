
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useCapsules } from "@/contexts/CapsuleContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Lock, Unlock } from "lucide-react";

const Capsules = () => {
  const { capsules, loading, error, fetchCapsules } = useCapsules();
  const navigate = useNavigate();
  const [now] = useState(new Date());

  useEffect(() => {
    fetchCapsules();
  }, [fetchCapsules]);

  const handleCreateNew = () => {
    navigate("/create");
  };

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <div className="container mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Time Capsules</h1>
          <Button onClick={handleCreateNew}>Create New Capsule</Button>
        </div>

        {loading && <p className="text-center py-8">Loading your time capsules...</p>}
        
        {error && (
          <div className="text-center text-red-500 py-8">
            <p>Error loading time capsules: {error}</p>
            <Button className="mt-4" onClick={fetchCapsules}>Try Again</Button>
          </div>
        )}

        {!loading && !error && capsules.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-medium mb-4">No time capsules yet</h2>
            <p className="text-muted-foreground mb-6">Create your first time capsule to leave a message for your future self.</p>
            <Button onClick={handleCreateNew}>Create Your First Capsule</Button>
          </div>
        )}

        {!loading && !error && capsules.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capsules.map((capsule) => {
              const revealDate = new Date(capsule.reveal_date);
              const canOpen = revealDate <= now || capsule.is_revealed;
              
              return (
                <Card key={capsule.id} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      Time Capsule
                      {canOpen ? (
                        <Unlock className="h-5 w-5 text-green-500" />
                      ) : (
                        <Lock className="h-5 w-5 text-orange-500" />
                      )}
                    </CardTitle>
                    <CardDescription>
                      Created on {format(new Date(capsule.created_at), "PPP")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {canOpen ? (
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
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">
                          This capsule will be revealed on:
                        </p>
                        <p className="font-medium text-lg">
                          {format(revealDate, "PPP 'at' p")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    {!canOpen && (
                      <p className="text-sm text-muted-foreground">
                        {Math.ceil((revealDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days remaining
                      </p>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default Capsules;
