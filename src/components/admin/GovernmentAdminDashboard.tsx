import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle2, XCircle, Clock, AlertTriangle, MapPin,
  Calendar, MessageSquare, ChevronRight, Loader2, Brain, Send,
  Reply, BarChart3, Globe, TrendingUp, Filter, Search, Waves,
  Activity, FileText, Users, ArrowLeft, RefreshCw, Star,
  Zap, Eye, EyeOff, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { kenyaCounties } from '@/data/aquaguardData';
import { format } from 'date-fns';

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

const reportTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
  flooded_road: { label: 'Flooded Road', icon: '🌊', color: 'text-blue-500' },
  dry_borehole: { label: 'Dry Borehole', icon: '🕳️', color: 'text-orange-500' },
  broken_kiosk: { label: 'Broken Kiosk', icon: '🚰', color: 'text-yellow-500' },
  overflowing_river: { label: 'Overflowing River', icon: '🏞️', color: 'text-cyan-500' },
};

const severityConfig: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
  high: { label: 'High', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
  medium: { label: 'Medium', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  low: { label: 'Low', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
};

const StatCard = ({ icon: Icon, label, value, color, trend }: { icon: any; label: string; value: number | string; color: string; trend?: string }) => (
  <motion.div
    whileHover={{ y: -2, scale: 1.01 }}
    transition={{ type: 'spring', stiffness: 300 }}
    className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden"
  >
    <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 ${color}`} />
    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${color} bg-current/10`}>
      <Icon className="w-5 h-5 text-current" style={{ color: 'inherit' }} />
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
    {trend && <p className="text-xs text-success mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{trend}</p>}
  </motion.div>
);

const GovernmentAdminDashboard = ({ onClose, adminName }: GovernmentAdminDashboardProps) => {
  const [reports, setReports] = useState<EnvironmentalReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<EnvironmentalReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [comment, setComment] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [countyFilter, setCountyFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replies, setReplies] = useState<ReportReply[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [activeTab, setActiveTab] = useState<'reports' | 'analytics'>('reports');
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel('gov-admin-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'environmental_reports' }, () => {
        fetchReports();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (selectedReport) fetchReplies(selectedReport.id);
    else setReplies([]);
  }, [selectedReport?.id]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('environmental_reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReports((data as EnvironmentalReport[]) || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({ title: 'Failed to load reports', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReplies = async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .from('report_replies')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setReplies((data as ReportReply[]) || []);
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const getAuthHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return `Bearer ${session?.access_token}`;
  };

  const handleVerification = async (action: 'verified' | 'rejected') => {
    if (!selectedReport) return;
    setIsProcessing(true);
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch('/api/admin/verify-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({ reportId: selectedReport.id, action, comment: comment || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast({
        title: action === 'verified' ? '✅ Report Verified' : '❌ Report Rejected',
        description: `Report has been ${action} successfully.`,
      });
      setSelectedReport(null);
      setComment('');
      fetchReports();
    } catch (error) {
      toast({ title: 'Action failed', description: error instanceof Error ? error.message : 'Please try again', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const sendReply = async () => {
    if (!selectedReport || !replyMessage.trim()) return;
    setIsSendingReply(true);
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch('/api/admin/reply-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({ reportId: selectedReport.id, message: replyMessage.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      setReplyMessage('');
      fetchReplies(selectedReport.id);
      toast({ title: '💬 Reply sent', description: 'Your response has been posted.' });
    } catch (error) {
      toast({ title: 'Failed to send reply', description: error instanceof Error ? error.message : 'Please try again', variant: 'destructive' });
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
      return (r.town_name?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q) || r.county_id.toLowerCase().includes(q));
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

  const countyStats = kenyaCounties.map(c => ({
    ...c,
    count: reports.filter(r => r.county_id === c.id).length,
    pending: reports.filter(r => r.county_id === c.id && r.status === 'pending').length,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  const typeStats = Object.entries(reportTypeLabels).map(([key, val]) => ({
    key,
    ...val,
    count: reports.filter(r => r.report_type === key).length,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background overflow-hidden flex flex-col"
    >
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, hsl(195 85% 35%), transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, hsl(38 90% 55%), transparent 70%)' }} />
      </div>

      {/* Header */}
      <div className="relative z-20 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo + Title */}
              <motion.div
                className="flex items-center gap-3"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center shadow-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <motion.div
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-success border-2 border-card"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-heading text-lg font-bold text-foreground">National Command Centre</h1>
                    <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0 text-xs px-2 py-0">
                      <Star className="w-2.5 h-2.5 mr-1" />GOV
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">AquaGuard Kenya — Government Admin · {adminName}</p>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center gap-3">
              {/* Tab switcher */}
              <div className="hidden md:flex items-center bg-muted rounded-xl p-1 gap-1">
                {[
                  { id: 'reports', icon: FileText, label: 'Reports' },
                  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <Button variant="outline" size="sm" onClick={fetchReports} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-1.5">Refresh</span>
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to Map
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-6">

          {/* Stats Grid */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6"
          >
            <StatCard icon={FileText} label="Total Reports" value={stats.total} color="bg-primary" />
            <StatCard icon={Clock} label="Pending" value={stats.pending} color="bg-warning" />
            <StatCard icon={CheckCircle2} label="Verified" value={stats.verified} color="bg-success" />
            <StatCard icon={XCircle} label="Rejected" value={stats.rejected} color="bg-destructive" />
            <StatCard icon={Zap} label="Escalated" value={stats.escalated} color="bg-orange-500" />
            <StatCard icon={Globe} label="Counties Active" value={stats.counties} color="bg-accent" />
          </motion.div>

          {activeTab === 'reports' && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col lg:flex-row gap-4"
            >
              {/* Left: Filters + List */}
              <div className="flex-1 min-w-0">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {/* Status filter pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(['pending', 'all', 'verified', 'rejected'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f
                          ? f === 'pending' ? 'bg-warning text-warning-foreground'
                            : f === 'verified' ? 'bg-success text-success-foreground'
                              : f === 'rejected' ? 'bg-destructive text-destructive-foreground'
                                : 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        {f}{f !== 'all' && ` (${stats[f as keyof typeof stats]})`}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search reports..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 w-48 text-sm"
                      />
                    </div>
                    {/* Filters toggle */}
                    <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setShowFilters(!showFilters)}>
                      <Filter className="w-3.5 h-3.5" />
                      Filters
                      <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Expanded filters */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mb-4"
                    >
                      <div className="grid grid-cols-2 gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">County</label>
                          <select
                            value={countyFilter}
                            onChange={e => setCountyFilter(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
                          >
                            <option value="all">All Counties</option>
                            {countyStats.map(c => (
                              <option key={c.id} value={c.id}>{c.name} ({c.count})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Report Type</label>
                          <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
                          >
                            <option value="all">All Types</option>
                            {Object.entries(reportTypeLabels).map(([k, v]) => (
                              <option key={k} value={k}>{v.icon} {v.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Reports count */}
                <p className="text-xs text-muted-foreground mb-3">
                  Showing <span className="font-semibold text-foreground">{filteredReports.length}</span> of {reports.length} reports
                </p>

                {/* Reports list */}
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Loading national reports...</p>
                      </div>
                    </div>
                  ) : filteredReports.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-muted-foreground opacity-50" />
                      </div>
                      <p className="text-muted-foreground font-medium">No reports found</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting your filters</p>
                    </div>
                  ) : (
                    filteredReports.map((report, idx) => {
                      const countyName = kenyaCounties.find(c => c.id === report.county_id)?.name || report.county_id;
                      const typeInfo = reportTypeLabels[report.report_type];
                      const sevConfig = report.severity_level ? severityConfig[report.severity_level] : null;
                      const isSelected = selectedReport?.id === report.id;

                      return (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => setSelectedReport(isSelected ? null : report)}
                          className={`bg-card rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md group ${isSelected ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-border hover:border-primary/40'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${isSelected ? 'bg-primary/10' : 'bg-muted'} transition-colors group-hover:bg-primary/10`}>
                                {typeInfo?.icon}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-sm text-foreground">{typeInfo?.label}</h3>
                                  {report.escalated && (
                                    <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-xs px-1.5 py-0">
                                      <Zap className="w-2.5 h-2.5 mr-0.5" />Escalated
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{report.town_name || 'Unknown area'}, <span className="font-medium text-foreground/70">{countyName} County</span></span>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <Badge
                                    variant={report.status === 'verified' ? 'default' : report.status === 'rejected' ? 'destructive' : 'secondary'}
                                    className="text-xs px-2 py-0"
                                  >
                                    {report.status}
                                  </Badge>
                                  {sevConfig && (
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${sevConfig.bg} ${sevConfig.color}`}>
                                      {sevConfig.label}
                                    </span>
                                  )}
                                  {report.ai_confidence_score !== null && (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0 gap-1">
                                      <Brain className="w-2.5 h-2.5" />{report.ai_confidence_score}%
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(report.created_at), 'MMM d, HH:mm')}
                              </span>
                              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-90 text-primary' : ''}`} />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right: Detail Panel */}
              <div className="lg:w-[420px] flex-shrink-0">
                <div className="lg:sticky lg:top-4">
                  <AnimatePresence mode="wait">
                    {selectedReport ? (
                      <motion.div
                        key={selectedReport.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-card rounded-2xl border border-border overflow-hidden max-h-[calc(100vh-220px)] overflow-y-auto"
                      >
                        {/* Image */}
                        {selectedReport.image_url && (
                          <div className="aspect-video bg-muted relative overflow-hidden">
                            <img src={selectedReport.image_url} alt="Report evidence" className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-black/60 text-white border-0 backdrop-blur-sm">Evidence Photo</Badge>
                            </div>
                          </div>
                        )}

                        <div className="p-5 space-y-5">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                                <span>{reportTypeLabels[selectedReport.report_type]?.icon}</span>
                                {reportTypeLabels[selectedReport.report_type]?.label}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant={selectedReport.status === 'verified' ? 'default' : selectedReport.status === 'rejected' ? 'destructive' : 'secondary'}>
                                  {selectedReport.status}
                                </Badge>
                                {selectedReport.escalated && (
                                  <Badge className="bg-orange-500 text-white border-0">
                                    <Zap className="w-3 h-3 mr-1" />Escalated
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>

                          {/* County highlight */}
                          <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/10 rounded-xl">
                            <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">County</p>
                              <p className="font-semibold text-sm">{kenyaCounties.find(c => c.id === selectedReport.county_id)?.name || selectedReport.county_id} County</p>
                            </div>
                          </div>

                          {/* Location */}
                          <div className="space-y-2 text-sm">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location Details</p>
                            <div className="grid grid-cols-1 gap-1.5">
                              {selectedReport.town_name && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                                  <span>{selectedReport.town_name}</span>
                                </div>
                              )}
                              {selectedReport.sub_location && (
                                <div className="flex items-center gap-2 text-muted-foreground pl-5">
                                  <span>Ward: <span className="text-foreground font-medium">{selectedReport.sub_location}</span></span>
                                </div>
                              )}
                              {selectedReport.landmark && (
                                <div className="flex items-center gap-2 text-muted-foreground pl-5">
                                  <span>Landmark: <span className="text-foreground font-medium">{selectedReport.landmark}</span></span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                                <span>{format(new Date(selectedReport.created_at), 'PPp')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          {selectedReport.description && (
                            <div className="p-3 bg-muted/50 rounded-xl">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description</p>
                              <p className="text-sm text-foreground leading-relaxed">{selectedReport.description}</p>
                            </div>
                          )}

                          {/* AI Analysis */}
                          {selectedReport.ai_analysis && (
                            <div className="p-3 bg-accent/8 border border-accent/20 rounded-xl">
                              <div className="flex items-center gap-2 mb-2">
                                <Brain className="w-4 h-4 text-accent" />
                                <span className="text-sm font-semibold">AI Analysis</span>
                                {selectedReport.ai_confidence_score !== null && (
                                  <Badge variant={selectedReport.ai_confidence_score >= 70 ? 'default' : selectedReport.ai_confidence_score >= 40 ? 'secondary' : 'destructive'}>
                                    {selectedReport.ai_confidence_score}%
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{selectedReport.ai_analysis}</p>
                              <p className="text-xs text-muted-foreground/60 mt-2 italic">⚠️ Advisory only — final decision rests with you.</p>
                            </div>
                          )}

                          {/* Admin Actions */}
                          {selectedReport.status === 'pending' && (
                            <div className="space-y-3 border-t border-border pt-4">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Take Action</p>
                              <Textarea
                                placeholder="Optional comment or note about your decision..."
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                className="min-h-[72px] text-sm resize-none"
                              />
                              <div className="flex gap-2">
                                <Button
                                  className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                                  onClick={() => handleVerification('verified')}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                  Verify
                                </Button>
                                <Button
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() => handleVerification('rejected')}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                                  Reject
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Reply Thread */}
                          <div className="border-t border-border pt-4 space-y-3">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                              <Reply className="w-4 h-4 text-primary" />
                              Replies ({replies.length})
                            </h4>

                            {replies.length > 0 && (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {replies.map(reply => (
                                  <div key={reply.id} className="p-3 bg-primary/5 border border-primary/10 rounded-xl">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                        <Shield className="w-3 h-3 text-white" />
                                      </div>
                                      <span className="text-xs font-medium text-primary">Government Admin</span>
                                      <span className="text-xs text-muted-foreground ml-auto">{format(new Date(reply.created_at), 'MMM d, HH:mm')}</span>
                                    </div>
                                    <p className="text-sm pl-7">{reply.message}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Textarea
                                placeholder="Send a message to the resident..."
                                value={replyMessage}
                                onChange={e => setReplyMessage(e.target.value)}
                                className="min-h-[60px] text-sm resize-none flex-1"
                              />
                              <Button
                                className="h-full px-3 flex-shrink-0"
                                onClick={sendReply}
                                disabled={isSendingReply || !replyMessage.trim()}
                              >
                                {isSendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-card/50 border border-dashed border-border rounded-2xl p-10 text-center"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <Eye className="w-8 h-8 text-primary opacity-60" />
                        </div>
                        <p className="text-muted-foreground font-medium">Select a report</p>
                        <p className="text-sm text-muted-foreground/60 mt-1">Click any report on the left to view details and take action</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* County breakdown */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Reports by County
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {countyStats.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                  ) : (
                    countyStats.map((county, i) => (
                      <div key={county.id} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sm font-medium">{county.name}</span>
                            <div className="flex items-center gap-2">
                              {county.pending > 0 && <span className="text-xs text-warning font-medium">{county.pending} pending</span>}
                              <span className="text-sm font-bold">{county.count}</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(county.count / (countyStats[0]?.count || 1)) * 100}%` }}
                              transition={{ delay: i * 0.05 + 0.3, duration: 0.6 }}
                              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Report type breakdown */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Reports by Type
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {typeStats.map(type => (
                    <div key={type.key} className="bg-muted/50 rounded-xl p-4 border border-border">
                      <span className="text-3xl">{type.icon}</span>
                      <p className="text-2xl font-bold mt-2">{type.count}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{type.label}</p>
                      <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${reports.length ? (type.count / reports.length) * 100 : 0}%` }}
                          transition={{ delay: 0.3, duration: 0.6 }}
                          className="h-full rounded-full bg-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status breakdown */}
              <div className="bg-card border border-border rounded-2xl p-5 lg:col-span-2">
                <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  National Status Overview
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Pending Review', value: stats.pending, color: 'bg-warning', text: 'text-warning', pct: reports.length ? (stats.pending / reports.length * 100).toFixed(1) : 0 },
                    { label: 'Verified', value: stats.verified, color: 'bg-success', text: 'text-success', pct: reports.length ? (stats.verified / reports.length * 100).toFixed(1) : 0 },
                    { label: 'Rejected', value: stats.rejected, color: 'bg-destructive', text: 'text-destructive', pct: reports.length ? (stats.rejected / reports.length * 100).toFixed(1) : 0 },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className={`text-4xl font-bold ${s.text}`}>{s.pct}%</div>
                      <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
                      <p className="text-xs text-muted-foreground/60">{s.value} reports</p>
                      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${s.pct}%` }}
                          transition={{ delay: 0.4, duration: 0.8 }}
                          className={`h-full rounded-full ${s.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default GovernmentAdminDashboard;
