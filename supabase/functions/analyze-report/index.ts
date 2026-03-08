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

// Kenya-specific flood-prone regions and their risk factors
const FLOOD_PRONE_REGIONS: Record<string, { rivers: string[]; riskFactors: string[]; historicalPattern: string }> = {
  kakamega: { rivers: ['Nzoia', 'Yala'], riskFactors: ['Budalangi floodplain', 'Lake Victoria backflow', 'high rainfall zone'], historicalPattern: 'Annual flooding during long rains (Mar-May), flash floods common in Mumias and Budalangi' },
  kisumu: { rivers: ['Nyando', 'Sondu-Miriu'], riskFactors: ['Lake Victoria proximity', 'Kano Plains floodplain', 'poor drainage'], historicalPattern: 'Regular flooding in Nyando basin, Nyalenda slums affected during heavy rains' },
  siaya: { rivers: ['Yala', 'Nzoia'], riskFactors: ['Yala Swamp', 'Lake Victoria proximity', 'flat terrain'], historicalPattern: 'Seasonal flooding in Yala Swamp area, Bondo and Usonga affected' },
  homabay: { rivers: ['Kuja', 'Migori'], riskFactors: ['Lake Victoria shoreline', 'river convergence'], historicalPattern: 'Lakeside flooding during high lake levels' },
  busia: { rivers: ['Nzoia', 'Sio'], riskFactors: ['Budalangi floodplain extension', 'flat lowlands'], historicalPattern: 'Severe annual flooding in Budalangi division' },
  tanariver: { rivers: ['Tana'], riskFactors: ['Tana River floodplain', 'dam releases from Seven Forks', 'low elevation'], historicalPattern: 'Devastating floods when upstream dams release water, affects Garsen and Hola' },
  garissa: { rivers: ['Tana', 'Ewaso Ng\'iro'], riskFactors: ['semi-arid flash floods', 'Tana River overflow'], historicalPattern: 'Flash floods during October-December short rains, riverbank flooding' },
  kilifi: { rivers: ['Sabaki/Athi', 'Rare'], riskFactors: ['coastal lowlands', 'river deltas', 'poor drainage'], historicalPattern: 'Coastal flooding during monsoon, Malindi frequently affected' },
  mombasa: { rivers: [], riskFactors: ['coastal storm surges', 'poor urban drainage', 'low-lying island geography'], historicalPattern: 'Urban flooding in Likoni, Kisauni; tidal flooding during high tide + rainfall events' },
  nairobi: { rivers: ['Nairobi', 'Mathare', 'Ngong'], riskFactors: ['rapid urbanization', 'clogged drains', 'informal settlements on riverbanks'], historicalPattern: 'Flash floods in Mathare, Kibera, Eastleigh during moderate-heavy rainfall (>20mm/day)' },
  turkana: { rivers: ['Turkwel', 'Kerio'], riskFactors: ['dry riverbed flash floods', 'desert terrain'], historicalPattern: 'Rare but deadly flash floods in dry riverbeds during sudden rainfall' },
  marsabit: { rivers: [], riskFactors: ['desert flash floods', 'volcanic terrain'], historicalPattern: 'Flash floods in wadis during short rains' },
  mandera: { rivers: ['Daua'], riskFactors: ['semi-arid terrain', 'Daua River overflow'], historicalPattern: 'River flooding from Ethiopian highlands runoff' },
  wajir: { rivers: ['Ewaso Ng\'iro'], riskFactors: ['dry riverbed flash floods'], historicalPattern: 'Occasional flash floods during short rains' },
  nyandarua: { rivers: ['Malewa', 'Gilgil', 'Turasha'], riskFactors: ['highland water catchment', 'steep terrain'], historicalPattern: 'Landslides and flooding in valleys during heavy rains' },
  nyeri: { rivers: ['Sagana', 'Chania'], riskFactors: ['Mt. Kenya runoff', 'steep terrain'], historicalPattern: 'River flooding from Mt. Kenya glacial melt + rainfall' },
  muranga: { rivers: ['Mathioya', 'Maragua'], riskFactors: ['steep highland terrain', 'deforestation'], historicalPattern: 'Landslides and flash floods in deforested areas' },
  westpokot: { rivers: ['Kerio', 'Wei Wei'], riskFactors: ['steep terrain', 'landslides'], historicalPattern: 'Deadly landslides during heavy rains, 2019 major disaster' },
  elgeyomarakwet: { rivers: ['Kerio'], riskFactors: ['Kerio Valley floor', 'landslide-prone escarpments'], historicalPattern: 'Valley flooding and escarpment landslides' },
  baringo: { rivers: ['Perkerra', 'Molo'], riskFactors: ['Lake Baringo rising levels', 'Perkerra River floods'], historicalPattern: 'Lake Baringo has been rising steadily, displacing communities' },
  nakuru: { rivers: ['Njoro', 'Makalia'], riskFactors: ['Lake Nakuru basin'], historicalPattern: 'Occasional flooding near Lake Nakuru' },
  narok: { rivers: ['Mara', 'Ewaso Ng\'iro'], riskFactors: ['Mara River overflow'], historicalPattern: 'Flooding during heavy rains in Mara basin' },
  bomet: { rivers: ['Nyangores', 'Amala'], riskFactors: ['Mara River tributaries'], historicalPattern: 'River flooding in lowland areas' },
  nyamira: { rivers: ['Gucha'], riskFactors: ['highland terrain', 'heavy rainfall zone'], historicalPattern: 'Frequent flooding during long rains' },
  migori: { rivers: ['Migori', 'Kuja'], riskFactors: ['Lake Victoria proximity', 'river flooding'], historicalPattern: 'Regular seasonal flooding' },
};

