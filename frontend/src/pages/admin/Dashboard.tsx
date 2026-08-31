import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Users, Package, ShoppingBag, TrendingUp, DollarSign, Truck, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/services/api';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#6366f1'];

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/analytics/admin');
        setData(res.data);
      } catch (e) {
        console.error(e);
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

  const kpis = [
    { title: 'Total Registered Users', value: data?.totalUsers || 0, icon: Users, color: 'text-blue-600' },
    { title: 'Farmers & FPOs', value: `${data?.farmers || 0} / ${data?.fpos || 0}`, icon: ShieldCheck, color: 'text-emerald-600' },
    { title: 'Active Listings', value: data?.activeListings || 0, icon: Package, color: 'text-indigo-600' },
    { title: 'Total Orders', value: data?.totalOrders || 0, icon: ShoppingBag, color: 'text-amber-600' },
    { title: 'Platform GMV', value: `₹${(data?.gmv || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-teal-600' },
    { title: 'Farmer Earnings', value: `₹${(data?.farmerEarnings || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">System & Market Analytics</h1>
          <p className="text-muted-foreground text-sm">Real-time macro transaction volumes, crop demand distributions, and supply-chain efficiency tracking.</p>
        </div>
        <Link to="/admin/impact">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            View Platform Impact Simulation <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="border shadow-sm">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{kpi.title}</span>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <div className="text-xl font-bold mt-2">{kpi.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GMV & Orders Chart */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Order Volume & GMV (Past 30 Days)</CardTitle>
            <CardDescription>Daily marketplace commerce velocity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.ordersChart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminGmv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip formatter={(value: any, name: any) => [name === 'gmv' ? `₹${Number(value).toLocaleString('en-IN')}` : value, name === 'gmv' ? 'GMV' : 'Orders']} />
                  <Area type="monotone" dataKey="gmv" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#adminGmv)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Crop Demand Chart */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Crop Demand Distribution (kg Sold)</CardTitle>
            <CardDescription>Product volume breakdown across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(data?.cropDemandChart || []).slice(0, 7)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="crop" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(val) => `${val}kg`} />
                  <Tooltip formatter={(val: any) => [`${val} kg`, 'Quantity']} />
                  <Bar dataKey="quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
