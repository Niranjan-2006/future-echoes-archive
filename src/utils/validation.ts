
import { toast } from "sonner";
import { SentimentAnalysis } from "@/integrations/supabase/client";

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

  return true;
};

export const validateSentiment = (
  message: string, 
  sentiment: SentimentAnalysis | null, 
  warnOnNegative: boolean = true
): boolean => {
  // If no message or very short message, no validation needed
  if (!message || message.trim().length <= 10) {
    return true;
  }
  
  // If sentiment analysis failed, don't block submission
  if (!sentiment) {
    return true;
  }
  
  // If sentiment is negative and warnings are enabled, show a confirmation
  if (warnOnNegative && 
      (sentiment.sentiment === "negative" || sentiment.sentiment === "NEGATIVE") && 
      sentiment.score > 0.7) {
    
    const confirmed = window.confirm(
      "Your message seems quite negative. Are you sure you want to save this for your future self?"
    );
    
    return confirmed;
  }
  
  return true;
};
