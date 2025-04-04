
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { useCapsules } from "@/contexts/CapsuleContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CapsuleList } from "@/components/capsule/CapsuleList";
import { SentimentReportDialog } from "@/components/capsule/SentimentReportDialog";
import { DeleteConfirmDialog } from "@/components/capsule/DeleteConfirmDialog";

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
      
      // Remove deleted capsule from local context
      await fetchCapsules();
      
      // Close dialog and reset selection
      setShowDeleteConfirm(false);
      setSelectedCapsule(null);
    } catch (error: any) {
      console.error("Error in delete handler:", error);
      toast.error(`Error deleting capsule: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <div className="container mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Revealed Virtual Capsules</h1>
          <Button onClick={handleCreateNew}>Create New Capsule</Button>
        </div>
        
        <CapsuleList
          capsules={revealedCapsules}
          onViewReport={handleViewReport}
          onDeleteClick={handleDeleteClick}
          error={error}
          onRetry={() => fetchCapsules()}
        />
      </div>

      <SentimentReportDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        capsule={selectedCapsule}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteCapsule}
        isDeleting={isDeleting}
      />
    </main>
  );
};

export default Capsules;
