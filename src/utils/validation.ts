
import { toast } from "sonner";
import { SentimentAnalysis } from "@/integrations/supabase/client";
import { addDays, isAfter } from "date-fns";

export const validateDateAndTime = (date: Date | undefined, time: string): boolean => {
  if (!date) {
    toast.error("Please select a reveal date");
    return false;
  }

  const revealDate = new Date(date);
  if (time) {
    const [hours, minutes] = time.split(':');
    revealDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  } else {
    toast.error("Please select a reveal time");
    return false;
  }

  const now = new Date();
  if (revealDate <= now) {
    toast.error("Reveal date and time must be in the future");
    return false;
  }
  
  // Check if the selected date is within 30 days
  const maxDate = addDays(now, 30);
  if (isAfter(revealDate, maxDate)) {
    toast.error("Set a reveal date within 30 days!");
    return false;
  }

  return true;
};

// This function now returns a promise that resolves to a boolean
export const validateSentiment = async (
  message: string, 
  sentiment: SentimentAnalysis | null, 
  warnOnNegative: boolean = true
): Promise<boolean> => {
  // If no message or very short message, no validation needed
  if (!message || message.trim().length <= 10) {
    return true;
  }
  
  // If sentiment analysis failed, don't block submission
  if (!sentiment) {
    console.log("No sentiment data available for validation");
    return true;
  }
  
  console.log("Validating sentiment:", sentiment);
  
  // If sentiment is negative and warnings are enabled, show a confirmation dialog
  if (warnOnNegative && 
      (sentiment.sentiment === "negative" || sentiment.sentiment === "NEGATIVE") && 
      sentiment.score > 0.7) {
    
    // Instead of using window.confirm, we return a Promise that will be resolved by the dialog
    return new Promise((resolve) => {
      // Set a global variable that the dialog component will use
      window.sentimentConfirmationCallback = (confirmed: boolean) => {
        resolve(confirmed);
      };
      
      // Dispatch a custom event to trigger the dialog display
      window.dispatchEvent(new CustomEvent('show-sentiment-confirmation', {
        detail: { message }
      }));
    });
  }
  
  return true;
};
