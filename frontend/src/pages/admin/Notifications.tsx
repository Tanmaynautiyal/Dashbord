import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Check,
  ExternalLink,
  Sparkles,
  Cpu,
  Code2,
  BookOpen,
  ShieldAlert,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../ui';
import { notificationService, type NotificationItem } from '../../services/notificationService';
import { Link } from 'react-router-dom';

const CATEGORY_TABS = [
  { key: 'all', label: 'All Updates', icon: Bell },
  { key: 'ai_tool', label: 'AI Tools & Models', icon: Cpu },
  { key: 'tech_trend', label: 'Tech Releases & Runtimes', icon: Code2 },
  { key: 'platform_learning', label: 'Learning & Quizzes', icon: BookOpen },
];

export default function AdminNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setItems(data);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setItems(prev => prev.map(item => ({ ...item, unread: false })));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleRead = async (id: string) => {
    try {
      await notificationService.toggleRead(id);
      setItems(prev =>
        prev.map(item => (item.id === id ? { ...item, unread: !item.unread } : item))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = items.filter(i => i.unread).length;

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesUnread = !unreadOnly || item.unread;
    return matchesCategory && matchesUnread;
  });

  const getBadgeClass = (color: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
      case 'purple':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25';
      case 'blue':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25';
      case 'cyan':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25';
      case 'amber':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
      case 'rose':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25';
      case 'indigo':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25';
      default:
        return 'bg-secondary text-foreground border-border';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">AI Tools & Tech Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-500 text-white shadow-sm">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time feed of newly released AI models, developer runtimes, frameworks, and platform events.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="text-xs font-semibold"
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
            Mark all read
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Options */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-secondary/40 border border-border/50">
        <div className="flex flex-wrap items-center gap-1">
          {CATEGORY_TABS.map(tab => {
            const isActive = selectedCategory === tab.key;
            const count = tab.key === 'all' ? items.length : items.filter(i => i.category === tab.key).length;
            const Icon = tab.icon;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedCategory(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-card text-purple-600 dark:text-purple-300 shadow-sm border border-purple-500/20 font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-md bg-secondary text-muted-foreground">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Unread toggle */}
        <button
          type="button"
          onClick={() => setUnreadOnly(v => !v)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
            unreadOnly
              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/40 font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Filter className="w-3 h-3" />
          <span>Unread only</span>
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse h-[130px] bg-secondary/30 rounded-2xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground rounded-2xl border border-dashed border-border/70">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-30 text-purple-500" />
          <p className="font-semibold text-sm">No notifications found.</p>
          <p className="text-xs text-muted-foreground mt-1">
            {unreadOnly ? 'You have caught up with all updates!' : 'No updates match the current filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredItems.map(item => (
            <Card
              key={item.id}
              className={`transition-all duration-200 rounded-2xl border ${
                item.unread
                  ? 'border-purple-500/35 bg-purple-500/5 shadow-md shadow-purple-500/5'
                  : 'border-border/60 hover:border-purple-500/20 bg-card/60'
              }`}
            >
              <CardHeader className="py-3 px-5 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      {item.category_label}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getBadgeClass(item.badge_color)}`}>
                      {item.badge}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • {item.timestamp}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {item.unread && (
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse mr-1" title="Unread" />
                    )}
                    <button
                      type="button"
                      onClick={() => toggleRead(item.id)}
                      className={`p-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                        item.unread
                          ? 'hover:bg-purple-500/10 text-muted-foreground hover:text-purple-600'
                          : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                      title={item.unread ? 'Mark as read' : 'Mark as unread'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Dismiss notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <CardTitle className="text-base font-bold tracking-tight text-foreground mt-1">
                  {item.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="px-5 pb-4 pt-0 space-y-3">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.detail}
                </p>

                {item.action_url && item.action_label && (
                  <div>
                    {item.action_url.startsWith('http') ? (
                      <a
                        href={item.action_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                      >
                        {item.action_label}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <Link
                        to={item.action_url}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                      >
                        {item.action_label}
                        <Sparkles className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
