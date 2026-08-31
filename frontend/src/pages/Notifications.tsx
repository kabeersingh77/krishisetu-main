import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, ShoppingBag, Truck, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import api from '@/services/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAll = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkOne = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return <ShoppingBag className="h-5 w-5 text-emerald-600" />;
      case 'DELIVERY': return <Truck className="h-5 w-5 text-blue-600" />;
      case 'PRICE': return <CheckCircle className="h-5 w-5 text-amber-600" />;
      case 'DEMAND': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default: return <Info className="h-5 w-5 text-slate-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Notification Center</h1>
          <p className="text-muted-foreground text-sm">System updates, order statuses, and price recommendations.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAll}>
          Mark All as Read
        </Button>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-0 divide-y">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm">You have no notifications right now.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkOne(n.id)}
                className={`p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}
              >
                <div className="p-2 rounded-lg bg-muted/60 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{n.title}</h4>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                </div>
                {!n.read && <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-2" />}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
