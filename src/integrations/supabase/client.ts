
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

// Function to analyze sentiment using the edge function
export const analyzeSentiment = async (text: string) => {
  try {
    const { data, error } = await supabase.functions.invoke("analyze-sentiment", {
      body: { text },
    });

    if (error) throw error;
    return data.sentiment;
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return null;
  }
};
