
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CapsuleCard } from "./CapsuleCard";

interface CapsuleListProps {
  capsules: any[];
  onViewReport: (capsule: any) => void;
  error: string | null;
  onRetry: () => void;
}

export const CapsuleList = ({ 
  capsules, 
  onViewReport, 
  error, 
  onRetry 
}: CapsuleListProps) => {
  const navigate = useNavigate();
  
  const handleCreateNew = () => {
    navigate("/create");
  };

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        <p>Error loading virtual capsules: {error}</p>
        <Button className="mt-4" onClick={onRetry}>Try Again</Button>
      </div>
    );
  }

  if (capsules.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-medium mb-4">No revealed virtual capsules yet</h2>
        <p className="text-muted-foreground mb-6">You don't have any revealed virtual capsules yet. They will appear here when their reveal date is reached.</p>
        <Button onClick={handleCreateNew}>Create a Virtual Capsule</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {capsules.map((capsule) => (
        <CapsuleCard 
          key={capsule.id}
          capsule={capsule} 
          onViewReport={onViewReport} 
        />
      ))}
    </div>
  );
};
