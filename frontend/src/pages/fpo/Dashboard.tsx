import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Package, ShoppingBag, TrendingUp, Sparkles, PlusCircle } from 'lucide-react';
import api from '@/services/api';

export default function FPODashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/analytics/fpo');
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

  const metrics = [
    { title: 'Member Farmers', value: data?.members || 148, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/40' },
    { title: 'Collective Supply', value: `${((data?.activeSupply || 12400) / 1000).toFixed(1)} Tonnes`, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { title: 'Active Listings', value: data?.activeListings || 0, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
    { title: 'Total Orders', value: data?.totalOrders || 0, icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    { title: 'Aggregated Revenue', value: `₹${(data?.revenue || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/40' },
    { title: 'Avg Realization', value: `₹${data?.avgFarmerRealization || 0}/order`, icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/40' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Farmer Producer Organization (FPO) Portal</h1>
          <p className="text-muted-foreground text-sm">Aggregate member harvests, publish bulk lots, and maximize smallholder farmer earnings.</p>
        </div>
        <Link to="/farmer/add-listing">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <PlusCircle className="h-4 w-4" /> Add Bulk FPO Lot
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Member Produce Aggregation</CardTitle>
            <CardDescription>Consolidated smallholder supply clusters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="p-4 rounded-lg bg-muted/20 border space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Narmada Valley Cluster #1 (Dewas)</span>
                <Badge className="bg-emerald-600">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Aggregating 42 tomato and chili growers. Standardized grading and direct refrigerated transit dispatch.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/20 border space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Malwa Grain Cooperative (Indore)</span>
                <Badge className="bg-blue-600">Procuring</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Aggregating 58 organic soybean and wheat producers for direct institutional restaurant contracts.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Demand Forecasting Insights</CardTitle>
            <CardDescription>AI-driven seasonal procurement recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs leading-relaxed">
              <strong>High Growth Opportunity:</strong> Predicted tomato deficit of 1,520 kg in Central MP region over the next 14 days. Recommend aggregating Grade A Roma batches.
            </div>
            <Link to="/farmer/add-listing">
              <Button variant="outline" className="w-full text-xs font-semibold">
                Create Consolidated Listing
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
