
import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Questionnaire = () => {
  const [response, setResponse] = useState("");
  
  // Daily questions - could be enhanced to rotate or fetch from database
  const questions = [
    "What are you grateful for today?",
    "What's one thing that made you smile recently?",
    "What's a challenge you're currently facing?",
    "What's something you're looking forward to?",
    "What's one thing you'd like to improve about yourself?"
  ];
  
  // Get a consistent question for the day based on the date
  const getTodayQuestion = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    return questions[dayOfYear % questions.length];
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim()) {
      toast.error("Please enter a response to submit");
      return;
    }
    
    // Here you could save the response to the database
    toast.success("Your reflection has been saved!");
    setResponse("");
  };

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Daily Reflection</h1>
        
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Today's Question</h2>
              <p className="text-lg mb-6">{getTodayQuestion()}</p>
              
              <Textarea
                className="min-h-[150px]"
                placeholder="Enter your thoughts here..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end">
              <Button type="submit">Save Reflection</Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
};

export default Questionnaire;
