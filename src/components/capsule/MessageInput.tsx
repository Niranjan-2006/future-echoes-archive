
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "./ImageUploader";
import { SentimentAnalysis, analyzeSentiment } from "@/integrations/supabase/client";
import { Smile, Meh, Frown, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

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
  const [apiError, setApiError] = useState(false);

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
        setApiError(false);
        try {
          const result = await analyzeSentiment(message);
          if (result) {
            setSentiment(result);
          } else {
            setApiError(true);
          }
        } catch (error) {
          console.error("Error analyzing sentiment:", error);
          setApiError(true);
        } finally {
          setAnalyzing(false);
        }
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
    
    if (apiError) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Meh className="h-5 w-5 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              Sentiment analysis unavailable
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    if (!sentiment || message.trim().length <= 10) {
      return null;
    }
    
    if (sentiment.sentiment === "positive" || sentiment.sentiment === "POSITIVE") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Smile className="h-5 w-5 text-green-500" />
            </TooltipTrigger>
            <TooltipContent>
              Positive sentiment detected
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (sentiment.sentiment === "negative" || sentiment.sentiment === "NEGATIVE") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Frown className="h-5 w-5 text-red-500" />
            </TooltipTrigger>
            <TooltipContent>
              Negative sentiment detected
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Meh className="h-5 w-5 text-yellow-500" />
            </TooltipTrigger>
            <TooltipContent>
              Neutral sentiment detected
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
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
