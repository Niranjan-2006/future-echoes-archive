
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://cnongijjpbsgysdophin.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNub25naWpqcGJzZ3lzZG9waGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNDM4MDQsImV4cCI6MjA1NTcxOTgwNH0.pomn_hxQ2cLe4At-42YqJsSSeGZMMDvwuI6bbwhq6VA";

// Create a single, persistent Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'time-capsule-auth', // Custom storage key for session
    detectSessionInUrl: false, // Disable automatic detection as we'll handle it explicitly
  }
});

// Type for sentiment analysis response
export interface SentimentAnalysis {
  sentiment: string;
  score: number;
  analysis: any;
  error?: string;
}

// Function to analyze sentiment using the Perplexity API
export const analyzeSentiment = async (text: string): Promise<SentimentAnalysis | null> => {
  try {
    if (!text || text.trim().length < 10) {
      console.log("Text too short for sentiment analysis");
      return null;
    }
    
    console.log("Calling sentiment analysis function for text:", text.substring(0, 50) + "...");
    
    const { data, error } = await supabase.functions.invoke("analyze-sentiment-perplexity", {
      body: { text },
    });

    if (error) {
      console.error("Supabase function error:", error);
      return {
        sentiment: "neutral",
        score: 0.5,
        analysis: [
          [
            { label: "POSITIVE", score: 0.5 },
            { label: "NEGATIVE", score: 0.5 }
          ]
        ],
        error: error.message
      };
    }
    
    if (!data) {
      console.error("No data returned from sentiment analysis function");
      return null;
    }
    
    console.log("Sentiment analysis results:", data);
    
    return data as SentimentAnalysis;
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return {
      sentiment: "neutral",
      score: 0.5,
      analysis: [
        [
          { label: "POSITIVE", score: 0.5 },
          { label: "NEGATIVE", score: 0.5 }
        ]
      ],
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};
