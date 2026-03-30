import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle2, XCircle, Clock, AlertTriangle, MapPin,
  Calendar, MessageSquare, ChevronRight, Loader2, Brain, Send,
  BarChart3, Globe, TrendingUp, Filter, Search, Waves,
  Activity, FileText, ArrowLeft, RefreshCw, Star,
  Zap, Eye, Bell, BellRing, ChevronDown, User, Reply,
  CircleCheck, CircleX, MessageCircle, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { kenyaCounties } from '@/data/aquaguardData';
import { format, formatDistanceToNow } from 'date-fns';

interface EnvironmentalReport {
  id: string;
  reporter_id: string;
  report_type: 'flooded_road' | 'dry_borehole' | 'broken_kiosk' | 'overflowing_river';
  county_id: string;
  town_name: string | null;
  sub_location: string | null;
  road_name: string | null;
  landmark: string | null;
  latitude: number;
  longitude: number;
  description: string | null;
  image_url: string | null;
  status: 'pending' | 'verified' | 'rejected';
  ai_confidence_score: number | null;
  ai_analysis: string | null;
  is_duplicate: boolean | null;
  severity_level: string | null;
  escalated: boolean | null;
  created_at: string;
}

interface ReportReply {
  id: string;
  report_id: string;
  admin_id: string;
  message: string;
  created_at: string;
}

interface GovernmentAdminDashboardProps {
  onClose: () => void;
  adminName: string;
}

