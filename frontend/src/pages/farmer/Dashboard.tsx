import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Package, ShoppingBag, TrendingUp, Truck, PlusCircle, AlertTriangle, ArrowUpRight, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';

export default function FarmerDashboard() {
  const [data, setData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [analyticsRes, alertsRes] = await Promise.all([
          api.get('/analytics/farmer'),
          api.get('/ai/farmer-alerts')
        ]);
        setData(analyticsRes.data);
        setAlerts(alertsRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const metrics = [
    { title: 'Active Listings', value: data?.activeListings || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/40' },
    { title: 'Total Orders', value: data?.totalOrders || 0, icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { title: 'Total Revenue', value: `₹${(data?.revenue || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    { title: 'Pending Deliveries', value: data?.pendingDeliveries || 0, icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
    { title: 'Produce Sold', value: `${data?.produceSold || 0} kg`, icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/40' },
    { title: 'Avg Realization', value: `₹${data?.avgRealization || 0}/kg`, icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/40' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Farmer Command Center</h1>
          <p className="text-muted-foreground text-sm">Real-time marketplace realization, demand alerts, and order processing.</p>
        </div>
        <Link to="/farmer/add-listing">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm">
            <PlusCircle className="h-4 w-4" /> Add Produce Listing
          </Button>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <Card key={idx} className="border shadow-sm">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{m.title}</span>
                  <div className={`p-2 rounded-lg ${m.bg}`}>
                    <Icon className={`h-4 w-4 ${m.color}`} />
                  </div>
                </div>
                <div className="text-xl font-bold mt-2">{m.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI Demand & Price Alerts */}
      {alerts.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>AI Market & Demand Intelligence Alerts</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-background border gap-2 text-sm">
                <div>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 mr-2">[{a.title}]</span>
                  <span>{a.message}</span>
                </div>
                <Link to="/farmer/add-listing">
                  <Button size="sm" variant="outline" className="h-7 text-xs shrink-0">
                    Create Listing <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Revenue Chart & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Revenue History (Past 30 Days)</CardTitle>
            <CardDescription>Daily direct buyer earnings through KrishiSetu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.revenueChart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders List */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <CardDescription>Direct buyer procurements</CardDescription>
            </div>
            <Link to="/farmer/orders">
              <Button variant="ghost" size="sm" className="text-xs">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {(!data?.recentOrders || data.recentOrders.length === 0) ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No orders received yet.</div>
            ) : (
              <div className="divide-y text-sm">
                {data.recentOrders.map((o: any) => (
                  <div key={o.id} className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div>
                      <div className="font-medium text-xs">{o.buyer}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {o.items.map((i: any) => `${i.quantity}kg ${i.crop}`).join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-xs text-emerald-600">₹{o.total}</div>
                      <Badge variant="outline" className="text-[10px] mt-1 uppercase">
                        {o.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
