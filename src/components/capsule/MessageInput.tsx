
import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "./ImageUploader";
import { SentimentAnalysis, analyzeSentiment } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface MessageInputProps {
  message: string;
  onMessageChange: (message: string) => void;
  previewUrls: string[];
  onImageUpload: (files: File[]) => void;
  onImageRemove: (index: number) => void;
}

export const MessageInput = ({
  message,
  onMessageChange,
  previewUrls,
  onImageUpload,
  onImageRemove
}: MessageInputProps) => {
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [apiError, setApiError] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastAnalyzedText = useRef<string>("");

  // Analyze sentiment with improved debounce
  useEffect(() => {
    // Only analyze if message is sufficiently different from last analyzed text
    // and is longer than 10 characters
    const trimmedMessage = message.trim();
    
    if (trimmedMessage.length > 10 && 
        Math.abs(trimmedMessage.length - lastAnalyzedText.current.length) > 5) {
      
      // Cancel previous timeout
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      
      // Set a longer timeout to avoid too many API calls
      const timeout = setTimeout(async () => {
        // Don't analyze if message is identical to last analyzed (even after debounce)
        if (trimmedMessage === lastAnalyzedText.current) {
          return;
        }
        
        setAnalyzing(true);
        setApiError(false);
        try {
          const result = await analyzeSentiment(trimmedMessage);
          if (result) {
            setSentiment(result);
            lastAnalyzedText.current = trimmedMessage;
          } else {
            setApiError(true);
          }
        } catch (error) {
          console.error("Error analyzing sentiment:", error);
          setApiError(true);
        } finally {
          setAnalyzing(false);
        }
      }, 1500); 
      
      debounceTimeout.current = timeout;
    }
    
    // Clean up on unmount
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [message]);

  return (
    <div className="relative">
      <Textarea
        placeholder="What do you want to capture in your time capsule?"
        className="min-h-[200px] resize-none p-4"
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
      />
      <div className="absolute bottom-4 right-4 flex items-center space-x-2">
        {/* Sentiment indicators removed - analysis happens silently in the background */}
        {analyzing && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
        <ImageUploader 
          previewUrls={previewUrls} 
          onImageUpload={onImageUpload}
          onImageRemove={onImageRemove}
        />
      </div>
    </div>
  );
};
