import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Truck, Heart, ArrowRight, Sparkles, MapPin, Tag } from 'lucide-react';
import api from '@/services/api';

export default function ConsumerDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [anRes, recRes] = await Promise.all([
          api.get('/analytics/consumer'),
          api.get('/ai/recommendations')
        ]);
        setAnalytics(anRes.data);
        setRecommendations(recRes.data || []);
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Consumer Hub</h1>
        <p className="text-muted-foreground text-sm">Track farm-direct deliveries, view orders, and explore local harvest recommendations.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase">Active Deliveries</div>
              <div className="text-2xl font-bold mt-1 text-emerald-600">{analytics?.activeOrders || 0}</div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
              <Truck className="h-5 w-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase">Total Orders</div>
              <div className="text-2xl font-bold mt-1">{analytics?.totalOrders || 0}</div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase">Total Spent</div>
              <div className="text-2xl font-bold mt-1">₹{(analytics?.totalSpent || 0).toLocaleString('en-IN')}</div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
              <Tag className="h-5 w-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended For You */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold">Personalized Farm-Fresh Picks</h2>
          </div>
          <Link to="/marketplace">
            <Button variant="ghost" size="sm" className="text-xs">
              Explore All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {recommendations.slice(0, 4).map((listing: any) => (
            <Card key={listing.id} className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm">{listing.product?.name}</h3>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> {listing.location}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {listing.quality}
                  </Badge>
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t">
                  <div className="font-bold text-base text-emerald-600">
                    ₹{listing.price} <span className="text-xs font-normal text-muted-foreground">/ {listing.unit}</span>
                  </div>
                  <Link to={`/marketplace/${listing.id}`}>
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
