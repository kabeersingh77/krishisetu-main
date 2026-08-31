import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ShoppingBag, Truck, CheckCircle2, Clock, MapPin, Package, AlertCircle } from 'lucide-react';
import api from '@/services/api';

const TRACKING_STEPS = [
  { key: 'PENDING', label: 'Ordered', icon: ShoppingBag },
  { key: 'CONFIRMED', label: 'Confirmed by Farmer', icon: CheckCircle2 },
  { key: 'PROCESSING', label: 'Packed & Graded', icon: Package },
  { key: 'SHIPPED', label: 'In Transit', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 }
];

export default function ConsumerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/orders');
        setOrders(res.data?.orders || res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getStepIndex = (status: string) => {
    const idx = TRACKING_STEPS.findIndex(s => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Purchases & Tracking</h1>
        <p className="text-muted-foreground text-sm">Real-time status updates from harvest packaging to doorstep delivery.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading orders...</div>
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-semibold text-base mb-1">No Orders Placed Yet</h3>
            <p className="text-xs text-muted-foreground mb-4">Explore fresh seasonal produce directly from verified farmers.</p>
          </Card>
        ) : (
          orders.map((o) => {
            const currentStepIdx = getStepIndex(o.status);
            return (
              <Card key={o.id} className="border shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/20 p-4 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm">#{o.id.slice(-8).toUpperCase()}</span>
                    <Badge className={
                      o.status === 'DELIVERED' ? 'bg-emerald-600' :
                      o.status === 'SHIPPED' ? 'bg-indigo-600' :
                      o.status === 'PROCESSING' ? 'bg-blue-600' :
                      o.status === 'CONFIRMED' ? 'bg-amber-500' : 'bg-slate-500'
                    }>
                      {o.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Placed: {new Date(o.createdAt).toLocaleDateString()}
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-6">
                  {/* Delivery Stepper */}
                  <div className="py-2">
                    <div className="relative flex justify-between items-center max-w-2xl mx-auto">
                      {/* Connection bar */}
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2 z-0" />
                      <div
                        className="absolute top-1/2 left-0 h-1 bg-emerald-600 -translate-y-1/2 z-0 transition-all duration-500"
                        style={{ width: `${(currentStepIdx / (TRACKING_STEPS.length - 1)) * 100}%` }}
                      />

                      {TRACKING_STEPS.map((step, idx) => {
                        const isCompleted = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;
                        const StepIcon = step.icon;
                        return (
                          <div key={step.key} className="relative z-10 flex flex-col items-center">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-background border-muted text-muted-foreground'}`}>
                              <StepIcon className="h-4 w-4" />
                            </div>
                            <span className={`text-[11px] mt-1.5 font-medium text-center whitespace-nowrap hidden sm:block ${isCurrent ? 'text-emerald-600 font-bold' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Items Summary & Delivery Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t text-sm">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase">Items Procured</div>
                      {o.items?.map((it: any) => (
                        <div key={it.id} className="flex justify-between text-xs">
                          <span>{it.listing?.product?.name || 'Produce'} × {it.quantity}kg</span>
                          <span className="font-semibold">₹{it.quantity * it.price}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold text-sm pt-2 border-t text-emerald-600">
                        <span>Total Paid</span>
                        <span>₹{o.total}</span>
                      </div>
                    </div>

                    <div className="space-y-2 bg-muted/20 p-3 rounded-lg border text-xs">
                      <div className="font-semibold text-muted-foreground uppercase">Delivery Destination</div>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <div>{o.shippingAddress}</div>
                          <div className="text-muted-foreground">{o.shippingCity}, {o.shippingState} - {o.shippingPin}</div>
                        </div>
                      </div>
                      {o.delivery?.driver && (
                        <div className="pt-2 border-t text-muted-foreground">
                          Driver: <span className="font-medium text-foreground">{o.delivery.driver}</span> ({o.delivery.vehicle})
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
