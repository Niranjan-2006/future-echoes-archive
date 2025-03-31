
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
    console.log("Starting check-reveals function...")
    
    // Initialize Supabase client with the service role key for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    console.log(`Current time: ${now.toISOString()}`)
    
    // Get newly revealed capsules (ones that should be revealed but aren't marked as revealed yet)
    const { data: capsulesToReveal, error: fetchError } = await supabase
      .from('time_capsules')
      .select('*, profiles!inner(*), auth.users!inner(email, raw_user_meta_data)')
      .eq('is_revealed', false)
      .lte('reveal_date', now.toISOString())
    
    if (fetchError) {
      console.error("Error fetching capsules to reveal:", fetchError)
      throw fetchError
    }
    
    console.log(`Found ${capsulesToReveal?.length || 0} capsules to reveal`)
    
    // Update capsules to mark them as revealed
    if (capsulesToReveal && capsulesToReveal.length > 0) {
      console.log("Updating capsules to mark them as revealed")
      
      const { error: updateError } = await supabase
        .from('time_capsules')
        .update({ is_revealed: true })
        .in('id', capsulesToReveal.map(capsule => capsule.id))
      
      if (updateError) {
        console.error("Error updating capsules:", updateError)
        throw updateError
      }
      
      console.log("Successfully marked capsules as revealed")
      
      // Send email notifications for each revealed capsule
      if (capsulesToReveal.length > 0) {
        try {
          console.log("Preparing to send email notifications...")
          
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

            console.log(`Preparing email for user: ${userName} (${userEmail}) for capsule ID: ${capsule.id}`)

            // Construct app URL for capsule link - fix the URL construction
            const appURL = "https://futurechoes.app"
            const capsuleLink = `${appURL}/capsules`
            
            console.log(`Sending notification with capsule link: ${capsuleLink}`)
            
            // Call the send-capsule-notification function to send the email
            const { data, error } = await supabase.functions.invoke('send-capsule-notification', {
              body: {
                userName,
                email: userEmail,
                revealDate: formattedRevealDate,
                capsuleLink
              }
            })
            
            if (error) {
              console.error(`Error invoking send-capsule-notification for user ${userEmail}:`, error)
              throw error
            }
            
            console.log(`Email notification sent for capsule ID: ${capsule.id} to user: ${userEmail}`, data)
          })
          
          await Promise.all(emailPromises)
          console.log("All email notifications sent successfully")
        } catch (emailError) {
          console.error("Error sending email notifications:", emailError)
          // Continue execution even if email sending fails
        }
      }
    } else {
      console.log("No capsules need to be revealed at this time")
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
