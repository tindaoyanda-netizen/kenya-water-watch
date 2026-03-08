import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller is authenticated
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { reportId, action, adminMessage } = await req.json();

    if (!reportId) {
      return new Response(JSON.stringify({ error: 'reportId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the report details
    const { data: report, error: reportError } = await adminClient
      .from('environmental_reports')
      .select('reporter_id, report_type, town_name, county_id, status')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return new Response(JSON.stringify({ error: 'Report not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the reporter's email from auth.users
    const { data: { user: reporter }, error: userError } = await adminClient.auth.admin.getUserById(report.reporter_id);

    if (userError || !reporter?.email) {
      return new Response(JSON.stringify({ error: 'Reporter email not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const reportTypeLabels: Record<string, string> = {
      flooded_road: 'Flooded Road',
      dry_borehole: 'Dry Borehole',
      broken_kiosk: 'Broken Water Kiosk',
      overflowing_river: 'Overflowing River',
    };

    const reportTypeLabel = reportTypeLabels[report.report_type] || report.report_type;
    const location = report.town_name || 'your area';
    const statusEmoji = action === 'verified' ? '✅' : action === 'rejected' ? '❌' : '💬';
    const statusText = action === 'verified' ? 'Verified' : action === 'rejected' ? 'Rejected' : 'Reply from Admin';

    const subject = `${statusEmoji} AquaGuard: Your ${reportTypeLabel} report — ${statusText}`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0891b2, #06b6d4); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🌊 AquaGuard Kenya</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Community Water Monitoring</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
          <h2 style="color: #1e293b; margin: 0 0 16px 0;">${statusEmoji} ${statusText}</h2>
          
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">REPORT DETAILS</p>
            <p style="margin: 0 0 4px 0; color: #1e293b;"><strong>Type:</strong> ${reportTypeLabel}</p>
            <p style="margin: 0 0 4px 0; color: #1e293b;"><strong>Location:</strong> ${location}, ${report.county_id} County</p>
            <p style="margin: 0; color: #1e293b;"><strong>Status:</strong> ${report.status || action}</p>
          </div>

          ${adminMessage ? `
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 13px; font-weight: 600;">💬 MESSAGE FROM COUNTY ADMIN</p>
            <p style="margin: 0; color: #1e293b; line-height: 1.5;">${adminMessage}</p>
          </div>
          ` : ''}

          <p style="color: #64748b; font-size: 13px; margin: 16px 0 0 0;">
            Log in to AquaGuard to view full details and track your report's progress.
          </p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">
          AquaGuard Kenya — Protecting our water resources together
        </p>
      </div>
    `;

    // Send email using Lovable API
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (lovableApiKey) {
      const emailResponse = await fetch('https://api.lovable.dev/api/v1/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          to: reporter.email,
          subject,
          html: htmlBody,
          purpose: 'transactional',
        }),
      });

      if (!emailResponse.ok) {
        console.error('Email send failed:', await emailResponse.text());
        // Don't fail the whole request if email fails
      } else {
        console.log(`Email notification sent to ${reporter.email}`);
      }
    } else {
      console.warn('LOVABLE_API_KEY not set, skipping email notification');
    }

    return new Response(JSON.stringify({ success: true, emailSent: !!lovableApiKey }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Notification error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
