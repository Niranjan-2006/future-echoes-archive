
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://cnongijjpbsgysdophin.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNub25naWpqcGJzZ3lzZG9waGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNDM4MDQsImV4cCI6MjA1NTcxOTgwNH0.pomn_hxQ2cLe4At-42YqJsSSeGZMMDvwuI6bbwhq6VA";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'time-capsule-auth', // Custom storage key for session
  }
});

// Type for sentiment analysis response
export interface SentimentAnalysis {
  sentiment: string;
  score: number;
  analysis: any;
}

// Function to analyze sentiment using the edge function
export const analyzeSentiment = async (text: string): Promise<SentimentAnalysis | null> => {
  try {
    const { data, error } = await supabase.functions.invoke("analyze-sentiment", {
      body: { text },
    });

    if (error) {
      console.error("Supabase function error:", error);
      return null;
    }
    
    return data as SentimentAnalysis;
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return null;
  }
};
