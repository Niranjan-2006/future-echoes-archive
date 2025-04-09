
// Follow Deno's URL pattern for imports
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Using the provided API key for Perplexity
    const PERPLEXITY_API_KEY = "J4w3z0RjMSYXxcTQ8chbHsMcJucTJ3n5";
    if (!PERPLEXITY_API_KEY) {
      console.error("PERPLEXITY_API_KEY is not set");
      return new Response(
        JSON.stringify({ 
          error: "API key is not configured",
          sentiment: "neutral",
          score: 0.5 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    let text: string;
    try {
      const body = await req.json();
      text = body.text;
      
      if (!text) {
        throw new Error("No text provided");
      }
    } catch (error) {
      console.error("Error parsing request:", error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request format. Expected JSON with a 'text' field.",
          sentiment: "neutral",
          score: 0.5 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Clean and truncate the text if needed
    text = text.trim().substring(0, 2000);
    
    console.log(`Analyzing sentiment for text: "${text.substring(0, 50)}..."`);

    try {
      // Use Perplexity API for sentiment analysis
      console.log("Calling Perplexity API...");
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
              content: `You are a highly accurate sentiment analysis expert focused ONLY on emotional tone.

INSTRUCTIONS:
1. Analyze the emotional sentiment of the given text.
2. Return ONLY a JSON object with this exact format:
{
  "sentiment": "positive"|"negative"|"neutral",
  "score": (number between 0 and 1 indicating confidence)
}

CRITICAL RULES:
- "I am happy" or "I feel good" MUST be classified as POSITIVE with score > 0.8
- "I am sad" or "I feel bad" MUST be classified as NEGATIVE with score > 0.8
- Words expressing happiness, excitement, joy = POSITIVE
- Words expressing sadness, anger, frustration = NEGATIVE
- If no clear emotional content = NEUTRAL with score ~0.5
- Always return valid JSON with only the required fields
- No explanations, ONLY the JSON object`
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.01, // Very low temperature for deterministic responses
          max_tokens: 100
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Perplexity API response:", JSON.stringify(data));

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No choices returned from Perplexity API");
      }

      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error("No content in Perplexity API response");
      }

      try {
        // Extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;
        const sentimentData = JSON.parse(jsonStr);
        
        // Validate the structure
        if (!sentimentData.sentiment || typeof sentimentData.score !== 'number') {
          throw new Error("Invalid sentiment data structure");
        }

        // Standardize sentiment value
        const sentiment = sentimentData.sentiment.toLowerCase();
        if (!['positive', 'negative', 'neutral'].includes(sentiment)) {
          throw new Error("Invalid sentiment value");
        }
        
        // Create analysis structure for compatibility
        const analysis = createAnalysisStructure(sentiment, sentimentData.score);
        
        const result = {
          sentiment: sentiment,
          score: sentimentData.score,
          analysis: analysis
        };
        
        console.log("Final sentiment result:", result);
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (parseError) {
        console.error("Error parsing sentiment JSON:", parseError, "Content:", content);
        throw new Error(`Failed to parse sentiment data: ${parseError.message}`);
      }
    } catch (apiError) {
      console.error("API error:", apiError);
      
      // Fallback to basic sentiment analysis using keywords
      const fallbackResult = performFallbackSentimentAnalysis(text);
      console.log("Using fallback sentiment analysis:", fallbackResult);
      
      return new Response(
        JSON.stringify(fallbackResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in sentiment analysis:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error", 
        sentiment: "neutral", 
        score: 0.5,
        analysis: [
          [
            { label: "POSITIVE", score: 0.5 },
            { label: "NEGATIVE", score: 0.5 }
          ]
        ]
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

// Create a standardized analysis structure for the sentiment
function createAnalysisStructure(sentiment: string, score: number) {
  let positiveScore = 0.5;
  let negativeScore = 0.5;
  
  if (sentiment === "positive") {
    positiveScore = score;
    negativeScore = 1 - score;
  } else if (sentiment === "negative") {
    negativeScore = score;
    positiveScore = 1 - score;
  }
  
  return [
    [
      { label: "POSITIVE", score: positiveScore },
      { label: "NEGATIVE", score: negativeScore }
    ]
  ];
}

// Fallback sentiment analysis when the API fails
function performFallbackSentimentAnalysis(text: string) {
  const lowerText = text.toLowerCase();
  
  // Simple keyword-based sentiment analysis
  const positiveWords = ["happy", "good", "love", "great", "excellent", "joy", "amazing", "wonderful", "glad", "excited", "positive"];
  const negativeWords = ["sad", "bad", "hate", "terrible", "awful", "unhappy", "disappointed", "miserable", "angry", "upset", "negative"];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  // Count positive and negative keywords
  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = lowerText.match(regex);
    if (matches) positiveCount += matches.length;
  });
  
  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = lowerText.match(regex);
    if (matches) negativeCount += matches.length;
  });
  
  let sentiment = "neutral";
  let score = 0.5;
  
  // Determine sentiment based on keyword counts
  if (positiveCount > negativeCount) {
    sentiment = "positive";
    score = Math.min(0.5 + (positiveCount - negativeCount) * 0.1, 0.95);
  } else if (negativeCount > positiveCount) {
    sentiment = "negative";
    score = Math.min(0.5 + (negativeCount - positiveCount) * 0.1, 0.95);
  }
  
  // Create the analysis structure
  const analysis = createAnalysisStructure(sentiment, score);
  
  return {
    sentiment,
    score,
    analysis
  };
}
