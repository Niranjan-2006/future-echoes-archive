
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

// Cache for sentiment analysis results to reduce API calls
const sentimentCache = new Map<string, SentimentAnalysis>();

// Type for sentiment analysis response
export interface SentimentAnalysis {
  sentiment: string;
  score: number;
  analysis: any;
}

// Function to analyze sentiment using the edge function with caching
export const analyzeSentiment = async (text: string): Promise<SentimentAnalysis | null> => {
  try {
    // Generate a cache key from the text (trim to reduce minor variations)
    const cacheKey = text.trim();
    
    // Check if we have a cached result
    if (sentimentCache.has(cacheKey)) {
      console.log("Using cached sentiment analysis result");
      return sentimentCache.get(cacheKey) || null;
    }
    
    console.log("Calling sentiment analysis function for text:", text.substring(0, 30) + "...");
    
    const { data, error } = await supabase.functions.invoke("analyze-sentiment", {
      body: { text },
    });

    if (error) {
      console.error("Supabase function error:", error);
      return null;
    }
    
    if (!data) {
      console.error("No data returned from sentiment analysis function");
      return null;
    }
    
    console.log("Sentiment analysis results:", data);
    
    // Cache the result
    sentimentCache.set(cacheKey, data as SentimentAnalysis);
    
    return data as SentimentAnalysis;
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return null;
  }
};
