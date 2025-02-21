
import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { format } from "date-fns";
import { CalendarIcon, ImageIcon, Music, Loader2, Upload } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

const steps = [
  { id: 1, title: "Create Message", description: "Write your message" },
  { id: 2, title: "Add Media", description: "Upload files" },
  { id: 3, title: "Set Time", description: "Choose reveal date" },
  { id: 4, title: "Preview", description: "Review your capsule" },
];

export const CapsuleCreator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [message, setMessage] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      return;
    }
    
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
        message,
        reveal_date: revealDate.toISOString(),
        user_id: user.id,
        image_url: previewUrls[0] // For now, just use the first image
      });

      if (error) throw error;
      
      toast.success("Time capsule created successfully!");
      setMessage("");
      setDate(undefined);
      setTime("");
      setFiles([]);
      setPreviewUrls([]);
      setCurrentStep(1);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div 
                className={`flex flex-col items-center ${
                  currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${currentStep >= step.id ? "bg-primary text-white" : "bg-muted"}
                `}>
                  {step.id}
                </div>
                <span className="mt-2 text-sm font-medium">{step.title}</span>
              </div>
              {idx < steps.length - 1 && (
                <div 
                  className={`h-0.5 w-24 mx-4 ${
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Create Your Time Capsule</h1>
          <p className="text-muted-foreground">
            Write a message to your future self
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Dear future me..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Minimum 100 characters</span>
                  <span>{message.length}/2000</span>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8">
                  <input
                    type="file"
                    multiple
                    accept="image/*,audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-center text-muted-foreground">
                      Drag and drop your files here
                      <br />
                      or
                    </p>
                    <Button type="button" variant="outline" className="mt-4">
                      Browse Files
                    </Button>
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm">
                    <ImageIcon className="mr-2 h-4 w-4" /> Images
                  </Button>
                  <Button type="button" variant="outline" size="sm">
                    <Music className="mr-2 h-4 w-4" /> Audio
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-2"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="bg-white rounded-md">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-sm font-medium">Select time</label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-medium mb-2">Message Preview</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {message}
                  </p>
                </Card>
                {previewUrls.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-medium mb-2">Media Files</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {previewUrls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Preview ${idx + 1}`}
                          className="rounded-lg"
                        />
                      ))}
                    </div>
                  </Card>
                )}
                <Card className="p-4">
                  <h3 className="font-medium mb-2">Reveal Date</h3>
                  <p className="text-muted-foreground">
                    {date && format(date, "PPP")} at {time || "00:00"}
                  </p>
                </Card>
              </div>
            )}

            <div className="flex justify-end">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="mr-2"
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                disabled={
                  (currentStep === 1 && message.length < 100) ||
                  (currentStep === 3 && !date) ||
                  loading
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : currentStep === 4 ? (
                  "Create Time Capsule"
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </form>
        </div>

        <div>
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Preview</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Sentiment Analysis</h3>
                <p className="text-muted-foreground text-sm">
                  Write your message to see analysis
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Media Files</h3>
                {previewUrls.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {previewUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        className="rounded-lg"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No media files added yet
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
