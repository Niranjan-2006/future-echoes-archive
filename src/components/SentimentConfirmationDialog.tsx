
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";

// Extend the Window interface to include our callback
declare global {
  interface Window {
    sentimentConfirmationCallback?: (confirmed: boolean) => void;
  }
}

export function SentimentConfirmationDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Listen for the custom event to show the dialog
    const handleShowDialog = () => {
      setOpen(true);
    };

    window.addEventListener('show-sentiment-confirmation', handleShowDialog);
    
    return () => {
      window.removeEventListener('show-sentiment-confirmation', handleShowDialog);
    };
  }, []);

  const handleConfirm = () => {
    if (window.sentimentConfirmationCallback) {
      window.sentimentConfirmationCallback(true);
    }
    setOpen(false);
  };

  const handleCancel = () => {
    if (window.sentimentConfirmationCallback) {
      window.sentimentConfirmationCallback(false);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen && window.sentimentConfirmationCallback) {
        window.sentimentConfirmationCallback(false);
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Future Echoes Saya</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Your message seems quite negative. Are you sure you want to save this for your future self?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-4 mt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
