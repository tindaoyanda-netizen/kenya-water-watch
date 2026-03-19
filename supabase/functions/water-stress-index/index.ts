import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { countyId, countyData } = await req.json();
    if (!countyId) {
      return new Response(JSON.stringify({ error: "countyId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get recent dry borehole / broken kiosk reports
    const { data: waterIssueReports } = await supabaseAdmin
      .from("environmental_reports")
      .select("report_type, severity_level, created_at")
      .eq("county_id", countyId)
      .in("report_type", ["dry_borehole", "broken_kiosk"])
      .gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .limit(50);

    // Get water metrics
    const { data: waterMetrics } = await supabaseAdmin
      .from("water_metrics_history")
      .select("metric_type, metric_value, recorded_at")
      .eq("county_id", countyId)
      .gte("recorded_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .order("recorded_at", { ascending: false })
      .limit(50);

    const dryBoreholes = waterIssueReports?.filter(r => r.report_type === "dry_borehole") || [];
    const brokenKiosks = waterIssueReports?.filter(r => r.report_type === "broken_kiosk") || [];

    const prompt = `Calculate a Water Stress Index (0-100, where 100 = extreme stress) for ${countyId} County, Kenya.

DATA:
- Dry borehole reports (14 days): ${dryBoreholes.length}
- Broken water kiosk reports (14 days): ${brokenKiosks.length}
- Water availability: ${countyData?.waterAvailability ?? "unknown"}%
- Recent rainfall: ${countyData?.weather?.rainfall24h ?? "unknown"}mm/24h
- Population served: ${countyData?.population ?? "unknown"}
- Water metrics readings: ${waterMetrics?.length || 0}
${waterMetrics?.slice(0, 5).map(m => `  - ${m.metric_type}: ${m.metric_value} at ${m.recorded_at}`).join("\n") || "  None"}

Calculate the stress index considering supply, demand, infrastructure health, and recent trends.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a water resource analyst for Kenya. Calculate water stress indices." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        tools: [{
          type: "function",
          function: {
            name: "submit_stress_index",
            description: "Submit the calculated water stress index.",
            parameters: {
              type: "object",
              properties: {
                stress_score: { type: "number", description: "Water stress index 0-100" },
                category: { type: "string", enum: ["low", "moderate", "high", "severe", "critical"] },
                summary: { type: "string", description: "1-2 sentence assessment" },
                components: {
                  type: "object",
                  properties: {
                    supply_factor: { type: "number", description: "Supply stress 0-100" },
                    demand_factor: { type: "number", description: "Demand pressure 0-100" },
                    infrastructure_factor: { type: "number", description: "Infrastructure health stress 0-100" },
                    trend_factor: { type: "number", description: "Worsening trend 0-100" },
                  },
                },
              },
              required: ["stress_score", "category", "summary", "components"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_stress_index" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let result = { stress_score: 50, category: "moderate", summary: "Assessment unavailable", components: {} };

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        result = JSON.parse(toolCall.function.arguments);
        result.stress_score = Math.min(100, Math.max(0, result.stress_score));
      }
    } catch (e) {
      console.error("Failed to parse stress index:", e);
    }

    // Store result
    await supabaseAdmin.from("water_stress_index").insert({
      county_id: countyId,
      stress_score: result.stress_score,
      components: { ...result.components, category: result.category, summary: result.summary },
    });

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in water-stress-index:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
