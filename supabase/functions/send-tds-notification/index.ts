import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

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

// Simple input validation
function validateEmailRequest(data: any): data is EmailRequest {
  return (
    typeof data.email === 'string' &&
    data.email.length > 0 &&
    data.email.length <= 255 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) &&
    typeof data.name === 'string' &&
    data.name.length > 0 &&
    data.name.length <= 200 &&
    typeof data.reference === 'string' &&
    /^TDS-\d{6}$/.test(data.reference) &&
    typeof data.status === 'string' &&
    ['Approved', 'Rejected', 'Returned'].includes(data.status) &&
    typeof data.comment === 'string' &&
    data.comment.length <= 2000
  );
}

const handler = async (req: Request): Promise<Response> => {
  console.log("TDS notification function invoked");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Authentication required" 
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase client with the user's token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // 2. Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Invalid authentication token");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid authentication" 
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // 3. Verify user has admin or super_admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    if (roleError || !roleData) {
      console.error("User lacks admin privileges");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Insufficient permissions" 
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // 4. Validate input data
    const requestData = await req.json();
    if (!validateEmailRequest(requestData)) {
      console.error("Invalid request data format");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid request data" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { email, name, reference, status, comment }: EmailRequest = requestData;
    
    // 5. Verify the TDS entry exists (additional security check)
    const { data: entryData, error: entryError } = await supabase
      .from('tds_entries')
      .select('id')
      .eq('reference', reference)
      .maybeSingle();

    if (entryError || !entryData) {
      console.error("TDS entry not found for reference:", reference);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid reference" 
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Log without PII - only reference and status
    console.log(`Notification requested - Reference: ${reference}, Status: ${status}, Admin: ${user.id}`);

    const subject = `TDS Request ${reference} - ${status}`;
    const body = `Dear ${name},

Your TDS request (${reference}) has been ${status.toLowerCase()} by the TDS Review Team.

${comment ? `Comments:\n${comment}\n\n` : ''}Kind regards,
MOD TDS Team
JSP 800 Vol 7 Portal`;

    // No PII logging - email content prepared for sending

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
      JSON.stringify({ 
        success: false, 
        error: "Unable to send notification. Please try again later." 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);