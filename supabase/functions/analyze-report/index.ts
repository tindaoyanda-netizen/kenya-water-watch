import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReportAnalysisRequest {
  reportId: string;
  reportType: string;
  countyId: string;
  townName: string | null;
  latitude: number;
  longitude: number;
  description: string | null;
  weatherData?: {
    temperature: number;
    humidity: number;
    rainfall24h: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      reportId,
      reportType,
      countyId,
      townName,
      latitude,
      longitude,
      description,
      weatherData,
    }: ReportAnalysisRequest = await req.json();

    console.log("Analyzing report:", { reportId, reportType, countyId });

    // Fetch similar recent reports in the area for duplicate detection
    const { data: similarReports } = await supabase
      .from("environmental_reports")
      .select("id, report_type, latitude, longitude, created_at, description")
      .eq("county_id", countyId)
      .eq("report_type", reportType)
      .neq("id", reportId)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(10);

    // Check for potential duplicates (same type within 500m radius in last 24h)
    let isDuplicate = false;
    let duplicateOfId: string | null = null;

    if (similarReports && similarReports.length > 0) {
      for (const report of similarReports) {
        const distance = calculateDistance(
          latitude,
          longitude,
          Number(report.latitude),
          Number(report.longitude)
        );
        if (distance < 0.5) {
          // Within 500 meters
          isDuplicate = true;
          duplicateOfId = report.id;
          break;
        }
      }
    }

    // Use Lovable AI to analyze the report
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const reportTypeDescriptions: Record<string, string> = {
      flooded_road: "a flooded road or street",
      dry_borehole: "a dry or non-functioning borehole",
      broken_kiosk: "a broken or damaged water kiosk",
      overflowing_river: "an overflowing river or stream",
    };

    const systemPrompt = `You are an environmental report analyst for AquaGuard Kenya, a water monitoring and flood alert system. Your role is to analyze community-submitted environmental reports and provide:
1. A confidence score (0-100) indicating how credible and actionable the report appears
2. A brief analysis explaining your assessment

Consider these factors:
- Weather conditions (if provided)
- Report type and description quality
- Geographic context (Kenya counties)
- Similar reports in the area (potential duplicates)
- Seasonal patterns and typical environmental conditions

Be objective and scientific in your assessment. Acknowledge uncertainty where appropriate.
Provide your response as valid JSON with "confidence_score" (integer 0-100) and "analysis" (string) fields.`;

    const userPrompt = `Analyze this environmental report:

Report Type: ${reportTypeDescriptions[reportType] || reportType}
Location: ${townName ? `${townName}, ` : ""}${countyId} County, Kenya
Coordinates: ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°
Description: ${description || "No description provided"}
${
  weatherData
    ? `Current Weather: Temperature ${weatherData.temperature}°C, Humidity ${weatherData.humidity}%, Rainfall (24h): ${weatherData.rainfall24h}mm`
    : ""
}
Similar reports in area (24h): ${similarReports?.length || 0}
${isDuplicate ? "⚠️ Potential duplicate detected within 500m radius" : ""}

Provide a JSON response with confidence_score and analysis.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    console.log("AI Response:", aiContent);

    // Parse AI response
    let confidenceScore = 50;
    let analysis = "Analysis could not be completed. Manual review recommended.";

    try {
      // Extract JSON from response (may be wrapped in markdown)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        confidenceScore = Math.min(100, Math.max(0, parseInt(parsed.confidence_score) || 50));
        analysis = parsed.analysis || analysis;
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Use the raw content as analysis if JSON parsing fails
      if (aiContent.length > 0) {
        analysis = aiContent.slice(0, 500);
      }
    }

    // Adjust confidence based on duplicate detection
    if (isDuplicate) {
      confidenceScore = Math.max(20, confidenceScore - 30);
      analysis = `⚠️ POTENTIAL DUPLICATE: A similar ${reportType.replace("_", " ")} report was submitted nearby within the last 24 hours. ${analysis}`;
    }

    // Update the report with AI analysis
    const { error: updateError } = await supabase
      .from("environmental_reports")
      .update({
        ai_confidence_score: confidenceScore,
        ai_analysis: analysis,
        is_duplicate: isDuplicate,
        duplicate_of: duplicateOfId,
      })
      .eq("id", reportId);

    if (updateError) {
      console.error("Failed to update report:", updateError);
      throw new Error("Failed to save analysis");
    }

    console.log("Report analysis complete:", { reportId, confidenceScore, isDuplicate });

    return new Response(
      JSON.stringify({
        success: true,
        confidence_score: confidenceScore,
        analysis,
        is_duplicate: isDuplicate,
        duplicate_of: duplicateOfId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-report:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
