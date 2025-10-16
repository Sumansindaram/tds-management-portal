import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  name: string;
  reference: string;
  status: string;
  comment: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("TDS notification function invoked");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, reference, status, comment }: EmailRequest = await req.json();
    
    console.log(`Sending notification for ${reference} to ${email}`);

    const subject = `TDS Request ${reference} - ${status}`;
    const body = `Dear ${name},

Your TDS request (${reference}) has been ${status.toLowerCase()} by the TDS Review Team.

${comment ? `Comments:\n${comment}\n\n` : ''}Kind regards,
MOD TDS Team
JSP 800 Vol 7 Portal`;

    // Log email details for development
    console.log("Email notification details:", {
      to: email,
      subject,
      preview: body.substring(0, 100),
    });

    // In production, integrate with email service (Resend, SendGrid, etc.)
    // For now, return success
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification logged (email service to be configured)" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-tds-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);