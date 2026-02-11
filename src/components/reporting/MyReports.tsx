import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  X,
  MapPin,
  Calendar,
  Brain,
  Shield,
  Reply,
  ChevronRight,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { kenyaCounties } from '@/data/aquaguardData';
import { format } from 'date-fns';

interface EnvironmentalReport {
  id: string;
  reporter_id: string;
  report_type: 'flooded_road' | 'dry_borehole' | 'broken_kiosk' | 'overflowing_river';
  county_id: string;
  town_name: string | null;
  latitude: number;
  longitude: number;
  description: string | null;
  image_url: string | null;
  status: 'pending' | 'verified' | 'rejected';
  ai_confidence_score: number | null;
  ai_analysis: string | null;
  created_at: string;
}

interface ReportReply {
  id: string;
  report_id: string;
  admin_id: string;
  message: string;
  created_at: string;
}

interface MyReportsProps {
  isOpen: boolean;
  onClose: () => void;
}

const reportTypeLabels: Record<string, { label: string; icon: string }> = {
  flooded_road: { label: 'Flooded Road', icon: '🌊' },
  dry_borehole: { label: 'Dry Borehole', icon: '🕳️' },
  broken_kiosk: { label: 'Broken Kiosk', icon: '🚰' },
  overflowing_river: { label: 'Overflowing River', icon: '🏞️' },
};

const MyReports = ({ isOpen, onClose }: MyReportsProps) => {
  const [reports, setReports] = useState<EnvironmentalReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<EnvironmentalReport | null>(null);
  const [replies, setReplies] = useState<ReportReply[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchMyReports();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedReport) {
      fetchReplies(selectedReport.id);

      const channel = supabase
        .channel(`replies-${selectedReport.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'report_replies',
            filter: `report_id=eq.${selectedReport.id}`,
          },
          () => fetchReplies(selectedReport.id)
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setReplies([]);
    }
  }, [selectedReport?.id]);

  const fetchMyReports = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('environmental_reports')
        .select('*')
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports((data as EnvironmentalReport[]) || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
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

  const getCountyName = (countyId: string) =>
    kenyaCounties.find(c => c.id === countyId)?.name || 'Unknown';

  const statusConfig = {
    pending: { icon: Clock, color: 'text-warning', label: 'Pending Review' },
    verified: { icon: CheckCircle2, color: 'text-success', label: 'Verified' },
    rejected: { icon: XCircle, color: 'text-destructive', label: 'Rejected' },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
        >
          {/* Header */}
          <div className="sticky top-0 bg-card border-b border-border p-4 z-20">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-heading text-xl font-bold text-foreground">
                    My Reports
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {reports.length} report{reports.length !== 1 ? 's' : ''} submitted
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="max-w-5xl mx-auto p-4 lg:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No reports yet</p>
                <p className="text-sm mt-1">Submit your first environmental report from the dashboard.</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-4">
                {/* Reports List */}
                <div className="space-y-3">
                  {reports.map((report) => {
                    const StatusIcon = statusConfig[report.status].icon;
                    return (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-card rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                          selectedReport?.id === report.id
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border'
                        }`}
                        onClick={() => setSelectedReport(report)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">
                              {reportTypeLabels[report.report_type]?.icon}
                            </span>
                            <div>
                              <h3 className="font-medium">
                                {reportTypeLabels[report.report_type]?.label}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {report.town_name || 'Unknown area'} • {getCountyName(report.county_id)}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant={
                                    report.status === 'verified'
                                      ? 'default'
                                      : report.status === 'rejected'
                                      ? 'destructive'
                                      : 'secondary'
                                  }
                                  className="gap-1"
                                >
                                  <StatusIcon className="w-3 h-3" />
                                  {statusConfig[report.status].label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(report.created_at), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Report Detail */}
                <div className="lg:sticky lg:top-24 h-fit">
                  {selectedReport ? (
                    <motion.div
                      key={selectedReport.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-card rounded-xl border border-border overflow-hidden"
                    >
                      {selectedReport.image_url && (
                        <div className="aspect-video bg-muted">
                          <img
                            src={selectedReport.image_url}
                            alt="Report evidence"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="p-4 space-y-4">
                        {/* Header */}
                        <div>
                          <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
                            <span>{reportTypeLabels[selectedReport.report_type]?.icon}</span>
                            {reportTypeLabels[selectedReport.report_type]?.label}
                          </h3>
                          <Badge
                            variant={
                              selectedReport.status === 'verified'
                                ? 'default'
                                : selectedReport.status === 'rejected'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="mt-1"
                          >
                            {statusConfig[selectedReport.status].label}
                          </Badge>
                        </div>

                        {/* Metadata */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {selectedReport.town_name || 'Unknown'},{' '}
                              {getCountyName(selectedReport.county_id)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(selectedReport.created_at), 'PPp')}</span>
                          </div>
                        </div>

                        {/* Description */}
                        {selectedReport.description && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm">{selectedReport.description}</p>
                          </div>
                        )}

                        {/* AI Analysis */}
                        {selectedReport.ai_analysis && (
                          <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className="w-4 h-4 text-accent" />
                              <span className="text-sm font-medium">AI Analysis</span>
                              {selectedReport.ai_confidence_score !== null && (
                                <Badge
                                  variant={
                                    selectedReport.ai_confidence_score >= 70
                                      ? 'default'
                                      : selectedReport.ai_confidence_score >= 40
                                      ? 'secondary'
                                      : 'destructive'
                                  }
                                >
                                  {selectedReport.ai_confidence_score}% confidence
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {selectedReport.ai_analysis}
                            </p>
                          </div>
                        )}

                        {/* Admin Replies */}
                        <div className="border-t border-border pt-4 space-y-3">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Reply className="w-4 h-4" />
                            Admin Responses ({replies.length})
                          </h4>

                          {replies.length > 0 ? (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                              {replies.map((reply) => (
                                <div
                                  key={reply.id}
                                  className="p-3 bg-primary/5 border border-primary/10 rounded-lg"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <Shield className="w-3 h-3 text-primary" />
                                    <span className="text-xs font-medium text-primary">
                                      County Admin
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                      {format(new Date(reply.created_at), 'MMM d, h:mm a')}
                                    </span>
                                  </div>
                                  <p className="text-sm">{reply.message}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              No responses yet. You'll see admin replies here once your report is reviewed.
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="bg-card rounded-xl border border-border p-8 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        Select a report to view details and admin responses
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MyReports;
