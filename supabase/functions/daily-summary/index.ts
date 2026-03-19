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

    // Verify caller is county_admin
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

    // Verify admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "county_admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get admin's county
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("county_id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const countyId = profile.county_id;
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Gather today's data
    const [reportsRes, escalatedRes, predictionsRes, stressRes] = await Promise.all([
      supabaseAdmin.from("environmental_reports")
        .select("report_type, status, severity_level, ai_confidence_score, escalated")
        .eq("county_id", countyId)
        .gte("created_at", last24h),
      supabaseAdmin.from("environmental_reports")
        .select("report_type, severity_level, town_name, description")
        .eq("county_id", countyId)
        .eq("escalated", true)
        .eq("status", "pending")
        .limit(10),
      supabaseAdmin.from("flood_predictions")
        .select("risk_level, confidence, ai_summary")
        .eq("county_id", countyId)
        .order("created_at", { ascending: false })
        .limit(1),
      supabaseAdmin.from("water_stress_index")
        .select("stress_score, components")
        .eq("county_id", countyId)
        .order("calculated_at", { ascending: false })
        .limit(1),
    ]);

    const reports = reportsRes.data || [];
    const escalated = escalatedRes.data || [];
    const latestPrediction = predictionsRes.data?.[0];
    const latestStress = stressRes.data?.[0];

    const reportsByType: Record<string, number> = {};
    const reportsByStatus: Record<string, number> = {};
    const reportsBySeverity: Record<string, number> = {};

    for (const r of reports) {
      reportsByType[r.report_type] = (reportsByType[r.report_type] || 0) + 1;
      reportsByStatus[r.status] = (reportsByStatus[r.status] || 0) + 1;
      reportsBySeverity[r.severity_level || "low"] = (reportsBySeverity[r.severity_level || "low"] || 0) + 1;
    }

    // Generate AI summary
    const prompt = `Generate a concise daily briefing for the County Admin of ${countyId} County, Kenya.

TODAY'S DATA (last 24h):
- Total reports: ${reports.length}
- By type: ${JSON.stringify(reportsByType)}
- By status: ${JSON.stringify(reportsByStatus)}
- By severity: ${JSON.stringify(reportsBySeverity)}
- Escalated (pending): ${escalated.length}
${escalated.slice(0, 3).map(e => `  🚨 ${e.report_type} in ${e.town_name || "unknown area"}: ${e.description?.slice(0, 80) || "no description"}`).join("\n")}

FLOOD PREDICTION: ${latestPrediction ? `${latestPrediction.risk_level} risk (${latestPrediction.confidence}% confidence) — ${latestPrediction.ai_summary}` : "No prediction available"}

WATER STRESS INDEX: ${latestStress ? `Score: ${latestStress.stress_score}/100` : "Not calculated"}

Provide a brief, actionable daily summary.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are an AI assistant for county water management administrators in Kenya. Generate concise, actionable daily briefings." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
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
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiSummary = aiData.choices?.[0]?.message?.content || "Summary generation failed.";

    return new Response(JSON.stringify({
      success: true,
      county_id: countyId,
      date: new Date().toISOString().split("T")[0],
      stats: {
        total_reports: reports.length,
        by_type: reportsByType,
        by_status: reportsByStatus,
        by_severity: reportsBySeverity,
        escalated_pending: escalated.length,
      },
      flood_prediction: latestPrediction || null,
      water_stress: latestStress || null,
      ai_summary: aiSummary,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in daily-summary:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
