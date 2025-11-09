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
    const { csvData, ssrId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse CSV data
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
    
    const results = {
      assetsCreated: 0,
      errors: [] as string[],
    };

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map((v: string) => v.trim());
        const row: any = {};
        
        headers.forEach((header: string, index: number) => {
          row[header] = values[index] || '';
        });

        const assetData = {
          ssr_id: ssrId,
          nsn: row.nsn || '',
          asset_code: row.asset_code || row.code || '',
          designation: row.designation || '',
          asset_type: row.asset_type || row.type || 'Other',
          short_name: row.short_name || '',
          status: row.status || 'active',
        };

        // Validate required fields
        if (!assetData.nsn || !assetData.asset_code || !assetData.designation) {
          results.errors.push(`Row ${i + 1}: Missing required fields (NSN, asset_code, designation)`);
          continue;
        }

        const { error } = await supabase
          .from('ssr_assets')
          .insert([assetData]);

        if (error) {
          results.errors.push(`Row ${i + 1}: ${error.message}`);
        } else {
          results.assetsCreated++;
        }
      } catch (error: any) {
        results.errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Assets CSV processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
