import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ReportRow = Database['public']['Tables']['environmental_reports']['Row'];

const reportTypeLabels: Record<string, string> = {
  flooded_road: '🌊 Flooded Road',
  dry_borehole: '🕳️ Dry Borehole',
  broken_kiosk: '🚰 Broken Water Kiosk',
  overflowing_river: '🏞️ Overflowing River',
};

interface UseRealtimeReportsOptions {
  /** County ID to filter reports for (admin's county) */
  countyId: string | null;
  /** Whether the current user is a county admin */
  isCountyAdmin: boolean;
  /** Callback when a new report is received */
  onNewReport?: (report: ReportRow) => void;
  /** Whether realtime is enabled */
  enabled?: boolean;
}

export function useRealtimeReports({
  countyId,
  isCountyAdmin,
  onNewReport,
  enabled = true,
}: UseRealtimeReportsOptions) {
  const { toast } = useToast();
  const onNewReportRef = useRef(onNewReport);
  onNewReportRef.current = onNewReport;

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (e) {
      // Audio not available, silently ignore
    }
  }, []);

  useEffect(() => {
    if (!enabled || !isCountyAdmin || !countyId) return;

    const channel = supabase
      .channel(`reports-${countyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'environmental_reports',
          filter: `county_id=eq.${countyId}`,
        },
        (payload) => {
          const newReport = payload.new as ReportRow;

          const typeLabel = reportTypeLabels[newReport.report_type] || newReport.report_type;
          const location = newReport.town_name || 'Unknown area';

          toast({
            title: `🔔 New Report: ${typeLabel}`,
            description: `A new report was submitted in ${location}. Tap to review in Admin Dashboard.`,
            duration: 8000,
          });

          playNotificationSound();

          onNewReportRef.current?.(newReport);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Realtime: subscribed to reports for county ${countyId}`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime: channel error for reports subscription');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, isCountyAdmin, countyId, toast, playNotificationSound]);
}
