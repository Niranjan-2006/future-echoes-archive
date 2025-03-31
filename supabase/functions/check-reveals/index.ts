
// Import from npm registry using Deno's npm: specifier
import { createClient } from 'npm:@supabase/supabase-js@2.39.8';

// Define the interface for time capsules
interface TimeCapsule {
  id: string;
  user_id: string;
  message: string;
  image_url: string | null;
  reveal_date: string;
  is_revealed: boolean;
  created_at: string;
}

// Define the interface for users
interface User {
  id: string;
  email: string;
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
    console.log('Checking for capsules to reveal...');

    // Get current time
    const now = new Date();
    console.log(`Current time: ${now.toISOString()}`);

    // Get all unrevealed capsules that should be revealed now
    const { data: capsules, error: capsuleError } = await supabase
      .from('time_capsules')
      .select('*')
      .eq('is_revealed', false)
      .lte('reveal_date', now.toISOString());

    if (capsuleError) {
      console.error('Error fetching capsules:', capsuleError);
      throw capsuleError;
    }

    console.log(`Found ${capsules?.length || 0} capsules to reveal`);

    // If no capsules to reveal, return early
    if (!capsules || capsules.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No capsules to reveal at this time' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each capsule
    const processedCapsules = [];
    
    for (const capsule of capsules as TimeCapsule[]) {
      console.log(`Processing capsule: ${capsule.id} for user: ${capsule.user_id}`);
      
      try {
        // Mark capsule as revealed
        const { error: updateError } = await supabase
          .from('time_capsules')
          .update({ is_revealed: true })
          .eq('id', capsule.id);

        if (updateError) {
          console.error(`Error updating capsule ${capsule.id}:`, updateError);
          continue;  // Skip to next capsule
        }

        // Get user information for email notification
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
          capsule.user_id
        );
        
        if (userError || !userData || !userData.user) {
          console.error(`Error fetching user data for ${capsule.user_id}:`, userError || 'No user found');
          continue;  // Skip to next capsule
        }
        
        const userEmail = userData.user.email;
        
        if (!userEmail) {
          console.error(`No email found for user ${capsule.user_id}`);
          continue;  // Skip to next capsule
        }

        // Send notification email
        console.log(`Calling notification function for capsule: ${capsule.id} to email: ${userEmail}`);
        
        const notificationResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-capsule-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              capsuleId: capsule.id,
              userId: capsule.user_id,
              email: userEmail,
              revealDate: capsule.reveal_date
            })
          }
        );
        
        if (!notificationResponse.ok) {
          const errorText = await notificationResponse.text();
          console.error(`Error sending notification for capsule ${capsule.id}:`, errorText);
        } else {
          const resultText = await notificationResponse.text();
          console.log(`Notification sent successfully for capsule ${capsule.id}:`, resultText);
        }
        
        processedCapsules.push(capsule.id);
      } catch (err) {
        console.error(`Error processing capsule ${capsule.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${processedCapsules.length} capsules`, 
        revealed_capsules: processedCapsules 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in check-reveals function:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