// Rainfall thresholds for Kenya (mm in 24h)
const RAINFALL_THRESHOLDS = {
  light: 10,      // Normal
  moderate: 25,    // Watch advisories
  heavy: 50,       // Flood warnings for vulnerable areas
  extreme: 100,    // Severe flood warnings nationwide
};

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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
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

    // Fetch similar recent reports for duplicate detection
    const { data: similarReports } = await supabaseAdmin
      .from("environmental_reports")
      .select("id, report_type, latitude, longitude, created_at, description")
      .eq("county_id", countyId)
      .eq("report_type", reportType)
      .neq("id", reportId)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(10);

    // Duplicate detection (same type within 500m in last 24h)
    let isDuplicate = false;
    let duplicateOfId: string | null = null;

    if (similarReports && similarReports.length > 0) {
      for (const report of similarReports) {
        const distance = calculateDistance(latitude, longitude, Number(report.latitude), Number(report.longitude));
        if (distance < 0.5) {
          isDuplicate = true;
          duplicateOfId = report.id;
          break;
        }
      }
    }

    // Build regional context
    const floodContext = FLOOD_PRONE_REGIONS[countyId];
    const rainfallLevel = weatherData
      ? weatherData.rainfall24h >= RAINFALL_THRESHOLDS.extreme ? 'EXTREME'
        : weatherData.rainfall24h >= RAINFALL_THRESHOLDS.heavy ? 'HEAVY'
        : weatherData.rainfall24h >= RAINFALL_THRESHOLDS.moderate ? 'MODERATE'
        : weatherData.rainfall24h >= RAINFALL_THRESHOLDS.light ? 'LIGHT'
        : 'MINIMAL'
      : 'UNKNOWN';

    // Use Lovable AI for analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const reportTypeDescriptions: Record<string, string> = {
      flooded_road: "a flooded road or street",
      dry_borehole: "a dry or non-functioning borehole",
      broken_kiosk: "a broken or damaged water kiosk",
      overflowing_river: "an overflowing river or stream",
    };

    const systemPrompt = `You are an expert environmental analyst for AquaGuard Kenya, specializing in East African hydrology, flood prediction, and water infrastructure. You analyze community-submitted environmental reports with scientific rigor.

KEY KNOWLEDGE:
- Kenya has two rainy seasons: Long Rains (March-May) and Short Rains (October-December).
- Flood-prone regions: Budalangi (Nzoia River), Kano Plains (Kisumu), Tana River delta, coastal Mombasa/Kilifi, and urban Nairobi informal settlements.
- Arid/semi-arid counties (Turkana, Marsabit, Wajir, Mandera, Garissa, Isiolo) experience flash floods in dry riverbeds.
- Rainfall >50mm/24h is considered heavy and flood-triggering in vulnerable areas.
- Rainfall >25mm/24h can cause urban flooding in poorly drained areas like Nairobi slums.
- Dry boreholes are common in arid counties (Turkana, Marsabit) but alarming in normally well-watered counties.
- Lake Victoria basin counties regularly experience backflow flooding.
- Climate change has increased rainfall variability and extreme events in Kenya.

ANALYSIS CRITERIA:
1. Cross-reference the report type with current weather conditions — does the weather support the claim?
2. Consider regional flood history and vulnerability.
3. Evaluate the description quality and specificity.
4. Factor in the number of similar reports (corroboration increases confidence).
5. Consider seasonal patterns — is this report consistent with the current season?
6. For flood reports: check rainfall thresholds against regional vulnerability.
7. For dry borehole reports: consider the county's typical water stress and recent rainfall.
8. Be skeptical of flood reports in arid regions with no recent rainfall (unless flash flood patterns).
9. Be skeptical of dry borehole reports in well-watered highland counties.`;

    const userPrompt = `Analyze this environmental report from Kenya:

REPORT TYPE: ${reportTypeDescriptions[reportType] || reportType}
LOCATION: ${townName ? `${townName}, ` : ""}${countyId} County, Kenya
GPS: ${latitude.toFixed(4)}°S, ${longitude.toFixed(4)}°E
DESCRIPTION: ${description || "No description provided"}

WEATHER CONDITIONS:
${weatherData
  ? `- Temperature: ${weatherData.temperature}°C
