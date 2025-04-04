
import { format } from "date-fns";
import { Clock, FileText, Trash2, Unlock } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CapsuleCardProps {
  capsule: any;
  onViewReport: (capsule: any) => void;
  onDeleteClick: (capsule: any) => void;
}

export const CapsuleCard = ({ capsule, onViewReport, onDeleteClick }: CapsuleCardProps) => {
  return (
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
            onClick={() => onViewReport(capsule)}
            className="flex items-center gap-1"
          >
            <FileText className="h-4 w-4" />
            Report
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => onDeleteClick(capsule)}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
