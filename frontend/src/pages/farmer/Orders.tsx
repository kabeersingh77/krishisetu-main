import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingBag, CheckCircle, Truck, PackageCheck, Eye, Clock } from 'lucide-react';
import api from '@/services/api';

export default function FarmerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data?.orders || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      toast({
        title: `Order Status Updated: ${newStatus}`,
        description: `Buyer and logistics network notified.`,
      });
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (e) {
      toast({ title: 'Failed to update order', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Incoming Buyer Orders</h1>
        <p className="text-muted-foreground text-sm">Review, confirm, pack, and coordinate dispatch with logistics partners.</p>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg">Orders Log ({orders.length})</CardTitle>
          <CardDescription>Direct procurements for your listed produce</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-semibold text-base mb-1">No Orders Yet</h3>
              <p className="text-xs text-muted-foreground">New buyer purchases will appear here in real-time.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Order ID</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs font-semibold">
                      #{o.id.slice(-8).toUpperCase()}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {o.buyer?.name || 'Verified Buyer'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {o.items?.map((i: any) => `${i.quantity}kg ${i.listing?.product?.name || 'Produce'}`).join(', ')}
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600">
                      ₹{o.total}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        o.status === 'DELIVERED' ? 'bg-emerald-600' :
                        o.status === 'SHIPPED' ? 'bg-indigo-600' :
                        o.status === 'PROCESSING' ? 'bg-blue-600' :
                        o.status === 'CONFIRMED' ? 'bg-amber-500' : 'bg-slate-500'
                      }>
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedOrder(o)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
                      {o.status === 'PENDING' && (
                        <Button size="sm" className="h-7 text-xs bg-emerald-600 text-white" onClick={() => handleUpdateStatus(o.id, 'CONFIRMED')}>
                          Confirm
                        </Button>
                      )}
                      {o.status === 'CONFIRMED' && (
                        <Button size="sm" className="h-7 text-xs bg-blue-600 text-white" onClick={() => handleUpdateStatus(o.id, 'PROCESSING')}>
                          Pack Batch
                        </Button>
                      )}
                      {o.status === 'PROCESSING' && (
                        <Button size="sm" className="h-7 text-xs bg-indigo-600 text-white" onClick={() => handleUpdateStatus(o.id, 'SHIPPED')}>
                          Dispatch
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Order #{selectedOrder.id.slice(-8).toUpperCase()}</span>
                <Badge className="ml-2 uppercase">{selectedOrder.status}</Badge>
              </DialogTitle>
              <DialogDescription>
                Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm">
              <div className="bg-muted/40 p-3 rounded-lg border">
                <div className="font-semibold text-xs text-muted-foreground uppercase mb-1">Buyer Details</div>
                <div>{selectedOrder.buyer?.name}</div>
                <div className="text-xs text-muted-foreground">{selectedOrder.shippingAddress}, {selectedOrder.shippingCity}</div>
              </div>

              <div>
                <div className="font-semibold text-xs text-muted-foreground uppercase mb-2">Order Items</div>
                <div className="divide-y border rounded-lg overflow-hidden">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold">{item.listing?.product?.name}</div>
                        <div className="text-muted-foreground">{item.quantity} kg @ ₹{item.price}/kg</div>
                      </div>
                      <div className="font-bold">₹{item.quantity * item.price}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 font-bold text-base border-t">
                <span>Total Payout</span>
                <span className="text-emerald-600">₹{selectedOrder.total}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
