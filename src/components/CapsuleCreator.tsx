
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, ImageIcon, Loader2, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { supabase, analyzeSentiment } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCapsules } from "@/contexts/CapsuleContext";

export const CapsuleCreator = () => {
  const navigate = useNavigate();
  const { fetchCapsules } = useCapsules();
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
    
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateDateAndTime = (): boolean => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDateAndTime()) return;
    
    if (!message && previewUrls.length === 0) {
      toast.error("Please add a message or image to your time capsule");
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

      let sentimentData = null;
      if (message) {
        try {
          sentimentData = await analyzeSentiment(message);
          console.log("Sentiment analysis result:", sentimentData);
        } catch (sentimentError) {
          console.error("Error with sentiment analysis:", sentimentError);
          // Continue even if sentiment analysis fails
        }
      }

      const { error } = await supabase.from("time_capsules").insert({
        message: message || "",
        reveal_date: revealDate.toISOString(),
        user_id: user.id,
        image_url: previewUrls[0] || null,
        audio_url: null,
        sentiment: sentimentData ? JSON.stringify(sentimentData) : null,
      });

      if (error) throw error;
      
      toast.success("Time capsule created successfully!");
      
      setDate(undefined);
      setTime("");
      setMessage("");
      setFiles([]);
      setPreviewUrls([]);
      
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
        <div className="relative">
          <Textarea
            placeholder="What do you want to capture in your time capsule?"
            className="min-h-[200px] resize-none p-4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="absolute bottom-4 right-4 flex space-x-2">
            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="h-5 w-5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
        
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previewUrls.map((url, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={url}
                  alt={`Preview ${idx + 1}`}
                  className="rounded-lg w-full h-24 object-cover"
                />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                  onClick={() => removeImage(idx)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-2">Reveal Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background backdrop-blur-sm" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <label className="text-sm font-medium block mb-2">Reveal Time</label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>
        
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
              "Create Time Capsule"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};
