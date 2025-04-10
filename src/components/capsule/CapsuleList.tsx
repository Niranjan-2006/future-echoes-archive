
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
        <h2 className="text-2xl font-medium mb-4">Reflection</h2>
        <p className="text-muted-foreground mb-6">No active time capsules found. Create a time capsule to get reflection questions.</p>
        <Button className="mx-auto" onClick={handleCreateNew}>Create a Time Capsule</Button>
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