const typeConfig: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  flooded_road: { label: 'Flooded Road', icon: '🌊', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  dry_borehole: { label: 'Dry Borehole', icon: '🕳️', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  broken_kiosk: { label: 'Broken Kiosk', icon: '🚰', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  overflowing_river: { label: 'Overflowing River', icon: '🏞️', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
};

const severityConfig: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
  high: { label: 'High', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
  medium: { label: 'Medium', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  low: { label: 'Low', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
};

const notifyResident = async (reportId: string, action: string, adminMessage?: string) => {
  try {
    await supabase.functions.invoke('notify-resident', {
      body: { reportId, action, adminMessage },
    });
  } catch {
    // Non-blocking
  }
};

const GovernmentAdminDashboard = ({ onClose, adminName }: GovernmentAdminDashboardProps) => {
  const [reports, setReports] = useState<EnvironmentalReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<EnvironmentalReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [replies, setReplies] = useState<ReportReply[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [comment, setComment] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [countyFilter, setCountyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'reports' | 'analytics'>('reports');
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
    const channel = supabase
      .channel('gov-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'environmental_reports' }, fetchReports)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (selectedReport) fetchReplies(selectedReport.id);
    else setReplies([]);
  }, [selectedReport?.id]);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('environmental_reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReports((data as EnvironmentalReport[]) || []);
    } catch {
      toast({ title: 'Failed to load reports', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchReplies = async (reportId: string) => {
    const { data } = await supabase
      .from('report_replies')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });
    setReplies((data as ReportReply[]) || []);
  };

  // Inline quick-action — approve or reject from the card list
  const handleQuickAction = async (report: EnvironmentalReport, action: 'verified' | 'rejected', e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingId(report.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('environmental_reports')
        .update({ status: action })
        .eq('id', report.id);
      if (error) throw error;

      // Try to log verification record (non-blocking)
      await supabase.from('report_verifications').insert({
        report_id: report.id, admin_id: user.id, action,
      }).then(({ error }) => { if (error) console.warn('Verification log skipped:', error.message); });

      // Notify resident via real-time + email edge function
      notifyResident(report.id, action);

      toast({
        title: action === 'verified' ? '✅ Report Approved' : '❌ Report Rejected',
        description: 'The resident will be notified in real-time.',
      });

      if (selectedReport?.id === report.id) setSelectedReport(prev => prev ? { ...prev, status: action } : null);
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: action } : r));
    } catch (err) {
      toast({
        title: 'Action failed',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Full action from detail panel with optional comment
  const handleDetailAction = async (action: 'verified' | 'rejected') => {
    if (!selectedReport) return;
    setProcessingId(selectedReport.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('environmental_reports')
        .update({ status: action })
        .eq('id', selectedReport.id);
      if (error) throw error;

      await supabase.from('report_verifications').insert({
        report_id: selectedReport.id, admin_id: user.id, action, comment: comment || null,
      }).then(({ error }) => { if (error) console.warn('Verification log skipped:', error.message); });

      // If comment provided, also send it as a reply so resident sees it
      if (comment.trim()) {
        await supabase.from('report_replies').insert({
          report_id: selectedReport.id, admin_id: user.id,
          message: `[${action === 'verified' ? 'APPROVED' : 'REJECTED'}] ${comment.trim()}`,
        });
      }

      notifyResident(selectedReport.id, action, comment || undefined);

      toast({
        title: action === 'verified' ? '✅ Report Approved' : '❌ Report Rejected',
        description: comment ? 'Your comment was sent to the resident.' : 'The resident has been notified.',
      });

      setSelectedReport(prev => prev ? { ...prev, status: action } : null);
      setReports(prev => prev.map(r => r.id === selectedReport.id ? { ...r, status: action } : r));
      setComment('');
      if (comment.trim()) fetchReplies(selectedReport.id);
    } catch (err) {
      toast({
        title: 'Action failed',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const sendReply = async () => {
    if (!selectedReport || !replyMessage.trim()) return;
    setIsSendingReply(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('report_replies')
        .insert({ report_id: selectedReport.id, admin_id: user.id, message: replyMessage.trim() });
      if (error) throw error;

      notifyResident(selectedReport.id, 'reply', replyMessage.trim());
      setReplyMessage('');
      fetchReplies(selectedReport.id);
      toast({
        title: '📨 Notification sent',
        description: 'The resident will receive your message as a real-time notification.',
      });
    } catch (err) {
      toast({
        title: 'Failed to send',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  const filteredReports = reports.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (countyFilter !== 'all' && r.county_id !== countyFilter) return false;
    if (typeFilter !== 'all' && r.report_type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.town_name?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q) || r.county_id.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    verified: reports.filter(r => r.status === 'verified').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
    escalated: reports.filter(r => r.escalated).length,
    counties: new Set(reports.map(r => r.county_id)).size,
  };

  const countyStats = kenyaCounties
    .map(c => ({ ...c, count: reports.filter(r => r.county_id === c.id).length, pending: reports.filter(r => r.county_id === c.id && r.status === 'pending').length }))
    .filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden"
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] opacity-[0.03]" style={{ background: 'radial-gradient(ellipse at top right, hsl(195 85% 35%), transparent 60%)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-[0.03]" style={{ background: 'radial-gradient(ellipse at bottom left, hsl(38 90% 55%), transparent 60%)' }} />
      </div>

      {/* Header */}
      <div className="relative z-20 border-b border-border bg-card/90 backdrop-blur-md flex-shrink-0">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-card" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-base font-bold text-foreground">National Command Centre</h1>
                <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0 text-xs h-5 px-1.5">
                  <Star className="w-2.5 h-2.5 mr-0.5" />GOV
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Signed in as <span className="font-medium text-foreground">{adminName}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Stats pills */}
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-warning/10 border border-warning/20 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-warning" />
                <span className="text-xs font-semibold text-warning">{stats.pending} pending</span>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex items-center bg-muted rounded-xl p-0.5">
              {[{ id: 'reports', icon: FileText, label: 'Reports' }, { id: 'analytics', icon: BarChart3, label: 'Analytics' }].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  <tab.icon className="w-3.5 h-3.5" />{tab.label}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={fetchReports} disabled={isLoading}>
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={onClose}>
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Map</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="max-w-screen-2xl mx-auto w-full px-4 lg:px-6 py-4 flex flex-col flex-1 overflow-hidden gap-4">

          {/* Stats Row */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 flex-shrink-0">
            {[
              { label: 'Total', value: stats.total, icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
              { label: 'Approved', value: stats.verified, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
              { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
              { label: 'Escalated', value: stats.escalated, icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
              { label: 'Counties', value: stats.counties, icon: Globe, color: 'text-accent', bg: 'bg-accent/10' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-3 flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-tight">{s.value}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Main Content */}
          {activeTab === 'reports' ? (
            <div className="flex gap-4 flex-1 overflow-hidden min-h-0">

              {/* Left — Report List */}
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2 mb-3 flex-shrink-0">
                  {/* Status filter */}
                  <div className="flex items-center gap-1">
                    {([
                      { key: 'pending', label: 'Pending', count: stats.pending, active: 'bg-warning text-warning-foreground', inactive: 'bg-muted text-muted-foreground' },
                      { key: 'all', label: 'All', count: stats.total, active: 'bg-primary text-primary-foreground', inactive: 'bg-muted text-muted-foreground' },
                      { key: 'verified', label: 'Approved', count: stats.verified, active: 'bg-success text-success-foreground', inactive: 'bg-muted text-muted-foreground' },
                      { key: 'rejected', label: 'Rejected', count: stats.rejected, active: 'bg-destructive text-destructive-foreground', inactive: 'bg-muted text-muted-foreground' },
                    ] as const).map(f => (
                      <button key={f.key} onClick={() => setFilter(f.key)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${filter === f.key ? f.active : f.inactive + ' hover:text-foreground'}`}>
                        {f.label} ({f.count})
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 h-8 w-40 text-xs" />
                    </div>
                    <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => setShowFilters(!showFilters)}>
                      <Filter className="w-3.5 h-3.5" />
                      <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Expanded filters */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden mb-3">
                      <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-xl border border-border">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">County</label>
                          <select value={countyFilter} onChange={e => setCountyFilter(e.target.value)} className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs">
                            <option value="all">All Counties</option>
                            {countyStats.map(c => <option key={c.id} value={c.id}>{c.name} ({c.count})</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs">
                            <option value="all">All Types</option>
                            {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="text-xs text-muted-foreground mb-2 flex-shrink-0">
                  {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
                  {filter === 'pending' && stats.pending > 0 && <span className="text-warning font-medium ml-1">— awaiting your decision</span>}
                </p>

                {/* Report list — scrollable */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="text-center">
                        <Loader2 className="w-7 h-7 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Loading reports...</p>
                      </div>
                    </div>
                  ) : filteredReports.length === 0 ? (
                    <div className="text-center py-14">
                      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                        <AlertTriangle className="w-7 h-7 text-muted-foreground opacity-40" />
                      </div>
                      <p className="text-muted-foreground text-sm">No reports found</p>
                    </div>
                  ) : (
                    filteredReports.map((report, idx) => {
                      const county = kenyaCounties.find(c => c.id === report.county_id)?.name || report.county_id;
                      const type = typeConfig[report.report_type];
                      const sev = report.severity_level ? severityConfig[report.severity_level] : null;
                      const isSelected = selectedReport?.id === report.id;
                      const isProcessing = processingId === report.id;
                      const isPending = report.status === 'pending';

                      return (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.025 }}
                          onClick={() => setSelectedReport(isSelected ? null : report)}
                          className={`bg-card rounded-xl border cursor-pointer transition-all group ${isSelected ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-border hover:border-primary/40 hover:shadow-sm'}`}
                        >
                          <div className="p-3">
                            <div className="flex items-start gap-2.5">
                              {/* Type icon */}
                              <div className={`w-9 h-9 rounded-xl ${type?.bg || 'bg-muted'} flex items-center justify-center text-lg flex-shrink-0 mt-0.5`}>
                                {type?.icon}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-semibold text-sm text-foreground truncate">{type?.label}</span>
                                      {report.escalated && <Zap className="w-3 h-3 text-orange-500 flex-shrink-0" />}
                                      {report.ai_confidence_score !== null && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-0.5 flex-shrink-0">
                                          <Brain className="w-2.5 h-2.5" />{report.ai_confidence_score}%
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                      <MapPin className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">{report.town_name || 'Unknown'}, <b className="text-foreground/70">{county}</b></span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                                    </span>

                                    {/* Status badge */}
                                    <Badge
                                      variant={report.status === 'verified' ? 'default' : report.status === 'rejected' ? 'destructive' : 'secondary'}
                                      className="text-xs px-1.5 py-0 h-5"
                                    >
                                      {report.status === 'verified' ? '✅ Approved' : report.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Inline quick-action buttons for pending reports */}
                                {isPending && (
                                  <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-border">
                                    <span className="text-xs text-muted-foreground">Quick action:</span>
                                    <button
                                      onClick={(e) => handleQuickAction(report, 'verified', e)}
                                      disabled={isProcessing}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-success/10 hover:bg-success/20 text-success border border-success/20 text-xs font-semibold transition-all disabled:opacity-50"
                                    >
                                      {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CircleCheck className="w-3.5 h-3.5" />}
                                      Approve
                                    </button>
                                    <button
                                      onClick={(e) => handleQuickAction(report, 'rejected', e)}
                                      disabled={isProcessing}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 text-xs font-semibold transition-all disabled:opacity-50"
                                    >
                                      {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CircleX className="w-3.5 h-3.5" />}
                                      Reject
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold transition-all ml-auto"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                      Reply
                                    </button>
                                  </div>
                                )}

                                {/* Already decided — show view details link */}
                                {!isPending && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
                                    className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                                  >
                                    <MessageCircle className="w-3 h-3" />View replies & details
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right — Detail Panel */}
              <div className="w-[400px] flex-shrink-0 hidden lg:flex flex-col overflow-hidden">
                <AnimatePresence mode="wait">
                  {selectedReport ? (
                    <motion.div key={selectedReport.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }}
                      className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden">

                      {/* Evidence image */}
                      {selectedReport.image_url && (
                        <div className="aspect-video bg-muted relative overflow-hidden flex-shrink-0">
                          <img src={selectedReport.image_url} alt="Evidence" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute bottom-2 left-3">
                            <Badge className="bg-black/70 text-white border-0 text-xs backdrop-blur-sm">Evidence Photo</Badge>
                          </div>
                          <button onClick={() => setSelectedReport(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {!selectedReport.image_url && (
                        <div className="flex items-center justify-between px-4 pt-4 pb-0 flex-shrink-0">
                          <span className="text-sm font-semibold">Report Details</span>
                          <button onClick={() => setSelectedReport(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}

                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Type + Status */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-heading text-base font-bold flex items-center gap-2">
                              <span>{typeConfig[selectedReport.report_type]?.icon}</span>
                              {typeConfig[selectedReport.report_type]?.label}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={selectedReport.status === 'verified' ? 'default' : selectedReport.status === 'rejected' ? 'destructive' : 'secondary'}>
                                {selectedReport.status === 'verified' ? '✅ Approved' : selectedReport.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                              </Badge>
                              {selectedReport.escalated && <Badge className="bg-orange-500 text-white border-0"><Zap className="w-3 h-3 mr-1" />Escalated</Badge>}
                            </div>
                          </div>
                        </div>

                        {/* County */}
                        <div className="flex items-center gap-3 p-2.5 bg-primary/5 border border-primary/10 rounded-xl">
                          <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">County</p>
                            <p className="text-sm font-semibold">{kenyaCounties.find(c => c.id === selectedReport.county_id)?.name || selectedReport.county_id} County</p>
                          </div>
                          <div className="ml-auto text-right">
                            <p className="text-xs text-muted-foreground">Submitted</p>
                            <p className="text-xs font-medium">{format(new Date(selectedReport.created_at), 'MMM d, HH:mm')}</p>
                          </div>
                        </div>

                        {/* Location details */}
                        <div className="space-y-1 text-sm">
                          {[
                            { icon: MapPin, label: selectedReport.town_name },
                            { icon: MapPin, label: selectedReport.sub_location ? `Ward: ${selectedReport.sub_location}` : null },
                            { icon: MapPin, label: selectedReport.landmark ? `Near: ${selectedReport.landmark}` : null },
                          ].filter(i => i.label).map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-muted-foreground">
                              <item.icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>

                        {/* Description */}
                        {selectedReport.description && (
                          <div className="p-3 bg-muted/50 rounded-xl">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                            <p className="text-sm leading-relaxed">{selectedReport.description}</p>
                          </div>
                        )}

                        {/* AI Analysis */}
                        {selectedReport.ai_analysis && (
                          <div className="p-3 bg-accent/8 border border-accent/15 rounded-xl">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Brain className="w-4 h-4 text-accent" />
                              <span className="text-sm font-semibold">AI Analysis</span>
                              {selectedReport.ai_confidence_score !== null && (
                                <Badge variant={selectedReport.ai_confidence_score >= 70 ? 'default' : 'secondary'} className="ml-auto">
                                  {selectedReport.ai_confidence_score}% confidence
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{selectedReport.ai_analysis}</p>
                          </div>
                        )}

                        {/* ── APPROVE / REJECT with comment ── */}
                        {selectedReport.status === 'pending' && (
                          <div className="space-y-3 border-t border-border pt-4">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-warning/20 flex items-center justify-center">
                                <Clock className="w-3 h-3 text-warning" />
                              </div>
                              <p className="text-sm font-semibold">Your Decision</p>
                            </div>
                            <Textarea
                              placeholder="Optional: add a comment or reason — it will be sent to the resident..."
                              value={comment}
                              onChange={e => setComment(e.target.value)}
                              className="min-h-[70px] text-sm resize-none"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                className="bg-success hover:bg-success/90 text-white gap-2"
                                onClick={() => handleDetailAction('verified')}
                                disabled={processingId === selectedReport.id}
                              >
                                {processingId === selectedReport.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CircleCheck className="w-4 h-4" />}
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                className="gap-2"
                                onClick={() => handleDetailAction('rejected')}
                                disabled={processingId === selectedReport.id}
                              >
                                {processingId === selectedReport.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CircleX className="w-4 h-4" />}
                                Reject
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <BellRing className="w-3 h-3 text-primary" />
                              The resident gets a real-time notification instantly.
                            </p>
                          </div>
                        )}

                        {/* ── REPLY / NOTIFY RESIDENT ── */}
                        <div className="border-t border-border pt-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <BellRing className="w-3 h-3 text-primary" />
                            </div>
                            <p className="text-sm font-semibold">Send Notification to Resident</p>
                          </div>

                          {/* Previous replies */}
                          {replies.length > 0 && (
                            <div className="space-y-2 max-h-44 overflow-y-auto">
                              {replies.map(reply => (
                                <div key={reply.id} className="flex gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Shield className="w-3.5 h-3.5 text-white" />
                                  </div>
                                  <div className="flex-1 bg-primary/5 border border-primary/10 rounded-xl px-3 py-2">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-xs font-semibold text-primary">Government Admin</span>
                                      <span className="text-xs text-muted-foreground ml-auto">{format(new Date(reply.created_at), 'MMM d, HH:mm')}</span>
                                    </div>
                                    <p className="text-sm">{reply.message}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Compose reply */}
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Write a message — the resident will receive it as a notification in the app..."
                              value={replyMessage}
                              onChange={e => setReplyMessage(e.target.value)}
                              className="min-h-[80px] text-sm resize-none"
                            />
                            <Button
                              className="w-full gap-2 bg-gradient-to-r from-primary to-accent text-white hover:opacity-90"
                              onClick={sendReply}
                              disabled={isSendingReply || !replyMessage.trim()}
                            >
                              {isSendingReply
                                ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                                : <><BellRing className="w-4 h-4" />Send Notification to Resident</>
                              }
                            </Button>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Bell className="w-3 h-3" />
                              Delivered instantly via in-app notification + email.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex-1 flex items-center justify-center bg-card/50 border border-dashed border-border rounded-2xl p-8 text-center">
                      <div>
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <Eye className="w-7 h-7 text-primary opacity-50" />
                        </div>
                        <p className="font-medium text-muted-foreground text-sm">Select a report</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Click any report to view details, or use the quick Approve/Reject/Reply buttons directly on the card.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            /* Analytics Tab */
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* County breakdown */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-heading font-semibold mb-4 flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-primary" />Reports by County
                  </h3>
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {countyStats.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                    ) : countyStats.map((county, i) => (
                      <div key={county.id} className="flex items-center gap-2.5">
                        <span className="text-xs text-muted-foreground w-5 text-right font-bold">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sm font-medium">{county.name}</span>
                            <div className="flex items-center gap-2">
                              {county.pending > 0 && <span className="text-xs text-warning font-semibold">{county.pending} pending</span>}
                              <span className="text-sm font-bold">{county.count}</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${(county.count / (countyStats[0]?.count || 1)) * 100}%` }}
                              transition={{ delay: i * 0.05 + 0.2, duration: 0.5 }}
                              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Report types */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-heading font-semibold mb-4 flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4 text-primary" />Reports by Type
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(typeConfig).map(([key, type]) => {
                      const count = reports.filter(r => r.report_type === key).length;
                      return (
                        <div key={key} className={`rounded-xl p-4 border border-border ${type.bg}`}>
                          <span className="text-2xl">{type.icon}</span>
                          <p className="text-xl font-bold mt-1.5">{count}</p>
                          <p className="text-xs text-muted-foreground">{type.label}</p>
                          <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${reports.length ? (count / reports.length) * 100 : 0}%` }}
                              transition={{ delay: 0.3, duration: 0.5 }}
                              className="h-full rounded-full bg-current opacity-60"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status overview */}
                <div className="bg-card border border-border rounded-2xl p-5 lg:col-span-2">
                  <h3 className="font-heading font-semibold mb-4 flex items-center gap-2 text-sm">
                    <BarChart3 className="w-4 h-4 text-primary" />National Status Summary
                  </h3>
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { label: 'Pending Review', value: stats.pending, color: 'bg-warning', text: 'text-warning' },
                      { label: 'Approved', value: stats.verified, color: 'bg-success', text: 'text-success' },
                      { label: 'Rejected', value: stats.rejected, color: 'bg-destructive', text: 'text-destructive' },
                    ].map(s => {
                      const pct = reports.length ? ((s.value / reports.length) * 100).toFixed(1) : '0';
                      return (
                        <div key={s.label} className="text-center">
                          <div className={`text-3xl font-bold ${s.text}`}>{pct}%</div>
                          <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                          <p className="text-xs text-muted-foreground/60">{s.value} of {reports.length}</p>
                          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3, duration: 0.6 }} className={`h-full rounded-full ${s.color}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default GovernmentAdminDashboard;
