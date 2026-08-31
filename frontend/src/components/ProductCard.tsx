import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Leaf, ShoppingCart, Heart, Building2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/services/api';

export default function ProductCard({ listing }: { listing: any }) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [adding, setAdding] = useState(false);

  const cropName = listing.product?.name || listing.crop || 'Fresh Produce';
  const sellerName = listing.fpo?.name || listing.farmer?.farmName || listing.farmer?.user?.name || 'Verified Producer';
  const unit = listing.unit || 'kg';
  const fairMin = Math.round(listing.price * 0.94);
  const fairMax = Math.round(listing.price * 1.06);

  let imageUrl: string | null = null;
  if (listing.images) {
    try {
      const parsed = typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images;
      if (Array.isArray(parsed) && parsed.length > 0) imageUrl = parsed[0];
    } catch (e) {
      if (typeof listing.images === 'string' && listing.images.startsWith('data:image')) {
        imageUrl = listing.images;
      }
    }
  }

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    try {
      await addToCart(listing.id, 10);
      toast({ title: 'Added to Cart', description: `10 ${unit} of ${cropName} added to your cart.` });
    } catch (e: any) {
      toast({
        title: 'Could not add to cart',
        description: e.response?.data?.error || 'Sign in to add to cart',
        variant: 'destructive'
      });
    } finally {
      setAdding(false);
    }
  };

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (saved) {
        await api.delete(`/saved/${listing.id}`);
        setSaved(false);
        toast({ title: 'Removed from bookmarks' });
      } else {
        await api.post(`/saved/${listing.id}`);
        setSaved(true);
        toast({ title: 'Bookmarked produce' });
      }
    } catch (e) {
      toast({ title: 'Please login to bookmark', variant: 'destructive' });
    }
  };

  return (
    <Link to={`/marketplace/${listing.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full border border-border/80 bg-card">
        <div className="aspect-video bg-gradient-to-br from-emerald-50 to-muted/40 dark:from-emerald-950/30 dark:to-zinc-900 flex items-center justify-center relative overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={cropName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Leaf className="h-16 w-16 text-emerald-600/30 group-hover:scale-110 transition-transform duration-300" />
          )}

          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            <Badge className="bg-background/90 text-foreground border shadow-sm text-[11px] backdrop-blur-xs">
              {listing.quality || 'Grade A'}
            </Badge>
            {listing.organic && (
              <Badge className="bg-emerald-600 text-white text-[11px]">
                Organic
              </Badge>
            )}
            {imageUrl && (
              <Badge className="bg-indigo-600/90 text-white text-[10px] gap-0.5 backdrop-blur-xs flex items-center">
                <Sparkles className="h-2.5 w-2.5" /> AI Verified
              </Badge>
            )}
          </div>
          <button
            onClick={handleToggleSave}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background shadow-sm transition-colors text-muted-foreground hover:text-rose-500 backdrop-blur-xs"
          >
            <Heart className={`h-4 w-4 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        <CardContent className="p-4 flex-1 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-base leading-tight group-hover:text-emerald-600 transition-colors">
                {cropName}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                {listing.fpo ? <Building2 className="h-3 w-3 text-emerald-600" /> : <ShieldCheck className="h-3 w-3 text-blue-500" />}
                <span className="truncate max-w-[150px]">{sellerName}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-base text-emerald-600">₹{listing.price}</span>
              <span className="text-[10px] text-muted-foreground block">/{unit}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{listing.location}</span>
          </div>

          <div className="pt-2 border-t text-[11px] space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Stock: <strong className="text-foreground">{listing.quantity} {unit}</strong></span>
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                Fair: ₹{fairMin}–₹{fairMax}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-3 pt-0">
          <Button
            size="sm"
            disabled={adding}
            className="w-full gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            onClick={handleAdd}
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
