import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Edit2, Pause, Play, Trash2, Eye, Package } from 'lucide-react';
import api from '@/services/api';

export default function FarmerListings() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Edit modal
  const [editingListing, setEditingListing] = useState<any>(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editQuantity, setEditQuantity] = useState(0);

  const fetchListings = async () => {
    try {
      const res = await api.get('/listings/farmer/mine');
      setListings(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await api.patch(`/listings/${id}`, { status: newStatus });
      toast({ title: `Listing ${newStatus === 'ACTIVE' ? 'Resumed' : 'Paused'}` });
      fetchListings();
    } catch (e) {
      toast({ title: 'Failed to update listing', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to pause/archive this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      toast({ title: 'Listing Removed' });
      fetchListings();
    } catch (e) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingListing) return;
    try {
      await api.patch(`/listings/${editingListing.id}`, {
        price: Number(editPrice),
        quantity: Number(editQuantity)
      });
      toast({ title: 'Listing Updated' });
      setEditingListing(null);
      fetchListings();
    } catch (e) {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Produce Inventory & Listings</h1>
          <p className="text-muted-foreground text-sm">Manage active harvest batches, pricing, and stock levels.</p>
        </div>
        <Link to="/farmer/add-listing">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <PlusCircle className="h-4 w-4" /> Add Produce
          </Button>
        </Link>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg">All Harvest Listings ({listings.length})</CardTitle>
          <CardDescription>Track real-time orders and inventory status</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading listings...</div>
          ) : listings.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-semibold text-base mb-1">No Produce Listed Yet</h3>
              <p className="text-xs text-muted-foreground mb-4">Start selling directly to consumers by creating your first listing.</p>
              <Link to="/farmer/add-listing">
                <Button size="sm" className="bg-emerald-600 text-white">Create First Listing</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Crop & Variety</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Available Qty</TableHead>
                  <TableHead>Listing Price</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((l) => (
                  <TableRow key={l.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-medium text-sm">{l.product?.name}</div>
                      {l.organic && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold px-1.5 py-0.5 rounded">
                          Organic
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {l.quality}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {l.quantity} {l.unit}
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600">
                      ₹{l.price} / {l.unit}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {l.location}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        l.status === 'ACTIVE' ? 'bg-emerald-600' :
                        l.status === 'PAUSED' ? 'bg-amber-500' : 'bg-rose-500'
                      }>
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        title="Edit Price & Quantity"
                        onClick={() => {
                          setEditingListing(l);
                          setEditPrice(l.price);
                          setEditQuantity(l.quantity);
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        title={l.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                        onClick={() => handleToggleStatus(l.id, l.status)}
                      >
                        {l.status === 'ACTIVE' ? <Pause className="h-3.5 w-3.5 text-amber-600" /> : <Play className="h-3.5 w-3.5 text-emerald-600" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700"
                        title="Delete"
                        onClick={() => handleDelete(l.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingListing && (
        <Dialog open={!!editingListing} onOpenChange={() => setEditingListing(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit {editingListing.product?.name} Listing</DialogTitle>
              <DialogDescription>Update selling price and available harvest volume.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Selling Price (₹ / kg)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Available Quantity (kg)</Label>
                <Input
                  type="number"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(Number(e.target.value))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingListing(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} className="bg-emerald-600 text-white">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
