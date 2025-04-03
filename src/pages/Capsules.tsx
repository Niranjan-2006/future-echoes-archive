
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useCapsules } from "@/contexts/CapsuleContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Clock, Unlock, FileText, Trash2, Loader2 } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Capsules = () => {
  const { capsules, loading, error, fetchCapsules } = useCapsules();
  const navigate = useNavigate();
  const [revealedCapsules, setRevealedCapsules] = useState<any[]>([]);
  const [selectedCapsule, setSelectedCapsule] = useState<any>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const now = new Date();
    const revealed = capsules.filter(capsule => 
      new Date(capsule.reveal_date) <= now || capsule.is_revealed
    );
    setRevealedCapsules(revealed);
  }, [capsules]);
  
  useEffect(() => {
    fetchCapsules();
  }, []);

  const handleCreateNew = () => {
    navigate("/create");
  };

  const handleViewReport = (capsule: any) => {
    setSelectedCapsule(capsule);
    setShowReportDialog(true);
  };

  const handleDeleteClick = (capsule: any) => {
    setSelectedCapsule(capsule);
    setShowDeleteConfirm(true);
  };

  const handleDeleteCapsule = async () => {
    if (!selectedCapsule) return;
    
    setIsDeleting(true);
    try {
      console.log("Deleting capsule with ID:", selectedCapsule.id);
      
      const { error } = await supabase
        .from("time_capsules")
        .delete()
        .eq("id", selectedCapsule.id);
      
      if (error) {
        console.error("Supabase delete error:", error);
        throw error;
      }
      
      console.log("Delete operation successful");
      
      toast.success("Virtual capsule deleted successfully");
      
      // Remove deleted capsule from local state to avoid UI flicker
      setRevealedCapsules(prevCapsules => 
        prevCapsules.filter(capsule => capsule.id !== selectedCapsule.id)
      );
      
      // Close dialog and reset selection
      setShowDeleteConfirm(false);
      setSelectedCapsule(null);
      
      // Fetch updated capsules list after a short delay to allow the database to update
      setTimeout(() => {
        fetchCapsules();
      }, 500);
    } catch (error: any) {
      console.error("Error in delete handler:", error);
      toast.error(`Error deleting capsule: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatSentiment = (capsule: any) => {
    if (!capsule || !capsule.sentiment_data) {
      return { label: "Not analyzed", color: "text-gray-500" };
    }
    
    const sentiment = typeof capsule.sentiment_data === 'string' 
      ? JSON.parse(capsule.sentiment_data) 
      : capsule.sentiment_data;
    
    if (sentiment.sentiment === "positive" || sentiment.sentiment === "POSITIVE") {
      return { label: "Positive", color: "text-green-500" };
    } else if (sentiment.sentiment === "negative" || sentiment.sentiment === "NEGATIVE") {
      return { label: "Negative", color: "text-red-500" };
    } else {
      return { label: "Neutral", color: "text-yellow-500" };
    }
  };

  const getSentimentDetails = (capsule: any) => {
    if (!capsule || !capsule.sentiment_data) {
      return null;
    }
    
    const sentiment = typeof capsule.sentiment_data === 'string' 
      ? JSON.parse(capsule.sentiment_data) 
      : capsule.sentiment_data;
    
    return sentiment;
  };

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
                <CardFooter className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Revealed on {format(new Date(capsule.reveal_date), "PPP")}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewReport(capsule)}
                      className="flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      Report
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteClick(capsule)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sentiment Analysis Report</DialogTitle>
            <DialogDescription>
              This report shows the sentiment analysis of your virtual capsule message.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCapsule && (
            <div className="py-4 space-y-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-1">Message</h3>
                <p className="text-sm text-muted-foreground border-l-2 pl-3 py-1">{selectedCapsule.message}</p>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="text-sm font-medium mb-3">Sentiment Analysis</h3>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Sentiment:</span>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded ${formatSentiment(selectedCapsule).color}`}>
                    {formatSentiment(selectedCapsule).label}
                  </span>
                </div>
                
                {getSentimentDetails(selectedCapsule) && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Confidence Score:</span> 
                      {(getSentimentDetails(selectedCapsule).score * 100).toFixed(1)}%
                    </div>
                    
                    {getSentimentDetails(selectedCapsule).analysis && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <div className="text-xs text-muted-foreground mb-1 font-medium">Detailed Analysis:</div>
                        <div className="space-y-1">
                          {getSentimentDetails(selectedCapsule).analysis[0] && 
                            getSentimentDetails(selectedCapsule).analysis[0].map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span>{item.label}:</span>
                                <span className="font-mono">{(item.score * 100).toFixed(1)}%</span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {!getSentimentDetails(selectedCapsule) && (
                  <div className="text-xs text-muted-foreground italic mt-2">
                    No detailed sentiment analysis available for this message.
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Created On</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedCapsule.created_at), "PPP")}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowReportDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Virtual Capsule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this virtual capsule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteCapsule}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Capsules;
