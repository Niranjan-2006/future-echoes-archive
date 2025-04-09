
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

interface SentimentReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  capsule: any;
}

export const SentimentReportDialog = ({ isOpen, onClose, capsule }: SentimentReportDialogProps) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sentiment Analysis Report</DialogTitle>
          <DialogDescription>
            This report shows the sentiment analysis of your virtual capsule message.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-1">Message</h3>
            <p className="text-sm text-muted-foreground border-l-2 pl-3 py-1">{capsule.message}</p>
          </div>
          
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-medium mb-3">Sentiment Analysis</h3>
            
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
          
          <div>
            <h3 className="text-sm font-medium mb-1">Created On</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(capsule.created_at), "PPP")}
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
