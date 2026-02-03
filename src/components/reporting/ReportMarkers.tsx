import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface EnvironmentalReport {
  id: string;
  report_type: 'flooded_road' | 'dry_borehole' | 'broken_kiosk' | 'overflowing_river';
  county_id: string;
  town_name: string | null;
  latitude: number;
  longitude: number;
  status: 'pending' | 'verified' | 'rejected';
  ai_confidence_score: number | null;
  created_at: string;
}

interface ReportMarkersProps {
  countyId?: string;
  onReportClick?: (report: EnvironmentalReport) => void;
  mapBounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}

const reportTypeConfig: Record<string, { icon: string; color: string }> = {
  flooded_road: { icon: '🌊', color: 'bg-blue-500' },
  dry_borehole: { icon: '🕳️', color: 'bg-amber-600' },
  broken_kiosk: { icon: '🚰', color: 'bg-gray-500' },
  overflowing_river: { icon: '🏞️', color: 'bg-cyan-500' },
};

const ReportMarkers = ({ countyId, onReportClick }: ReportMarkersProps) => {
  const [reports, setReports] = useState<EnvironmentalReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<EnvironmentalReport | null>(null);

  useEffect(() => {
    fetchReports();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('public-reports')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'environmental_reports',
        },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [countyId]);

  const fetchReports = async () => {
    let query = supabase
      .from('environmental_reports')
      .select('id, report_type, county_id, town_name, latitude, longitude, status, ai_confidence_score, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (countyId) {
      query = query.eq('county_id', countyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      return;
    }

    setReports((data as EnvironmentalReport[]) || []);
  };

  const handleReportClick = (report: EnvironmentalReport) => {
    setSelectedReport(report);
    onReportClick?.(report);
  };

  // Group reports by approximate location (for clustering in UI)
  const visibleReports = reports.filter(r => r.status !== 'rejected');

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Report markers would be positioned on the map */}
      {/* This component provides the data layer - actual positioning depends on map implementation */}
      
      {/* Floating report count indicator */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <div className="bg-card/95 backdrop-blur-sm rounded-xl border border-border p-3 shadow-lg">
          <div className="text-xs text-muted-foreground mb-2">Community Reports</div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="gap-1">
              <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              {reports.filter(r => r.status === 'pending').length} Pending
            </Badge>
            <Badge variant="default" className="gap-1">
              <span className="w-2 h-2 rounded-full bg-success" />
              {reports.filter(r => r.status === 'verified').length} Verified
            </Badge>
          </div>
        </div>
      </div>

      {/* Selected report popup */}
      {selectedReport && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 pointer-events-auto"
        >
          <div className="bg-card rounded-xl border border-border shadow-xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {reportTypeConfig[selectedReport.report_type]?.icon}
                  </span>
                  <span className="font-medium capitalize">
                    {selectedReport.report_type.replace('_', ' ')}
                  </span>
                </div>
                <Badge
                  variant={
                    selectedReport.status === 'verified'
                      ? 'default'
                      : selectedReport.status === 'rejected'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {selectedReport.status}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {selectedReport.town_name || 'Unknown location'}
              </p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{format(new Date(selectedReport.created_at), 'MMM d, h:mm a')}</span>
                {selectedReport.ai_confidence_score !== null && (
                  <span className={`font-medium ${
                    selectedReport.ai_confidence_score >= 70 ? 'text-success' :
                    selectedReport.ai_confidence_score >= 40 ? 'text-warning' : 'text-destructive'
                  }`}>
                    AI: {selectedReport.ai_confidence_score}% confident
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setSelectedReport(null)}
              className="w-full py-2 text-sm text-center bg-muted hover:bg-muted/80 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ReportMarkers;
