
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { capsuleId } = await req.json();
    
    if (!capsuleId) {
      return new Response(
        JSON.stringify({ error: "Capsule ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Analyzing responses for capsule: ${capsuleId}`);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the capsule data to determine initial sentiment
    const { data: capsule, error: capsuleError } = await supabase
      .from("time_capsules")
      .select("*")
      .eq("id", capsuleId)
      .single();
      
    if (capsuleError) {
      console.error("Error fetching capsule:", capsuleError);
      throw new Error("Failed to fetch capsule data");
    }
    
    // Get all questionnaire responses for this capsule
    const { data: responses, error: responsesError } = await supabase
      .from("questionnaire_responses")
      .select("*")
      .eq("capsule_id", capsuleId)
      .order("question_date", { ascending: true });
      
    if (responsesError) {
      console.error("Error fetching responses:", responsesError);
      throw new Error("Failed to fetch capsule responses");
    }
    
    console.log(`Found ${responses?.length || 0} responses for analysis`);
    
    // Process responses for sentiment trend analysis
    const sentimentTrend = processResponseSentiments(responses || [], capsule.sentiment_data);
    
    return new Response(
      JSON.stringify({
        status: "success",
        capsuleId,
        initialSentiment: extractSentimentValue(capsule.sentiment_data),
        responsesAnalyzed: responses?.length || 0,
        sentimentTrend,
        summary: generateSummary(sentimentTrend, extractSentimentValue(capsule.sentiment_data))
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-capsule-responses function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function extractSentimentValue(sentimentData: any): string {
  if (!sentimentData) return "neutral";
  
  // Parse if it's a string
  const sentiment = typeof sentimentData === 'string' 
    ? JSON.parse(sentimentData) 
    : sentimentData;
  
  return sentiment?.sentiment?.toLowerCase() || "neutral";
}

function processResponseSentiments(responses: any[], initialSentimentData: any): any {
  // Extract sentiment values and scores from responses
  const sentimentPoints = responses.map(response => {
    const sentiment = extractSentimentValue(response.sentiment_data);
    const score = response.sentiment_data?.score || 0.5;
    
    return {
      date: response.question_date,
      sentiment,
      score,
      response: response.response.substring(0, 100) + (response.response.length > 100 ? "..." : "")
    };
  });
  
  // Calculate trend information
  const initialSentiment = extractSentimentValue(initialSentimentData);
  const finalSentiment = sentimentPoints.length > 0 
    ? sentimentPoints[sentimentPoints.length - 1].sentiment 
    : initialSentiment;
  
  const sentimentCounts = countSentiments(sentimentPoints);
  const dominantSentiment = getDominantSentiment(sentimentCounts);
  
  return {
    points: sentimentPoints,
    initialSentiment,
    finalSentiment,
    dominantSentiment,
    sentimentCounts
  };
}

function countSentiments(sentimentPoints: any[]): any {
  const counts = {
    positive: 0,
    neutral: 0,
    negative: 0
  };
  
  sentimentPoints.forEach(point => {
    if (counts.hasOwnProperty(point.sentiment)) {
      counts[point.sentiment]++;
    } else {
      counts.neutral++;
    }
  });
  
  return counts;
}

function getDominantSentiment(sentimentCounts: any): string {
  const { positive, neutral, negative } = sentimentCounts;
  
  if (positive >= neutral && positive >= negative) return "positive";
  if (negative >= positive && negative >= neutral) return "negative";
  return "neutral";
}

function generateSummary(sentimentTrend: any, initialSentiment: string): string {
  const { dominantSentiment, sentimentCounts } = sentimentTrend;
  const totalResponses = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
  
  if (totalResponses === 0) {
    return "No responses were recorded during the time capsule's active period.";
  }
  
  let summary = "";
  
  // Compare initial sentiment with dominant sentiment
  if (dominantSentiment === initialSentiment) {
    switch (dominantSentiment) {
      case "positive":
        summary = "You maintained a positive outlook throughout this period. Your responses show consistent optimism and appreciation.";
        break;
      case "neutral":
        summary = "Your reflections remained balanced and measured throughout this period, showing a consistent even temperament.";
        break;
      case "negative":
        summary = "You've been going through a challenging time. Your responses show consistent reflection on difficult emotions.";
        break;
    }
  } else {
    // Sentiment changed
    const improvement = (initialSentiment === "negative" && dominantSentiment === "positive") || 
                       (initialSentiment === "neutral" && dominantSentiment === "positive") || 
                       (initialSentiment === "negative" && dominantSentiment === "neutral");
                       
    if (improvement) {
      summary = "Your reflections show a positive shift in sentiment. You seem to have experienced growth or improvement during this period.";
    } else {
      summary = "Your reflections show some changes in sentiment during this period, reflecting the natural ups and downs of life.";
    }
  }
  
  // Add encouraging conclusion
  summary += " Remember that all emotions are valid and part of the human experience. Taking time to reflect shows your commitment to self-awareness and personal growth.";
  
  return summary;
}
