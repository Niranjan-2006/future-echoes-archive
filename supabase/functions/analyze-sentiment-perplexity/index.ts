
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
    // Using the API key provided by the user
    const PERPLEXITY_API_KEY = "J4w3z0RjMSYXxcTQ8chbHsMcJucTJ3n5";
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

    try {
      // Call Perplexity API with an improved prompt for sentiment analysis
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
              content: `You are a precise sentiment analysis expert focusing ONLY on emotional tone.

INSTRUCTIONS:
1. Analyze ONLY the emotional sentiment of the given text.
2. Return ONLY a JSON object with this exact format:
{
  "sentiment": "positive"|"negative"|"neutral",
  "score": (number between 0 and 1 indicating confidence)
}

STRICT GUIDELINES:
- Words expressing happiness, joy, love, excitement = POSITIVE
- Words expressing sadness, anger, hate, frustration = NEGATIVE
- Neutral = no clear emotional content
- Mentions of feeling happy/good MUST be POSITIVE with high confidence
- "I'm happy" = POSITIVE with 0.9+ confidence score
- "I'm sad" = NEGATIVE with 0.9+ confidence score
- A score closer to 1.0 indicates higher confidence
- ONLY return valid JSON, no explanations`
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.05 // Very low temperature for more deterministic responses
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Perplexity API error:", errorData);
        
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Perplexity raw response:", JSON.stringify(result));
      
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
        
        if (!parsedResult.sentiment || !parsedResult.score) {
          throw new Error("Invalid sentiment data format");
        }
        
        const sentimentValue = parsedResult.sentiment.toLowerCase();
        const scoreValue = parseFloat(parsedResult.score);
        
        sentimentData = {
          sentiment: sentimentValue,
          score: scoreValue,
          analysis: [[
            { label: "POSITIVE", score: sentimentValue === "positive" ? scoreValue : (1 - scoreValue) / 2 },
            { label: "NEGATIVE", score: sentimentValue === "negative" ? scoreValue : (1 - scoreValue) / 2 },
            { label: "NEUTRAL", score: sentimentValue === "neutral" ? scoreValue : (1 - scoreValue) / 2 }
          ]]
        };
        
        console.log("Processed sentiment data:", sentimentData);
      } catch (jsonError) {
        console.error("Error parsing Perplexity response as JSON:", jsonError, "Content:", result.choices[0].message.content);
        throw jsonError;
      }
      
      return new Response(
        JSON.stringify(sentimentData),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (apiError) {
      console.error("API call error:", apiError);
      
      // More sophisticated fallback sentiment analysis
      const lowerText = text.toLowerCase();
      
      // Expanded word lists for better detection
      const positiveWords = [
        "happy", "good", "great", "excellent", "wonderful", "love", "joy", "pleased", 
        "delighted", "glad", "excited", "amazing", "awesome", "fantastic", "content",
        "thrilled", "satisfied", "proud", "grateful", "thankful", "appreciative",
        "hopeful", "optimistic", "positive", "cheerful", "merry", "jolly", "elated",
        "enjoy", "like", "adore", "cherish"
      ];
      
      const negativeWords = [
        "sad", "bad", "terrible", "awful", "hate", "unhappy", "disappointed", "upset", 
        "angry", "depressed", "miserable", "frustrated", "annoyed", "disgusted", "hurt",
        "devastated", "heartbroken", "gloomy", "melancholy", "regretful", "sorry",
        "bitter", "dismal", "distressed", "troubled", "worried", "afraid", "fearful",
        "stressed", "anxious", "dislike", "loathe", "despise"
      ];
      
      // Count word occurrences with word boundary checks
      let positiveCount = 0;
      let negativeCount = 0;
      
      positiveWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b|\\b${word}ing\\b|\\b${word}ed\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) positiveCount += matches.length;
      });
      
      negativeWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b|\\b${word}ing\\b|\\b${word}ed\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) negativeCount += matches.length;
      });
      
      // Calculate sentiment and score
      let fallbackSentiment = "neutral";
      let fallbackScore = 0.5;
      
      if (positiveCount > 0 && positiveCount > negativeCount) {
        fallbackSentiment = "positive";
        fallbackScore = 0.5 + Math.min(0.5, (positiveCount / (positiveCount + negativeCount + 1)) * 0.5);
      } else if (negativeCount > 0 && negativeCount > positiveCount) {
        fallbackSentiment = "negative";
        fallbackScore = 0.5 + Math.min(0.5, (negativeCount / (positiveCount + negativeCount + 1)) * 0.5);
      }
      
      const fallbackData = { 
        sentiment: fallbackSentiment,
        score: fallbackScore,
        analysis: [[
          { label: "POSITIVE", score: fallbackSentiment === "positive" ? fallbackScore : (1 - fallbackScore) / 2 },
          { label: "NEGATIVE", score: fallbackSentiment === "negative" ? fallbackScore : (1 - fallbackScore) / 2 },
          { label: "NEUTRAL", score: fallbackSentiment === "neutral" ? fallbackScore : (1 - fallbackScore) / 2 }
        ]],
        error: "Used fallback analysis due to API error: " + apiError.message
      };
      
      return new Response(
        JSON.stringify(fallbackData),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("General error:", error);
    
    // Return a fallback result
    return new Response(
      JSON.stringify({ 
        error: error.message,
        sentiment: "neutral",
        score: 0.5,
        analysis: [[
          { label: "POSITIVE", score: 0.25 },
          { label: "NEGATIVE", score: 0.25 },
          { label: "NEUTRAL", score: 0.5 }
        ]]
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
