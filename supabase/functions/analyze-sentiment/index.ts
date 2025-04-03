
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const HUGGING_FACE_API_KEY = Deno.env.get("HUGGING_FACE_API_KEY");
    if (!HUGGING_FACE_API_KEY) {
      console.error("HUGGING_FACE_API_KEY is not set");
      return new Response(
        JSON.stringify({ 
          error: "API key not configured", 
          sentiment: "neutral", 
          score: 0.5,
          analysis: [[
            { label: "POSITIVE", score: 0.5 },
            { label: "NEGATIVE", score: 0.5 }
          ]]
        }),
        {
          status: 200, // Return 200 with fallback data
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { text } = await req.json();
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Analyzing sentiment for text:", text.substring(0, 50) + (text.length > 50 ? "..." : ""));
    
    // Basic sentiment keywords to improve fallback analysis
    const positiveWords = ["happy", "good", "great", "excellent", "wonderful", "joy", "pleased", "delighted", "glad"];
    const negativeWords = ["sad", "bad", "terrible", "awful", "unhappy", "disappointed", "upset", "angry", "depressed"];
    
    const lowerText = text.toLowerCase();
    
    // Simple keyword matching as fallback
    let fallbackSentiment = "neutral";
    let fallbackScore = 0.5;
    
    // Count positive and negative words
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });
    
    // Calculate sentiment based on word counts
    if (positiveCount > negativeCount) {
      fallbackSentiment = "positive";
      fallbackScore = 0.5 + (positiveCount / (positiveCount + negativeCount)) * 0.5;
    } else if (negativeCount > positiveCount) {
      fallbackSentiment = "negative";
      fallbackScore = 0.5 + (negativeCount / (positiveCount + negativeCount)) * 0.5;
    }

    // Call Hugging Face API for sentiment analysis
    // Using distilbert-base-uncased-finetuned-sst-2-english which is optimized for sentiment analysis
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: text }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Hugging Face API error:", errorData);
        
        // Return a calculated fallback result
        return new Response(
          JSON.stringify({ 
            error: `Hugging Face API error: ${response.status} ${response.statusText}`,
            sentiment: fallbackSentiment,
            score: fallbackScore,
            analysis: [[
              { label: "POSITIVE", score: fallbackSentiment === "positive" ? fallbackScore : 1 - fallbackScore },
              { label: "NEGATIVE", score: fallbackSentiment === "negative" ? fallbackScore : 1 - fallbackScore }
            ]]
          }),
          {
            status: 200, // Return 200 with fallback data
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const result = await response.json();
      console.log("Sentiment analysis result:", JSON.stringify(result));
      
      // Process the result to get a simplified format
      let sentimentData = {
        sentiment: "neutral",
        score: 0.5,
        analysis: result
      };
      
      // The model returns an array of objects with label and score
      if (Array.isArray(result) && result.length > 0) {
        // Find the label with the highest score
        const sortedSentiments = [...result[0]].sort((a, b) => b.score - a.score);
        const topSentiment = sortedSentiments[0];
        
        sentimentData = {
          sentiment: topSentiment.label.toLowerCase(),
          score: topSentiment.score,
          analysis: result
        };
      }
      
      return new Response(
        JSON.stringify(sentimentData),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (apiError) {
      console.error("API call error:", apiError);
      
      // Return the fallback result
      return new Response(
        JSON.stringify({ 
          error: apiError.message,
          sentiment: fallbackSentiment,
          score: fallbackScore,
          analysis: [[
            { label: "POSITIVE", score: fallbackSentiment === "positive" ? fallbackScore : 1 - fallbackScore },
            { label: "NEGATIVE", score: fallbackSentiment === "negative" ? fallbackScore : 1 - fallbackScore }
          ]]
        }),
        {
          status: 200, // Return 200 with fallback data
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    
    // Return a fallback result
    return new Response(
      JSON.stringify({ 
        error: error.message,
        sentiment: "neutral",
        score: 0.5,
        analysis: [[
          { label: "POSITIVE", score: 0.5 },
          { label: "NEGATIVE", score: 0.5 }
        ]]
      }),
      {
        status: 200, // Return 200 with fallback data
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
