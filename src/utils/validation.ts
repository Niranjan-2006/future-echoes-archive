
import { toast } from "sonner";

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
