import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Package, ShoppingBag, TrendingDown, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import api from '@/services/api';

export default function BulkBuyerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/analytics/consumer');
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Institutional Procurement Portal</h1>
          <p className="text-muted-foreground text-sm">Direct contract sourcing for restaurants, hotels, retail chains, and food processors.</p>
        </div>
        <Link to="/buyer/procurement">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Package className="h-4 w-4" /> Create Procurement RFQ
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase">Procurement Orders</div>
              <div className="text-2xl font-bold mt-1 text-emerald-600">{data?.totalOrders || 0}</div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
              <ShoppingBag className="h-5 w-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase">Active In-Transit</div>
              <div className="text-2xl font-bold mt-1 text-blue-600">{data?.activeOrders || 0}</div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase">Total Sourced Value</div>
              <div className="text-2xl font-bold mt-1">₹{(data?.totalSpent || 0).toLocaleString('en-IN')}</div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
              <Building2 className="h-5 w-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Procurement Hub Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Direct Sourcing Benefits</CardTitle>
            <CardDescription>Why institutional buyers source through KrishiSetu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Grade & Quality Verification:</span> Batch-tested produce directly matched from FPO clusters.
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border">
              <TrendingDown className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">20–30% Cost Reduction:</span> Elimination of mandi commission agents and intermediary markups.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Quick RFQ Matching</CardTitle>
            <CardDescription>Automated supplier matching by volume and distance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Submit your bulk requirement specifying crop, volume (500kg - 20,000kg), target destination, and required delivery date to receive instant matched lots.
            </p>
            <Link to="/buyer/procurement">
              <Button variant="outline" className="w-full text-xs font-semibold">
                Launch Procurement Matching Tool <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
