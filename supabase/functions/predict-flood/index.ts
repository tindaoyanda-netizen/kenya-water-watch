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

    const { countyId, weatherData } = await req.json();
    if (!countyId) {
      return new Response(JSON.stringify({ error: "countyId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather recent reports for the county
    const { data: recentReports } = await supabaseAdmin
      .from("environmental_reports")
      .select("report_type, severity_level, ai_confidence_score, created_at")
      .eq("county_id", countyId)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    // Gather recent water metrics
    const { data: recentMetrics } = await supabaseAdmin
      .from("water_metrics_history")
      .select("metric_type, metric_value, recorded_at")
      .eq("county_id", countyId)
      .gte("recorded_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("recorded_at", { ascending: false })
      .limit(50);

    const floodReports = recentReports?.filter(r => r.report_type === "flooded_road" || r.report_type === "overflowing_river") || [];
    const rainfallMetrics = recentMetrics?.filter(m => m.metric_type === "rainfall") || [];

    const prompt = `You are a flood prediction specialist for Kenya. Based on the following data for ${countyId} County, predict the flood risk for the next 48 hours.

CURRENT WEATHER:
${weatherData ? `Temperature: ${weatherData.temperature}°C, Humidity: ${weatherData.humidity}%, Rainfall (24h): ${weatherData.rainfall24h}mm` : "No current weather data"}

RECENT FLOOD-RELATED REPORTS (last 7 days): ${floodReports.length} reports
${floodReports.slice(0, 10).map(r => `- ${r.report_type} (severity: ${r.severity_level}, confidence: ${r.ai_confidence_score}%) at ${r.created_at}`).join("\n") || "None"}

RECENT RAINFALL METRICS (last 7 days): ${rainfallMetrics.length} readings
${rainfallMetrics.slice(0, 10).map(m => `- ${m.metric_value}mm at ${m.recorded_at}`).join("\n") || "None"}

Provide a 48-hour flood risk prediction.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a flood prediction AI for Kenya. Provide structured predictions." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        tools: [{
          type: "function",
          function: {
            name: "submit_prediction",
            description: "Submit flood risk prediction for a county.",
            parameters: {
              type: "object",
              properties: {
                risk_level: { type: "string", enum: ["none", "low", "moderate", "high", "critical"] },
                confidence: { type: "number", description: "Confidence 0-100" },
                summary: { type: "string", description: "2-3 sentence prediction summary" },
                factors: {
                  type: "object",
                  properties: {
                    rainfall_trend: { type: "string" },
                    report_density: { type: "string" },
                    historical_risk: { type: "string" },
                    weather_outlook: { type: "string" },
                  },
                },
              },
              required: ["risk_level", "confidence", "summary", "factors"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_prediction" } },
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
    let prediction = { risk_level: "unknown", confidence: 0, summary: "Prediction unavailable", factors: {} };

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        prediction = JSON.parse(toolCall.function.arguments);
        prediction.confidence = Math.min(100, Math.max(0, prediction.confidence));
      }
    } catch (e) {
      console.error("Failed to parse prediction:", e);
    }

    // Store prediction
    await supabaseAdmin.from("flood_predictions").insert({
      county_id: countyId,
      risk_level: prediction.risk_level,
      confidence: prediction.confidence,
      factors: prediction.factors,
      ai_summary: prediction.summary,
    });

    return new Response(JSON.stringify({ success: true, prediction }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in predict-flood:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
