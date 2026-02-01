import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Droplets, CloudRain, Info, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Notification } from '@/data/aquaguardData';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllRead: () => void;
}

const NotificationsPanel = ({
  isOpen,
  onClose,
  notifications,
  onNotificationClick,
  onMarkAllRead,
}: NotificationsPanelProps) => {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'flood_alert': return Droplets;
      case 'water_scarcity': return AlertTriangle;
      case 'weather_alert': return CloudRain;
      default: return Info;
    }
  };

  const getSeverityColor = (severity: Notification['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/10 border-destructive text-destructive';
      case 'warning': return 'bg-warning/10 border-warning text-warning';
      default: return 'bg-primary/10 border-primary text-primary';
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-heading text-lg font-bold">Notifications</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
                  Mark all read
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification, index) => {
                  const Icon = getIcon(notification.type);
                  
                  return (
                    <motion.button
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => onNotificationClick(notification)}
                      className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-md ${
                        notification.read 
                          ? 'bg-muted/30 border-border opacity-70' 
                          : getSeverityColor(notification.severity)
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          notification.read ? 'bg-muted' : ''
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className={`font-medium text-sm truncate ${
                              notification.read ? 'text-muted-foreground' : 'text-foreground'
                            }`}>
                              {notification.title}
                            </h4>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {getTimeAgo(notification.timestamp)}
                            </span>
                          </div>
                          <p className={`text-sm leading-relaxed ${
                            notification.read ? 'text-muted-foreground' : 'text-foreground/80'
                          }`}>
                            {notification.message}
                          </p>
                          {notification.countyId !== 'national' && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span>{notification.countyId}</span>
                            </div>
                          )}
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                        )}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;
