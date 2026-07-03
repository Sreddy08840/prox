import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Bell, Check, Loader2, Sparkles, UserPlus, Activity, Mail } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch count and list
  const fetchNotifications = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const [countRes, listRes] = await Promise.all([
        api.get('/notifications/unread-count'),
        api.get('/notifications'),
      ]);

      if (countRes.data.success) {
        setUnreadCount(countRes.data.data.count);
      }
      if (listRes.data.success) {
        setNotifications(listRes.data.data);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load notifications:', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true);

    // Poll every 30 seconds for background updates
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/notifications/read-all');
      if (res.data.success) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleMarkRead = async (id: string, message: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );

      // Simple routing helper for notifications
      if (message.toLowerCase().includes('lead')) {
        // Attempt to extract UUID if any
        const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
        const match = message.match(uuidRegex);
        if (match) {
          navigate(`/leads/${match[0]}`);
        } else {
          navigate('/leads');
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to mark notification as read:', err);
    }
  };

  const getIcon = (title: string, message: string) => {
    const lowerTitle = title.toLowerCase();
    const lowerMessage = message.toLowerCase();

    if (lowerTitle.includes('assign') || lowerMessage.includes('assigned')) {
      return <UserPlus size={14} className="text-blue-500" />;
    }
    if (lowerTitle.includes('status') || lowerMessage.includes('status')) {
      return <Activity size={14} className="text-purple-500" />;
    }
    if (lowerTitle.includes('email') || lowerMessage.includes('email')) {
      return <Mail size={14} className="text-amber-500" />;
    }
    return <Sparkles size={14} className="text-primary" />;
  };

  const getRelativeTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border bg-background hover:bg-accent hover:text-accent-foreground transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label="Notification Center"
      >
        <Bell size={18} className={unreadCount > 0 ? 'animate-wiggle' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground animate-in zoom-in duration-200">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Overlay Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 rounded-2xl border bg-card text-card-foreground shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/40">
            <h4 className="text-xs font-black tracking-wider text-muted-foreground uppercase">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center space-x-1 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
              >
                <Check size={12} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-primary" size={20} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground font-semibold">
                No alerts or notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkRead(notif.id, notif.message)}
                  className={`flex gap-3 p-4 transition-colors hover:bg-muted/40 cursor-pointer ${
                    !notif.isRead ? 'bg-primary/5 font-medium' : ''
                  }`}
                >
                  {/* Category Indicator Icon */}
                  <div className="mt-0.5 p-1.5 h-7 w-7 rounded-lg bg-background border flex items-center justify-center shrink-0">
                    {getIcon(notif.title, notif.message)}
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 space-y-0.5">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-bold text-foreground leading-snug">{notif.title}</p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {getRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-normal">{notif.message}</p>
                  </div>

                  {/* Read Dot */}
                  {!notif.isRead && (
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
