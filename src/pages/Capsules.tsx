
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { useCapsules } from "@/contexts/CapsuleContext";
import { Button } from "@/components/ui/button";
import { CapsuleList } from "@/components/capsule/CapsuleList";
import { SentimentReportDialog } from "@/components/capsule/SentimentReportDialog";

const Capsules = () => {
  const { capsules, loading, error, fetchCapsules } = useCapsules();
  const navigate = useNavigate();
  const [revealedCapsules, setRevealedCapsules] = useState<any[]>([]);
  const [selectedCapsule, setSelectedCapsule] = useState<any>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  
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
    fetchCapsules(true); // Force initial fetch
  }, []);

  const handleCreateNew = () => {
    navigate("/create");
  };

  const handleViewReport = (capsule: any) => {
    setSelectedCapsule(capsule);
    setShowReportDialog(true);
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
          error={error}
          onRetry={() => fetchCapsules(true)}
        />
      </div>

      <SentimentReportDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        capsule={selectedCapsule}
      />
    </main>
  );
};

export default Capsules;
