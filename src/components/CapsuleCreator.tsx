
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCapsules } from "@/contexts/CapsuleContext";
import { MessageInput } from "./capsule/MessageInput";
import { DateTimeSelector } from "./capsule/DateTimeSelector";
import { useFileUpload } from "@/hooks/useFileUpload";
import { validateDateAndTime } from "@/utils/validation";

export const CapsuleCreator = () => {
  const navigate = useNavigate();
  const { fetchCapsules } = useCapsules();
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  const { files, previewUrls, handleFileUpload, removeImage } = useFileUpload();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDateAndTime(date, time)) return;
    
    if (!message && previewUrls.length === 0) {
      toast.error("Please add a message or image to your virtual capsule");
      return;
    }

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const revealDate = date ? new Date(date) : new Date();
      if (time) {
        const [hours, minutes] = time.split(':');
        revealDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      }

      const { data, error } = await supabase.from("time_capsules").insert({
        message: message || "",
        reveal_date: revealDate.toISOString(),
        user_id: user.id,
        image_url: previewUrls[0] || null,
        sentiment_data: null // We'll analyze sentiment after creation
      }).select('id').single();

      if (error) throw error;
      
      toast.success("Virtual capsule created successfully!");
      
      setDate(undefined);
      setTime("");
      setMessage("");
      
      await fetchCapsules();
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <MessageInput 
          message={message}
          onMessageChange={setMessage}
          previewUrls={previewUrls}
          onImageUpload={handleFileUpload}
          onImageRemove={removeImage}
        />
        
        <DateTimeSelector 
          date={date}
          time={time}
          onDateChange={setDate}
          onTimeChange={setTime}
        />
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Virtual Capsule"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};