- Humidity: ${weatherData.humidity}%
- Rainfall (24h): ${weatherData.rainfall24h}mm (${rainfallLevel})
- Flood-triggering threshold for this region: ${weatherData.rainfall24h >= RAINFALL_THRESHOLDS.heavy ? 'EXCEEDED' : weatherData.rainfall24h >= RAINFALL_THRESHOLDS.moderate ? 'APPROACHING' : 'NOT REACHED'}`
  : "Weather data unavailable"}

REGIONAL FLOOD CONTEXT:
${floodContext
  ? `- Known rivers: ${floodContext.rivers.join(', ') || 'None major'}
- Risk factors: ${floodContext.riskFactors.join(', ')}
- Historical pattern: ${floodContext.historicalPattern}`
  : "No specific flood data for this county"}

CORROBORATION: ${similarReports?.length || 0} similar reports in this area in the last 24h
${isDuplicate ? "⚠️ POTENTIAL DUPLICATE: Nearly identical report within 500m radius in last 24h" : ""}

Provide your analysis.`;

    // Use tool calling for structured output
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        temperature: 0.2,
        tools: [
          {
            type: "function",
            function: {
              name: "submit_analysis",
              description: "Submit the environmental report analysis with a confidence score and detailed assessment.",
              parameters: {
                type: "object",
                properties: {
                  confidence_score: {
                    type: "integer",
                    description: "Credibility score 0-100. 80-100: Very credible, weather/context strongly supports. 60-79: Likely credible, some supporting evidence. 40-59: Uncertain, mixed signals. 20-39: Unlikely, conditions don't support. 0-19: Very unlikely or suspected false report.",
                  },
                  analysis: {
                    type: "string",
                    description: "2-4 sentence scientific assessment. Reference specific weather data, regional flood history, or water infrastructure context. Explain what supports or contradicts the report.",
                  },
                  flood_risk_assessment: {
                    type: "string",
                    enum: ["none", "low", "moderate", "high", "critical"],
                    description: "Current flood risk level for this specific location based on weather, terrain, and report type.",
                  },
                  recommended_action: {
                    type: "string",
                    description: "Specific recommended action for the County Admin (e.g., 'Deploy field team to verify', 'Issue flood warning for affected area', 'Mark as low priority').",
                  },
                },
                required: ["confidence_score", "analysis", "flood_risk_assessment", "recommended_action"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_analysis" } },
      }),
    });

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
    console.log("AI Response:", JSON.stringify(aiData));

    // Parse structured tool call response
    let confidenceScore = 50;
    let analysis = "Analysis could not be completed. Manual review recommended.";
    let floodRiskAssessment = "unknown";
    let recommendedAction = "Manual review required.";

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        confidenceScore = Math.min(100, Math.max(0, parseInt(parsed.confidence_score) || 50));
        analysis = parsed.analysis || analysis;
        floodRiskAssessment = parsed.flood_risk_assessment || floodRiskAssessment;
        recommendedAction = parsed.recommended_action || recommendedAction;
      } else {
        // Fallback: try parsing content as JSON
        const content = aiData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          confidenceScore = Math.min(100, Math.max(0, parseInt(parsed.confidence_score) || 50));
          analysis = parsed.analysis || analysis;
        }
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
    }

    // Adjust for duplicates
    if (isDuplicate) {
      confidenceScore = Math.max(20, confidenceScore - 25);
      analysis = `⚠️ POTENTIAL DUPLICATE: A similar ${reportType.replace(/_/g, " ")} report exists within 500m from the last 24h. ${analysis}`;
    }

    // Build full analysis text with structured data
    const fullAnalysis = `${analysis}\n\n📊 Flood Risk: ${floodRiskAssessment.toUpperCase()}\n🎯 Recommended: ${recommendedAction}`;

    // Update report in database
    const { error: updateError } = await supabaseAdmin
      .from("environmental_reports")
      .update({
        ai_confidence_score: confidenceScore,
        ai_analysis: fullAnalysis,
        is_duplicate: isDuplicate,
        duplicate_of: duplicateOfId,
      })
      .eq("id", reportId);

    if (updateError) {
      console.error("Failed to update report:", updateError);
      throw new Error("Failed to save analysis");
    }

    console.log("Report analysis complete:", { reportId, confidenceScore, floodRiskAssessment, isDuplicate });

    return new Response(
      JSON.stringify({
        success: true,
        confidence_score: confidenceScore,
        analysis: fullAnalysis,
        flood_risk_assessment: floodRiskAssessment,
        recommended_action: recommendedAction,
        is_duplicate: isDuplicate,
        duplicate_of: duplicateOfId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-report:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Haversine formula for distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
