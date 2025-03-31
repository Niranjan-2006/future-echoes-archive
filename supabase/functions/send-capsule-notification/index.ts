
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  userName: string
  email: string
  revealDate: string
  capsuleLink: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userName, email, revealDate, capsuleLink }: NotificationRequest = await req.json()
    
    if (!email) {
      throw new Error("Email address is required")
    }
    
    console.log(`Sending capsule notification email to: ${email}`)
    
    const { data, error } = await resend.emails.send({
      from: "Future Echoes <notifications@resend.dev>",
      to: email,
      subject: "Your Virtual Capsule is now revealed!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Hi ${userName},</h2>
          
          <p>Your Virtual Capsule is now available to view!</p>
          
          <p>You set the reveal date for ${revealDate}, and the moment has arrived! We hope you're excited to see what you wrote to your future self, and how your feelings have evolved since then. We've also analyzed the sentiment of your entries, giving you a deeper look into your emotional journey.</p>
          
          <div style="margin: 30px 0;">
            <a href="${capsuleLink}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Your Revealed Capsule</a>
          </div>
          
          <p>We hope you enjoy this moment of reflection and discovery.</p>
          
          <p>Thank you for using Future Echoes.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eaeaea;" />
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
        </div>
      `,
    })
    
    if (error) {
      console.error("Resend API error:", error)
      throw error
    }
    
    console.log("Email sent successfully:", data)
    
    return new Response(JSON.stringify({ success: true, message: "Email notification sent" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in send-capsule-notification function:", error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
