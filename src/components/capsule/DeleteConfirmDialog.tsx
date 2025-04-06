import { Loader2 } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  capsuleId?: string;
}

export const DeleteConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting,
  capsuleId
}: DeleteConfirmDialogProps) => {
  // Handle confirmation with proper async/await
  const handleConfirm = async () => {
    try {
      console.log("Starting delete operation for capsule ID:", capsuleId);
      await onConfirm();
      // The dialog will be closed by the parent after delete completes
    } catch (error) {
      console.error("Error in delete confirmation:", error);
      // Keep dialog open on error
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isDeleting) onClose();
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Virtual Capsule</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this virtual capsule (ID: {capsuleId})? 
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
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
  );
};
