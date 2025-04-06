
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
  
  // Update revealed capsules when capsules change
  useEffect(() => {
    const now = new Date();
    const revealed = capsules.filter(capsule => 
      new Date(capsule.reveal_date) <= now || capsule.is_revealed
    );
    setRevealedCapsules(revealed);
    console.log("Capsules updated, revealed count:", revealed.length);
  }, [capsules]);
  
  // Initial fetch
  useEffect(() => {
    console.log("Initial capsule fetch");
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
    console.log("Delete clicked for capsule ID:", capsule.id);
    setSelectedCapsule(capsule);
    setShowDeleteConfirm(true);
  };

  const handleDeleteCapsule = async () => {
    if (!selectedCapsule) {
      console.error("No capsule selected for deletion");
      return;
    }
    
    setIsDeleting(true);
    try {
      console.log("Deleting capsule with ID:", selectedCapsule.id);
      
      // Perform the delete operation
      const { error: deleteError } = await supabase
        .from("time_capsules")
        .delete()
        .eq("id", selectedCapsule.id);
      
      if (deleteError) {
        console.error("Supabase delete error:", deleteError);
        throw deleteError;
      }
      
      console.log("Delete operation successful");
      toast.success("Virtual capsule deleted successfully");
      
      // Close the dialog first
      setShowDeleteConfirm(false);
      setSelectedCapsule(null);
      
      // Then refresh the capsules list with force=true to bypass throttling
      await fetchCapsules();
      
      // Update local state to remove the deleted capsule immediately
      setRevealedCapsules(prev => prev.filter(c => c.id !== selectedCapsule.id));
      
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
        capsuleId={selectedCapsule?.id}
      />
    </main>
  );
};

export default Capsules;
