
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "./ImageUploader";
import { SentimentAnalysis, analyzeSentiment } from "@/integrations/supabase/client";
import { Smile, Meh, Frown, Loader2 } from "lucide-react";

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
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Analyze sentiment with debounce
  useEffect(() => {
    if (message.trim().length > 10) {
      // Cancel previous timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      
      // Set new timeout to analyze sentiment after 1 second of no typing
      const timeout = setTimeout(async () => {
        setAnalyzing(true);
        const result = await analyzeSentiment(message);
        setSentiment(result);
        setAnalyzing(false);
      }, 1000);
      
      setDebounceTimeout(timeout);
    } else {
      setSentiment(null);
    }
    
    // Clean up on unmount
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [message]);

  // Render sentiment icon based on the analysis
  const renderSentimentIcon = () => {
    if (analyzing) {
      return <Loader2 className="h-5 w-5 animate-spin text-gray-400" />;
    }
    
    if (!sentiment || message.trim().length <= 10) {
      return null;
    }
    
    if (sentiment.sentiment === "positive" || sentiment.sentiment === "POSITIVE") {
      return <Smile className="h-5 w-5 text-green-500" title="Positive sentiment detected" />;
    } else if (sentiment.sentiment === "negative" || sentiment.sentiment === "NEGATIVE") {
      return <Frown className="h-5 w-5 text-red-500" title="Negative sentiment detected" />;
    } else {
      return <Meh className="h-5 w-5 text-yellow-500" title="Neutral sentiment detected" />;
    }
  };

  return (
    <div className="relative">
      <Textarea
        placeholder="What do you want to capture in your time capsule?"
        className="min-h-[200px] resize-none p-4"
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
      />
      <div className="absolute bottom-4 right-4 flex items-center space-x-2">
        {renderSentimentIcon()}
        <ImageUploader 
          previewUrls={previewUrls} 
          onImageUpload={onImageUpload}
          onImageRemove={onImageRemove}
        />
      </div>
    </div>
  );
};
