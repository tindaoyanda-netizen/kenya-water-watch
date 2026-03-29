import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually for Node.js runtime
try {
  const envPath = resolve(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
} catch { /* .env not found, use existing env */ }

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const app = express();
const PORT = 3001;

app.use(cors({ origin: true }));
app.use(express.json());

const getAdminClient = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) throw new Error('Missing Supabase credentials');
  return createClient(SUPABASE_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
};

// Verify caller is authenticated government admin
const requireGovAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.replace('Bearer ', '');
  const anonClient = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user }, error } = await anonClient.auth.getUser();
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  // Check they are government admin
  const adminClient = getAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('county_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profile?.county_id !== 'kenya_national') {
    return res.status(403).json({ error: 'Government admin access required' });
  }

  req.user = user;
  next();
};

// POST /api/admin/verify-report
app.post('/api/admin/verify-report', requireGovAdmin, async (req, res) => {
  const { reportId, action, comment } = req.body;
  if (!reportId || !['verified', 'rejected'].includes(action)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    const adminClient = getAdminClient();

    const { error: updateErr } = await adminClient
      .from('environmental_reports')
      .update({ status: action })
      .eq('id', reportId);
    if (updateErr) throw updateErr;

    const { error: verErr } = await adminClient
      .from('report_verifications')
      .insert({ report_id: reportId, admin_id: req.user.id, action, comment: comment || null });
    if (verErr) throw verErr;

    res.json({ success: true });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/reply-report
app.post('/api/admin/reply-report', requireGovAdmin, async (req, res) => {
  const { reportId, message } = req.body;
  if (!reportId || !message?.trim()) {
    return res.status(400).json({ error: 'reportId and message are required' });
  }

  try {
    const adminClient = getAdminClient();
    const { error } = await adminClient
      .from('report_replies')
      .insert({ report_id: reportId, admin_id: req.user.id, message: message.trim() });
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Reply error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/check-gov-admin — check if government admin account exists (uses anon key, public read)
app.get('/api/admin/check-gov-admin', async (req, res) => {
  try {
    // Use anon key — this is a public read to prevent duplicate gov admin signup
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await client
      .from('profiles')
      .select('id')
      .eq('county_id', 'kenya_national')
      .limit(1);
    if (error) throw error;
    res.json({ exists: (data?.length ?? 0) > 0 });
  } catch (err) {
    console.error('Check error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Admin API server running on port ${PORT}`);
});
