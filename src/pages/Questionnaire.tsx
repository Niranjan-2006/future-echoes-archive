
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase, analyzeSentiment } from "@/integrations/supabase/client";
import { Loader2, Clock } from "lucide-react";
import { addDays, isAfter, isSameDay, format } from "date-fns";
import { useNavigate } from "react-router-dom";

// Question types by sentiment
const questions = {
  positive: [
    "What's been the highlight of your week so far?",
    "What are you feeling most grateful for right now?",
    "What's a small thing that brought you joy recently?",
    "What are you looking forward to that makes you feel good?",
    "Reflecting on when you created this capsule, what similar positive feelings have you experienced since?"
  ],
  neutral: [
    "What's been on your mind this week?",
    "What's one thing you've noticed about yourself or your surroundings recently?",
    "Has anything interesting or noteworthy happened this week?",
    "What are you hoping to focus on in the week ahead?",
    "Reflecting back on when you created this capsule, does anything stand out in your memory?"
  ],
  negative: [
    "How have you been navigating any challenging feelings this week?",
    "Have you found any moments of comfort or relief since you wrote your capsule?",
    "What's one small step you've taken to care for yourself this week?",
    "Has there been any shift in your overall mood or perspective?",
    "Reflecting on the feelings you had when you created this capsule, have things felt any different lately?"
  ]
};

interface ActiveQuestion {
  capsuleId: string;
  question: string;
  questionDate: Date;
  questionIndex: number;
}

