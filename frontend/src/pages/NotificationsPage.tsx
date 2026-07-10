import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Clock, Sparkles, Building2, ShieldAlert } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'AI' | 'SLA' | 'CRM';
  read: boolean;
  targetUrl?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'AI Insight Generated',
      body: 'Lead Rashid Al-Mansoori classified as HOT. Budget segment ₹4.5 Cr matches Project Skyline specs.',
      time: '5m ago',
      type: 'AI',
      read: false,
      targetUrl: '/leads',
    },
    {
      id: '2',
      title: 'CRITICAL SLA BREACH Warning',
      body: 'Performance Alert: Response lag on Emma Johnson exceeded threshold time (limit: 10m).',
      time: '15m ago',
      type: 'SLA',
      read: false,
      targetUrl: '/leads',
    },
    {
      id: '3',
      title: 'WhatsApp Message Inbound',
      body: 'New text received from Ahmed Hassan: "Sent the documents for financing pre-approval."',
      time: '2h ago',
      type: 'CRM',
      read: true,
      targetUrl: '/conversations',
    },
    {
      id: '4',
      title: 'Project Milestone Reached',
      body: 'Commission calculations compiled for Project Skyline. Exporting automated sales spreadsheets.',
      time: 'Yesterday',
      type: 'CRM',
      read: true,
      targetUrl: '/projects',
    },
  ]);

  const navigate = useNavigate();

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'AI':
        return <Sparkles className="text-purple-500" size={14} />;
      case 'SLA':
        return <ShieldAlert className="text-rose-500" size={14} />;
      default:
        return <Building2 className="text-blue-500" size={14} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center space-x-2.5">
            <Bell className="text-primary animate-pulse" size={26} />
            <span>Alerts & Notifications</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-semibold">
            Track real-time AI classification metrics, SLA warnings, and inbound WhatsApp messages.
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="flex items-center space-x-1.5 rounded-xl border border-input bg-card px-4 py-2.5 text-xs font-bold hover:bg-accent text-muted-foreground hover:text-foreground transition-all shadow-sm shrink-0"
        >
          <Check size={14} />
          <span>Mark All Read</span>
        </button>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-16 border rounded-2xl bg-card text-xs text-muted-foreground font-semibold">
            You are all caught up! No notifications registered.
          </div>
        ) : (
          notifications.map(item => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all duration-200 ${
                item.read ? 'bg-card border-border/80 opacity-75' : 'bg-primary/5 border-primary/20 scale-[1.01] shadow-sm'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                {/* Indicator avatar */}
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  item.type === 'AI' ? 'bg-purple-500/10' :
                  item.type === 'SLA' ? 'bg-rose-500/10' :
                  'bg-blue-500/10'
                }`}>
                  {getTypeIcon(item.type)}
                </div>

                <div className="space-y-1 text-left">
                  <div className="flex items-center space-x-2.5">
                    <span
                      onClick={() => item.targetUrl && navigate(item.targetUrl)}
                      className="font-extrabold text-foreground hover:text-primary transition-colors cursor-pointer text-xs"
                    >
                      {item.title}
                    </span>
                    {!item.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                    {item.body}
                  </p>
                  <div className="flex items-center space-x-1.5 text-[9px] font-bold text-muted-foreground/75 pt-1">
                    <Clock size={10} />
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {!item.read && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    className="p-1.5 rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                    title="Mark as read"
                  >
                    <Check size={12} />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteNotification(item.id)}
                  className="p-1.5 rounded bg-muted hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
