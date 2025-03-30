
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
      throw new Error("HUGGING_FACE_API_KEY is not set");
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
    console.log("Using Hugging Face API with valid key:", !!HUGGING_FACE_API_KEY);

    // Call Hugging Face API for sentiment analysis
    // Using distilbert-base-uncased-finetuned-sst-2-english which is optimized for sentiment analysis
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
      throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
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
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
