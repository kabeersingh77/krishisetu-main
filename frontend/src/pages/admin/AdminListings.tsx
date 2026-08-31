import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Package } from 'lucide-react';
import api from '@/services/api';

export default function AdminListings() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchListings = async () => {
    try {
      const res = await api.get('/listings');
      setListings(res.data?.listings || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handlePause = async (id: string) => {
    try {
      await api.delete(`/listings/${id}`);
      toast({ title: 'Listing status set to PAUSED' });
      fetchListings();
    } catch (e) {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Marketplace Produce Moderation</h1>
        <p className="text-muted-foreground text-sm">Monitor all producer batch listings across regional clusters.</p>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">All Active & Archived Listings ({listings.length})</CardTitle>
          <CardDescription>Real-time producer inventories</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading catalog...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Crop & Variety</TableHead>
                  <TableHead>Producer / Farm</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Moderate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((l) => (
                  <TableRow key={l.id} className="hover:bg-muted/20">
                    <TableCell className="font-semibold text-sm">
                      {l.product?.name}
                      <span className="block text-[11px] text-muted-foreground">{l.quality}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {l.fpo?.name || l.farmer?.farmName || 'Direct Producer'}
                    </TableCell>
                    <TableCell className="font-medium text-xs">
                      {l.quantity} {l.unit}
                    </TableCell>
                    <TableCell className="font-bold text-xs text-emerald-600">
                      ₹{l.price} / {l.unit}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.location}</TableCell>
                    <TableCell>
                      <Badge className={l.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-slate-500'}>
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {l.status === 'ACTIVE' && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-rose-600" onClick={() => handlePause(l.id)}>
                          Pause
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
    </div>
  );
}
