
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    
    // Get newly revealed capsules (ones that should be revealed but aren't marked as revealed yet)
    const { data: capsulesToReveal, error: fetchError } = await supabase
      .from('time_capsules')
      .select('*, auth.users!inner(email, raw_user_meta_data)')
      .eq('is_revealed', false)
      .lte('reveal_date', now.toISOString())
    
    if (fetchError) throw fetchError
    
    // Update capsules to mark them as revealed
    if (capsulesToReveal && capsulesToReveal.length > 0) {
      const { error: updateError } = await supabase
        .from('time_capsules')
        .update({ is_revealed: true })
        .in('id', capsulesToReveal.map(capsule => capsule.id))
      
      if (updateError) throw updateError
      
      // Send email notifications for each revealed capsule
      if (capsulesToReveal.length > 0) {
        try {
          const emailPromises = capsulesToReveal.map(async (capsule) => {
            // Format reveals for better readability in email
            const revealDate = new Date(capsule.reveal_date)
            const formattedRevealDate = revealDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
            
            // Get user information
            const user = capsule.users
            const userName = user?.raw_user_meta_data?.name || 'there'
            const userEmail = user?.email
            
            if (!userEmail) {
              console.error(`No email found for user related to capsule ID: ${capsule.id}`)
              return
            }

            // Construct app URL for capsule link
            const appURL = new URL(req.url).origin.replace('functions', 'app')
            const capsuleLink = `${appURL}/capsules`
            
            // Call the send-capsule-notification function to send the email
            await supabase.functions.invoke('send-capsule-notification', {
              body: {
                userName,
                email: userEmail,
                revealDate: formattedRevealDate,
                capsuleLink
              }
            })
            
            console.log(`Email notification sent for capsule ID: ${capsule.id} to user: ${userEmail}`)
          })
          
          await Promise.all(emailPromises)
        } catch (emailError) {
          console.error("Error sending email notifications:", emailError)
          // Continue execution even if email sending fails
        }
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Reveals checked successfully',
      revealed_count: capsulesToReveal ? capsulesToReveal.length : 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in check-reveals function:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
