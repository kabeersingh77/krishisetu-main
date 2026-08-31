import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import { Sparkles, MapPin, Building, ShieldCheck, ShoppingCart, ArrowRight } from 'lucide-react';
import api from '@/services/api';

const CROPS = ['Tomato', 'Potato', 'Onion', 'Wheat', 'Soybean', 'Rice', 'Chilli', 'Cauliflower', 'Cabbage', 'Mango'];
const CITIES = ['Indore', 'Dewas', 'Bhopal', 'Ujjain', 'Jabalpur', 'Nagpur', 'Jaipur', 'Delhi'];

export default function BulkProcurement() {
  const [crop, setCrop] = useState('Tomato');
  const [quantity, setQuantity] = useState(1500);
  const [location, setLocation] = useState('Indore');
  const [requiredDate, setRequiredDate] = useState(new Date().toISOString().split('T')[0]);

  const [matchedListings, setMatchedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleSearchMatches = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get('/listings', {
        params: { search: crop }
      });
      // Sort and augment with mock distance for prototype display
      const list = (res.data?.listings || []).map((l: any, idx: number) => ({
        ...l,
        distanceKm: Math.round(15 + idx * 12),
        estimatedEta: `${Math.round(2 + idx * 1.5)} days`
      }));
      setMatchedListings(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderMatch = async (listingId: string) => {
    try {
      await addToCart(listingId, Number(quantity));
      toast({
        title: 'Procurement Lot Added to Order',
        description: 'Proceed to checkout to confirm delivery schedule and commercial terms.',
      });
    } catch (e: any) {
      toast({ title: 'Error adding lot', description: e.response?.data?.error, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bulk Procurement Matching</h1>
        <p className="text-muted-foreground text-sm">Find verified farmers and FPO clusters meeting your institutional volume requirements.</p>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Procurement Request (RFQ)</CardTitle>
          <CardDescription>Specify volume, required delivery timeframe, and receiving depot</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchMatches} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Produce / Crop</Label>
              <Select value={crop} onValueChange={setCrop}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CROPS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Required Quantity (kg)</Label>
              <Input
                type="number"
                min={100}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Delivery Depot City</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Required By Date</Label>
              <Input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                required
              />
            </div>

            <div className="sm:col-span-2 md:col-span-4 pt-2">
              <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2">
                <Sparkles className="h-4 w-4" /> {loading ? 'Matching Supplier Lots...' : 'Find Matching Farmers & FPO Lots'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results Section */}
      {searched && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">
            Matched Supplier Batches ({matchedListings.length})
          </h2>

          {matchedListings.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground bg-muted/20 rounded-lg border">
              No supplier currently has {quantity} kg of {crop} available. Try adjusting volume or selecting an alternate grade.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchedListings.map((l) => (
                <Card key={l.id} className="border shadow-sm flex flex-col justify-between">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base">{l.product?.name}</h3>
                          <Badge variant="outline" className="text-xs">{l.quality}</Badge>
                        </div>
                        <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
                          <Building className="h-3.5 w-3.5" />
                          {l.fpo?.name || l.farmer?.farmName || 'Verified Producer'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-600">₹{l.price}</div>
                        <div className="text-[10px] text-muted-foreground">per kg</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-muted/30 rounded-lg text-xs text-center border">
                      <div>
                        <div className="text-muted-foreground text-[10px]">Batch Available</div>
                        <div className="font-semibold">{l.quantity} kg</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-[10px]">Distance</div>
                        <div className="font-semibold">{l.distanceKm} km</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-[10px]">Est. Transit</div>
                        <div className="font-semibold">{l.estimatedEta}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {l.location}
                      </div>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs"
                        onClick={() => handleOrderMatch(l.id)}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" /> Direct Procure Lot
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
