import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import { Heart, ShoppingBag, Trash2, MapPin } from 'lucide-react';
import api from '@/services/api';

export default function SavedProducts() {
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const fetchSaved = async () => {
    try {
      const res = await api.get('/saved');
      setSaved(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleRemove = async (listingId: string) => {
    try {
      await api.delete(`/saved/${listingId}`);
      toast({ title: 'Removed from bookmarks' });
      setSaved(saved.filter(s => s.listingId !== listingId));
    } catch (e) {
      toast({ title: 'Failed to remove', variant: 'destructive' });
    }
  };

  const handleAddToCart = async (listingId: string) => {
    try {
      await addToCart(listingId, 1);
      toast({ title: 'Added to cart' });
    } catch (e) {
      toast({ title: 'Failed to add to cart', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bookmarked Produce</h1>
        <p className="text-muted-foreground text-sm">Quickly reorder and keep track of your favorite farm listings.</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Loading saved listings...</div>
      ) : saved.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-base mb-1">No Saved Listings</h3>
          <p className="text-xs text-muted-foreground mb-4">Click the bookmark icon on any marketplace item to save it here.</p>
          <Link to="/marketplace">
            <Button size="sm" className="bg-emerald-600 text-white">Browse Marketplace</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {saved.map((item) => {
            const l = item.listing;
            return (
              <Card key={item.id} className="border shadow-sm flex flex-col justify-between">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base">{l?.product?.name}</h3>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" /> {l?.location}
                      </div>
                    </div>
                    <Badge variant="outline">{l?.quality}</Badge>
                  </div>

                  <div className="flex items-baseline justify-between pt-2 border-t">
                    <div>
                      <span className="text-lg font-bold text-emerald-600">₹{l?.price}</span>
                      <span className="text-xs text-muted-foreground"> / {l?.unit}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Available: {l?.quantity} {l?.unit}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                      onClick={() => handleAddToCart(l.id)}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" /> Add to Cart
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-rose-600 hover:text-rose-700 h-9 px-3"
                      onClick={() => handleRemove(l.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
