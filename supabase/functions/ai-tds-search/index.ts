import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Search TDS database first
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: tdsEntries, error } = await supabase
      .from('tds_entries')
      .select('reference, designation, nsn, short_name, asset_type, status')
      .or(`designation.ilike.%${query}%,short_name.ilike.%${query}%,nsn.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error('Database search error:', error);
    }

    // Use AI to enhance the search results
    const systemPrompt = `You are a TDS (Tie Down Scheme) search assistant. Help users find transportation data sheets for military vehicles and equipment. 
    When given search results, provide a concise summary and highlight the most relevant matches.`;

    const userPrompt = tdsEntries && tdsEntries.length > 0
      ? `Search query: "${query}"\n\nFound ${tdsEntries.length} matches:\n${JSON.stringify(tdsEntries, null, 2)}\n\nProvide a helpful summary of these results.`
      : `Search query: "${query}"\n\nNo exact matches found in the database. Provide helpful suggestions for alternative search terms or what the user should look for in a TDS.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('AI service error');
    }

    const aiData = await aiResponse.json();
    const aiSummary = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({
        results: tdsEntries || [],
        aiSummary,
        query
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('TDS search error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
