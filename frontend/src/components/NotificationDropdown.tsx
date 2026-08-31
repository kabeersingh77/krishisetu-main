import React, { useState, useEffect } from 'react';
import { Bell, Check, Info, AlertTriangle, CheckCircle, ShoppingBag, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import api from '@/services/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
      setUnreadCount((res.data || []).filter((n: Notification) => !n.read).length);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return <ShoppingBag className="h-4 w-4 text-emerald-600" />;
      case 'DELIVERY': return <Truck className="h-4 w-4 text-blue-600" />;
      case 'PRICE': return <CheckCircle className="h-4 w-4 text-amber-600" />;
      case 'DEMAND': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Info className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="font-semibold text-sm">Notifications</div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7 px-2">
              Mark all read
            </Button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          notifications.slice(0, 8).map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={`p-3 cursor-pointer flex flex-col items-start gap-1 border-b last:border-b-0 ${!n.read ? 'bg-primary/5 font-medium' : ''}`}
              onClick={() => markAsRead(n.id)}
            >
              <div className="flex items-center gap-2 w-full">
                {getIcon(n.type)}
                <span className="text-xs font-semibold flex-1 truncate">{n.title}</span>
                {!n.read && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
              <span className="text-[10px] text-muted-foreground/70">
                {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
