
import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, ImageIcon, Mic, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const CapsuleCreator = () => {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
    
    // Create preview URLs for the files
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording logic would go here
      setIsRecording(false);
      toast.success("Recording saved!");
      // Mocking audio URL for demo
      setAudioUrl("audio-recording.mp3");
    } else {
      // Start recording logic would go here
      setIsRecording(true);
      toast.info("Recording started...");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Combine date and time
      const revealDate = date ? new Date(date) : new Date();
      if (time) {
        const [hours, minutes] = time.split(':');
        revealDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      }

      const { error } = await supabase.from("time_capsules").insert({
        message: message || (audioUrl ? "Audio Message" : ""),
        reveal_date: revealDate.toISOString(),
        user_id: user.id,
        image_url: previewUrls[0], // For now, just use the first image
        audio_url: audioUrl,
      });

      if (error) throw error;
      
      toast.success("Time capsule created successfully!");
      setDate(undefined);
      setTime("");
      setMessage("");
      setFiles([]);
      setPreviewUrls([]);
      setAudioUrl(null);
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
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              onClick={toggleRecording}
              className={isRecording ? "text-red-500" : ""}
            >
              <Mic className={`h-5 w-5 ${isRecording ? "text-red-500" : ""}`} />
            </Button>
            
            <div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button type="button" variant="ghost" size="icon" asChild>
                  <span>
                    <ImageIcon className="h-5 w-5" />
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </div>
        
        {audioUrl && (
          <div className="p-2 bg-accent rounded-md">
            <p className="text-sm flex items-center">
              <Mic className="mr-2 h-4 w-4" />
              Audio recorded successfully
            </p>
          </div>
        )}
        
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previewUrls.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Preview ${idx + 1}`}
                className="rounded-lg w-full h-24 object-cover"
              />
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
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
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
        
        <div className="flex justify-end">
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
