import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SSRRow {
  delivery_team: string;
  title?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role_type: string;
  status?: string;
  // Asset fields (optional, for combined CSV)
  asset_nsn?: string;
  asset_code?: string;
  asset_designation?: string;
  asset_type?: string;
  asset_short_name?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvData, mode } = await req.json(); // mode: 'ssr_only' or 'ssr_with_assets'
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse CSV data
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
    
    const results = {
      ssrsCreated: 0,
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

        // Create SSR record
        const ssrData = {
          delivery_team: row.delivery_team || row.team,
          title: row.title,
          first_name: row.first_name || row.firstname,
          last_name: row.last_name || row.lastname,
          email: row.email,
          phone: row.phone,
          role_type: row.role_type || row.role || 'Safety Officer',
          status: row.status || 'active',
        };

        // Validate required fields
        if (!ssrData.first_name || !ssrData.last_name || !ssrData.email || !ssrData.delivery_team) {
          results.errors.push(`Row ${i + 1}: Missing required SSR fields`);
          continue;
        }

        const { data: ssrRecord, error: ssrError } = await supabase
          .from('ssrs')
          .insert([ssrData])
          .select()
          .single();

        if (ssrError) {
          results.errors.push(`Row ${i + 1}: Failed to create SSR - ${ssrError.message}`);
          continue;
        }

        results.ssrsCreated++;

        // If mode includes assets and asset fields are present
        if (mode === 'ssr_with_assets' && (row.asset_nsn || row.nsn)) {
          const assetData = {
            ssr_id: ssrRecord.id,
            nsn: row.asset_nsn || row.nsn || '',
            asset_code: row.asset_code || row.code || '',
            designation: row.asset_designation || row.designation || '',
            asset_type: row.asset_type || row.type || 'Other',
            short_name: row.asset_short_name || row.short_name || '',
            status: 'active',
          };

          if (assetData.nsn && assetData.asset_code && assetData.designation) {
            const { error: assetError } = await supabase
              .from('ssr_assets')
              .insert([assetData]);

            if (assetError) {
              results.errors.push(`Row ${i + 1}: SSR created but failed to add asset - ${assetError.message}`);
            } else {
              results.assetsCreated++;
            }
          }
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
    console.error('CSV processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