const Questionnaire = () => {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingResponse, setSavingResponse] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<ActiveQuestion | null>(null);
  const [noQuestionsMessage, setNoQuestionsMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchTodayQuestion();
  }, []);
  
  const fetchTodayQuestion = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNoQuestionsMessage("Please log in to see your questions.");
        return;
      }
      
      const today = new Date();
      
      // First check if user has already answered a question today
      const { data: existingResponses } = await supabase
        .from('questionnaire_responses')
        .select('*')
        .eq('user_id', user.id)
        .gte('response_date', new Date(today.setHours(0, 0, 0, 0)).toISOString())
        .lt('response_date', new Date(today.setHours(23, 59, 59, 999)).toISOString())
        .order('response_date', { ascending: false });
      
      if (existingResponses && existingResponses.length > 0) {
        setNoQuestionsMessage("You've already answered today's question. Come back tomorrow for a new reflection.");
        setLoading(false);
        return;
      }

      // Get active capsules (not revealed yet)
      const { data: activeCapsules } = await supabase
        .from('time_capsules')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_revealed', false)
        .lte('reveal_date', addDays(new Date(), 30).toISOString()) // Only include capsules with reveal dates within 30 days
        .order('created_at', { ascending: false });
      
      if (!activeCapsules || activeCapsules.length === 0) {
        setNoQuestionsMessage("No active time capsules found. Create a time capsule to get reflection questions.");
        setLoading(false);
        return;
      }
      
      // Find capsule with questions scheduled for today
      for (const capsule of activeCapsules) {
        const questionSchedule = generateQuestionSchedule(capsule);
        const todayQuestionIndex = questionSchedule.findIndex(date => 
          isSameDay(new Date(date), new Date())
        );
        
        if (todayQuestionIndex !== -1) {
          // Get previous responses for this capsule to determine which question to show
          const { data: previousResponses } = await supabase
            .from('questionnaire_responses')
            .select('*')
            .eq('capsule_id', capsule.id)
            .order('question_date', { ascending: true });
          
          const questionIndex = previousResponses ? previousResponses.length : 0;
          const sentimentType = determineSentimentType(capsule.sentiment_data);
          const questionList = questions[sentimentType as keyof typeof questions];
          
          // Use modulo to cycle through questions if we have more responses than questions
          const question = questionList[questionIndex % questionList.length];
          
          setActiveQuestion({
            capsuleId: capsule.id,
            question,
            questionDate: new Date(),
            questionIndex
          });
          
          setLoading(false);
          return;
        }
      }
      
      setNoQuestionsMessage("No reflection questions scheduled for today. Check back later!");
    } catch (error) {
      console.error("Error fetching question:", error);
      toast.error("Failed to load today's question");
      setNoQuestionsMessage("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  const generateQuestionSchedule = (capsule: any): Date[] => {
    const creationDate = new Date(capsule.created_at);
    const revealDate = new Date(capsule.reveal_date);
    const sentiment = determineSentimentType(capsule.sentiment_data);
    const schedule: Date[] = [];
    
    // Set frequency based on sentiment
    const frequency = sentiment === 'negative' ? 3 : 7; // 3 days for negative, 7 for others
    const maxQuestions = sentiment === 'negative' ? 8 : 4; // 8 for negative, 4 for others
    
    let currentDate = new Date(creationDate);
    currentDate.setDate(currentDate.getDate() + frequency); // Start from first interval
    
    // Generate question dates
    for (let i = 0; i < maxQuestions; i++) {
      // If current date is after reveal date, stop scheduling
      if (isAfter(currentDate, revealDate)) {
        break;
      }
      
      schedule.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + frequency);
    }
    
    return schedule;
  };
  
  const determineSentimentType = (sentimentData: any): 'positive' | 'neutral' | 'negative' => {
    if (!sentimentData) return 'neutral';
    
    // Parse if it's a string
    const sentiment = typeof sentimentData === 'string' 
      ? JSON.parse(sentimentData) 
      : sentimentData;
    
    if (!sentiment || !sentiment.sentiment) return 'neutral';
    
    const sentimentValue = sentiment.sentiment.toLowerCase();
    
    if (sentimentValue === 'positive') return 'positive';
    if (sentimentValue === 'negative') return 'negative';
    return 'neutral';
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim()) {
      toast.error("Please enter a response to submit");
      return;
    }
    
    if (!activeQuestion) {
      toast.error("No active question to respond to");
      return;
    }
    
    setSavingResponse(true);
    
    try {
      // First analyze sentiment of response
      let sentimentData = null;
      if (response.trim().length > 10) {
        try {
          sentimentData = await analyzeSentiment(response);
        } catch (error) {
          console.error("Error analyzing sentiment:", error);
        }
      }
      
      // Store the response
      const { error } = await supabase.from('questionnaire_responses').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        capsule_id: activeQuestion.capsuleId,
        question: activeQuestion.question,
        response,
        sentiment_data: sentimentData,
        question_date: activeQuestion.questionDate.toISOString()
      });
      
      if (error) throw error;
      
      toast.success("Your reflection has been saved!");
      setResponse("");
      
      // Reset the question state
      setActiveQuestion(null);
      setNoQuestionsMessage("Response saved! Check back later for more questions.");
    } catch (error: any) {
      toast.error(error.message || "Failed to save your response");
    } finally {
      setSavingResponse(false);
    }
  };

  const handleCreateCapsule = () => {
    navigate("/create");
  };

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Daily Reflection</h1>
        
        <Card className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeQuestion ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Today's Question</h2>
                <p className="text-lg mb-6">{activeQuestion.question}</p>
                
                <Textarea
                  className="min-h-[150px]"
                  placeholder="Enter your thoughts here..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  disabled={savingResponse}
                />
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={savingResponse}>
                  {savingResponse ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Reflection"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="py-12 text-center">
              <h2 className="text-xl font-semibold mb-4">Reflection</h2>
              <p className="text-muted-foreground mb-6">{noQuestionsMessage || "No questions available right now."}</p>
              
              {(!noQuestionsMessage || noQuestionsMessage.includes("No active time capsules")) && (
                <div className="mt-8">
                  <Button onClick={handleCreateCapsule} className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Create a Time Capsule
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
};

export default Questionnaire;
