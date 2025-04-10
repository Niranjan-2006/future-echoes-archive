
// Import from npm registry using Deno's npm: specifier
import { createClient } from 'npm:@supabase/supabase-js@2.39.8';

// Define interfaces for our data
interface QuestionnaireResponse {
  id: string;
  question: string;
  response: string;
  sentiment_data: any;
  question_date: string;
  response_date: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { capsuleId } = await req.json();
    
    if (!capsuleId) {
      return new Response(
        JSON.stringify({ error: 'Missing capsule ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the capsule data
    const { data: capsule, error: capsuleError } = await supabase
      .from('time_capsules')
      .select('*')
      .eq('id', capsuleId)
      .single();
    
    if (capsuleError) {
      console.error('Error fetching capsule:', capsuleError);
      return new Response(
        JSON.stringify({ error: 'Capsule not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Get all responses for this capsule
    const { data: responses, error: responsesError } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('capsule_id', capsuleId)
      .order('question_date', { ascending: true });
    
    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch responses' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Analyze responses that don't have sentiment yet
    const updatedResponses = [];
    
    for (const response of (responses as QuestionnaireResponse[] || [])) {
      if (!response.sentiment_data && response.response.trim().length > 10) {
        try {
          // Call sentiment analysis function
          const sentimentResponse = await fetch(
            `${supabaseUrl}/functions/v1/analyze-sentiment-perplexity`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
              },
              body: JSON.stringify({ text: response.response })
            }
          );
          
          if (sentimentResponse.ok) {
            const sentimentData = await sentimentResponse.json();
            console.log('Sentiment analysis result:', sentimentData);
            
            // Update the response with sentiment data
            const { error: updateError } = await supabase
              .from('questionnaire_responses')
              .update({ sentiment_data: sentimentData })
              .eq('id', response.id);
            
            if (updateError) {
              console.error(`Error updating response ${response.id}:`, updateError);
            } else {
              updatedResponses.push({
                ...response,
                sentiment_data: sentimentData
              });
            }
          } else {
            console.error('Error from sentiment analysis function:', await sentimentResponse.text());
          }
        } catch (e) {
          console.error(`Error analyzing sentiment for response ${response.id}:`, e);
        }
      } else {
        updatedResponses.push(response);
      }
    }
    
    // Generate a summary of the emotional journey
    const generateSummary = () => {
      if (updatedResponses.length === 0) {
        return {
          summary: "No reflection responses were collected during the time capsule period.",
          dominant_sentiment: "neutral",
          positive_note: "Self-reflection is a valuable practice. Consider creating more time capsules to track your emotional journey."
        };
      }
      
      // Count sentiment occurrences
      const sentiments = updatedResponses.map(r => {
        if (!r.sentiment_data) return "neutral";
        const sentiment = typeof r.sentiment_data === 'string' 
          ? JSON.parse(r.sentiment_data) 
          : r.sentiment_data;
        return (sentiment.sentiment || "").toLowerCase();
      });
      
      const sentimentCounts = {
        positive: sentiments.filter(s => s === "positive").length,
        neutral: sentiments.filter(s => s === "neutral").length,
        negative: sentiments.filter(s => s === "negative").length
      };
      
      const totalResponses = updatedResponses.length;
      
      // Determine dominant sentiment
      const dominantSentiment = Object.keys(sentimentCounts).reduce((a, b) => 
        sentimentCounts[a as keyof typeof sentimentCounts] > sentimentCounts[b as keyof typeof sentimentCounts] ? a : b
      );
      
      // Get initial capsule sentiment
      let initialSentiment = "neutral";
      if (capsule.sentiment_data) {
        const sentiment = typeof capsule.sentiment_data === 'string' 
          ? JSON.parse(capsule.sentiment_data) 
          : capsule.sentiment_data;
        initialSentiment = (sentiment.sentiment || "").toLowerCase();
      }
      
      // Generate descriptive summary
      let summary = "";
      if (dominantSentiment === "positive") {
        if (initialSentiment === "positive") {
          summary = "Throughout this period, your responses maintained a consistently positive outlook, reflecting continued optimism and good spirits.";
        } else if (initialSentiment === "negative") {
          summary = "Your journey shows a remarkable shift from initial concerns to predominantly positive reflections, suggesting personal growth and emotional resilience.";
        } else {
          summary = "Your reflections evolved into a largely positive perspective over time, showing an upward trend in your emotional well-being.";
        }
      } else if (dominantSentiment === "negative") {
        if (initialSentiment === "positive") {
          summary = "While you began with optimism, you faced some challenges during this period. Remember that emotional fluctuations are normal parts of life's journey.";
        } else if (initialSentiment === "negative") {
          summary = "You've been navigating some persistent challenges. Your consistent self-reflection shows strength and commitment to self-awareness.";
        } else {
          summary = "Your reflections reveal some emotional challenges during this period. The practice of regular reflection itself is a powerful tool for working through difficult feelings.";
        }
      } else {
        if (initialSentiment === "positive") {
          summary = "Starting from a positive outlook, your journey settled into a balanced, thoughtful perspective throughout this period.";
        } else if (initialSentiment === "negative") {
          summary = "From initial concerns, your reflections show movement toward a more balanced perspective, suggesting adaptation and emotional processing.";
        } else {
          summary = "Your reflections maintained a balanced, thoughtful perspective throughout this period, showing consistent emotional equilibrium.";
        }
      }
      
      // Positive ending notes
      const positiveNotes = [
        "Remember that self-reflection is a powerful tool for personal growth. Keep nurturing this practice.",
        "Your commitment to reflection shows incredible self-awareness. This mindfulness will continue to serve you well.",
        "Every moment of reflection is a step toward greater self-understanding. You're on a meaningful journey.",
        "The insights you've gained through reflection are valuable treasures that will guide your future path.",
        "By looking inward regularly, you've demonstrated remarkable emotional intelligence and personal strength."
      ];
      
      // Use capsule ID as a seed for seemingly random but deterministic selection
      const seed = parseInt(capsule.id.replace(/[^0-9]/g, '').substring(0, 5));
      const positiveNote = positiveNotes[seed % positiveNotes.length];
      
      return {
        summary,
        dominant_sentiment: dominantSentiment,
        initial_sentiment: initialSentiment,
        sentiment_counts: sentimentCounts,
        response_count: totalResponses,
        positive_note: positiveNote
      };
    };
    
    const emotionalJourneySummary = generateSummary();
    
    return new Response(
      JSON.stringify({
        capsule,
        responses: updatedResponses,
        emotional_journey: emotionalJourneySummary
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in analyze-capsule-responses function:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
