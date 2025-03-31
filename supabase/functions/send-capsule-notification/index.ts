
// Import from npm registry using Deno's npm: specifier
import { createClient } from 'npm:@supabase/supabase-js@2.39.8';
import { format } from 'https://deno.land/x/date_fns@v2.22.1/index.js';

// Define the interface for request payload
interface NotificationRequest {
  capsuleId: string;
  userId: string;
  email: string;
  revealDate: string;
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
    // Check if the request is a POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      );
    }

    // Parse request body
    const requestData = await req.json() as NotificationRequest;
    console.log('Received notification request:', JSON.stringify(requestData));

    // Validate request data
    if (!requestData.capsuleId || !requestData.userId || !requestData.email || !requestData.revealDate) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey || !resendApiKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the capsule details
    const { data: capsuleData, error: capsuleError } = await supabase
      .from('time_capsules')
      .select('*')
      .eq('id', requestData.capsuleId)
      .single();

    if (capsuleError || !capsuleData) {
      console.error('Error fetching capsule:', capsuleError);
      return new Response(
        JSON.stringify({ error: 'Capsule not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Get user information for personalized email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      requestData.userId
    );

    if (userError || !userData) {
      console.error('Error fetching user data:', userError || 'No user found');
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Extract username from email
    const userName = userData.user.email?.split('@')[0] || 'there';
    const formattedRevealDate = format(new Date(requestData.revealDate), 'MMMM d, yyyy');
    
    // The URL for the capsules page
    const appUrl = Deno.env.get('APP_URL') || 'https://your-app-url.com';
    const capsuleUrl = `${appUrl}/capsules`;

    // Create email content
    const emailSubject = "Your Virtual Capsule is Now Available!";
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #4F46E5;">Hi ${userName},</h2>
        
        <p>Your Virtual Capsule is now available to view!</p>
        
        <p>You set the reveal date for ${formattedRevealDate}, and the moment has arrived! We hope you're excited to see what you wrote to your future self, and how your feelings have evolved since then. We've also analyzed the sentiment of your entries, giving you a deeper look into your emotional journey.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${capsuleUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">View Your Capsule</a>
        </div>
        
        <p>We hope you enjoy this moment of reflection and discovery.</p>
        
        <p>Thank you for using Future Echoes.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
          <p>If you didn't create this time capsule, please disregard this email.</p>
        </div>
      </div>
    `;

    // Send email using Resend
    console.log(`Sending email to ${requestData.email} with Resend API`);
    
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Future Echoes <capsules@virtualcapsule.com>',
        to: requestData.email,
        subject: emailSubject,
        html: emailHtml
      })
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      console.error('Error sending email with Resend:', resendError);
      return new Response(
        JSON.stringify({ error: 'Failed to send email notification' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const resendResult = await resendResponse.json();
    console.log('Email sent successfully:', resendResult);

    return new Response(
      JSON.stringify({ 
        message: 'Notification sent successfully',
        email: requestData.email,
        id: resendResult.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in send-capsule-notification function:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
