
import { format } from "date-fns";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface SentimentReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  capsule: any;
}

export const SentimentReportDialog = ({ isOpen, onClose, capsule }: SentimentReportDialogProps) => {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && capsule) {
      fetchQuestionnaireResponses();
    }
  }, [isOpen, capsule]);

  const fetchQuestionnaireResponses = async () => {
    if (!capsule) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('questionnaire_responses')
        .select('*')
        .eq('capsule_id', capsule.id)
        .order('question_date', { ascending: true });
      
      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error("Error fetching questionnaire responses:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!capsule) return null;

  const formatSentiment = (capsule: any) => {
    if (!capsule || !capsule.sentiment_data) {
      return { label: "Not analyzed", color: "text-gray-500" };
    }
    
    const sentiment = typeof capsule.sentiment_data === 'string' 
      ? JSON.parse(capsule.sentiment_data) 
      : capsule.sentiment_data;
    
    const sentimentValue = (sentiment.sentiment || "").toLowerCase();
    
    if (sentimentValue === "positive") {
      return { label: "Positive", color: "text-green-500" };
    } else if (sentimentValue === "negative") {
      return { label: "Negative", color: "text-red-500" };
    } else {
      return { label: "Neutral", color: "text-yellow-500" };
    }
  };

  const getSentimentDetails = (capsule: any) => {
    if (!capsule || !capsule.sentiment_data) {
      return null;
    }
    
    const sentiment = typeof capsule.sentiment_data === 'string' 
      ? JSON.parse(capsule.sentiment_data) 
      : capsule.sentiment_data;
    
    return sentiment;
  };

  const generateMoodSummary = () => {
    // Default message if we have no responses
    if (!responses || responses.length === 0) {
      return "No reflection responses were collected during the time capsule period.";
    }

    // Analyze sentiment trend from responses
    const sentiments = responses.map(r => {
      if (!r.sentiment_data) return "neutral";
      const sentiment = typeof r.sentiment_data === 'string' 
        ? JSON.parse(r.sentiment_data) 
        : r.sentiment_data;
      return (sentiment.sentiment || "").toLowerCase();
    });
    
    // Count sentiment occurrences
    const sentimentCounts = {
      positive: sentiments.filter(s => s === "positive").length,
      neutral: sentiments.filter(s => s === "neutral").length,
      negative: sentiments.filter(s => s === "negative").length
    };
    
    // Determine dominant sentiment
    const totalResponses = responses.length;
    const dominantSentiment = Object.keys(sentimentCounts).reduce((a, b) => 
      sentimentCounts[a as keyof typeof sentimentCounts] > sentimentCounts[b as keyof typeof sentimentCounts] ? a : b
    );
    
    // Generate summary based on dominant sentiment and initial capsule sentiment
    const initialSentiment = formatSentiment(capsule).label.toLowerCase();
    
    if (dominantSentiment === "positive") {
      if (initialSentiment === "positive") {
        return "Throughout this period, your responses maintained a consistently positive outlook, reflecting continued optimism and good spirits.";
      } else if (initialSentiment === "negative") {
        return "Your journey shows a remarkable shift from initial concerns to predominantly positive reflections, suggesting personal growth and emotional resilience.";
      } else {
        return "Your reflections evolved into a largely positive perspective over time, showing an upward trend in your emotional well-being.";
      }
    } else if (dominantSentiment === "negative") {
      if (initialSentiment === "positive") {
        return "While you began with optimism, you faced some challenges during this period. Remember that emotional fluctuations are normal parts of life's journey.";
      } else if (initialSentiment === "negative") {
        return "You've been navigating some persistent challenges. Your consistent self-reflection shows strength and commitment to self-awareness.";
      } else {
        return "Your reflections reveal some emotional challenges during this period. The practice of regular reflection itself is a powerful tool for working through difficult feelings.";
      }
    } else {
      if (initialSentiment === "positive") {
        return "Starting from a positive outlook, your journey settled into a balanced, thoughtful perspective throughout this period.";
      } else if (initialSentiment === "negative") {
        return "From initial concerns, your reflections show movement toward a more balanced perspective, suggesting adaptation and emotional processing.";
      } else {
        return "Your reflections maintained a balanced, thoughtful perspective throughout this period, showing consistent emotional equilibrium.";
      }
    }
  };

  const getPositiveEndNote = () => {
    const notes = [
      "Remember that self-reflection is a powerful tool for personal growth. Keep nurturing this practice.",
      "Your commitment to reflection shows incredible self-awareness. This mindfulness will continue to serve you well.",
      "Every moment of reflection is a step toward greater self-understanding. You're on a meaningful journey.",
      "The insights you've gained through reflection are valuable treasures that will guide your future path.",
      "By looking inward regularly, you've demonstrated remarkable emotional intelligence and personal strength."
    ];
    
    // Use the capsule ID as a seed for deterministic but seemingly random selection
    const seed = parseInt(capsule.id.replace(/[^0-9]/g, '').substring(0, 5));
    return notes[seed % notes.length];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sentiment Analysis Report</DialogTitle>
          <DialogDescription>
            This report shows the sentiment analysis of your virtual capsule and reflection responses.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-1">Original Message</h3>
            <p className="text-sm text-muted-foreground border-l-2 pl-3 py-1">{capsule.message}</p>
          </div>
          
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-medium mb-3">Initial Sentiment Analysis</h3>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Sentiment:</span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${formatSentiment(capsule).color}`}>
                {formatSentiment(capsule).label}
              </span>
            </div>
            
            {getSentimentDetails(capsule) && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Confidence Score:</span> 
                  {(getSentimentDetails(capsule).score * 100).toFixed(1)}%
                </div>
                
                {getSentimentDetails(capsule).analysis && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="text-xs text-muted-foreground mb-1 font-medium">Detailed Analysis:</div>
                    <div className="space-y-1">
                      {getSentimentDetails(capsule).analysis[0] && 
                        getSentimentDetails(capsule).analysis[0].map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span>{item.label}:</span>
                            <span className="font-mono">{(item.score * 100).toFixed(1)}%</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!getSentimentDetails(capsule) && (
              <div className="text-xs text-muted-foreground italic mt-2">
                No detailed sentiment analysis available for this message.
              </div>
            )}
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Reflection Responses</h3>
            
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                <span className="text-sm">Loading responses...</span>
              </div>
            ) : responses.length > 0 ? (
              <div className="space-y-4">
                {responses.map((response, index) => (
                  <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium">{response.question}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(response.question_date), "PPP")}
                        </p>
                      </div>
                      {response.sentiment_data && (
                        <span className={`text-xs px-2 py-0.5 rounded ${formatSentiment({sentiment_data: response.sentiment_data}).color}`}>
                          {formatSentiment({sentiment_data: response.sentiment_data}).label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm pl-3 border-l-2">{response.response}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No reflection responses were collected during this time capsule period.
              </p>
            )}
          </div>
          
          <div className="border rounded-lg p-4 bg-primary/10">
            <h3 className="text-sm font-medium mb-2">Emotional Journey Summary</h3>
            <p className="text-sm mb-3">{generateMoodSummary()}</p>
            <p className="text-sm font-medium italic">{getPositiveEndNote()}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-1">Capsule Created</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(capsule.created_at), "PPP")}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-1">Capsule Revealed</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(capsule.reveal_date), "PPP")}
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
