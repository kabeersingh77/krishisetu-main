import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/services/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Global Platform Orders</h1>
        <p className="text-muted-foreground text-sm">Full audit trail of all direct farm-to-consumer and institutional transactions.</p>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Commerce Transactions ({orders.length})</CardTitle>
          <CardDescription>Processed end-to-end orders across all regions</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading orders log...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Order Ref</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total GMV</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs font-semibold">
                      #{o.id.slice(-8).toUpperCase()}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{o.buyer?.name || 'Buyer'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{o.shippingCity || 'Central'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {o.items?.map((i: any) => `${i.quantity}kg ${i.listing?.product?.name || 'Produce'}`).join(', ')}
                    </TableCell>
                    <TableCell className="font-bold text-xs text-emerald-600">₹{o.total}</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
