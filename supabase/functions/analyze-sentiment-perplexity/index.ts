
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
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      console.error("PERPLEXITY_API_KEY is not set");
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

    console.log("Analyzing sentiment with Perplexity for text:", text.substring(0, 50) + (text.length > 50 ? "..." : ""));
    
    // Determine basic sentiment using keywords as fallback
    const positiveWords = ["happy", "good", "great", "excellent", "wonderful", "joy", "pleased", "delighted", "glad"];
    const negativeWords = ["sad", "bad", "terrible", "awful", "unhappy", "disappointed", "upset", "angry", "depressed"];
    
    const lowerText = text.toLowerCase();
    
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

    try {
      // Call Perplexity API for sentiment analysis
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at analyzing sentiment. Analyze the sentiment of the text provided and output a JSON object with keys "sentiment" (which should be either "positive", "negative", or "neutral") and "score" (which should be a number between 0 and 1 representing the confidence of your assessment). Format the analysis as valid JSON with no additional text.'
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.2,
          max_tokens: 300
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Perplexity API error:", errorData);
        
        // Return a calculated fallback result
        return new Response(
          JSON.stringify({ 
            error: `Perplexity API error: ${response.status} ${response.statusText}`,
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
      console.log("Perplexity response:", JSON.stringify(result));
      
      // Extract the content which should contain our JSON
      let sentimentData;
      try {
        // Look for JSON in the response content
        const content = result.choices[0].message.content;
        
        // Try to parse the content as JSON or extract JSON from text
        let jsonStr = content;
        
        // If content contains text and JSON, try to extract just the JSON part
        if (content.includes('{') && content.includes('}')) {
          const jsonStart = content.indexOf('{');
          const jsonEnd = content.lastIndexOf('}') + 1;
          jsonStr = content.substring(jsonStart, jsonEnd);
        }
        
        // Parse the JSON string
        const parsedResult = JSON.parse(jsonStr);
        
        sentimentData = {
          sentiment: parsedResult.sentiment.toLowerCase(),
          score: parseFloat(parsedResult.score),
          analysis: [[
            { label: "POSITIVE", score: parsedResult.sentiment === "positive" ? parsedResult.score : 1 - parsedResult.score },
            { label: "NEGATIVE", score: parsedResult.sentiment === "negative" ? parsedResult.score : 1 - parsedResult.score }
          ]]
        };
      } catch (jsonError) {
        console.error("Error parsing Perplexity response as JSON:", jsonError);
        
        // Use fallback if JSON parsing fails
        sentimentData = {
          sentiment: fallbackSentiment,
          score: fallbackScore,
          analysis: [[
            { label: "POSITIVE", score: fallbackSentiment === "positive" ? fallbackScore : 1 - fallbackScore },
            { label: "NEGATIVE", score: fallbackSentiment === "negative" ? fallbackScore : 1 - fallbackScore }
          ]]
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
