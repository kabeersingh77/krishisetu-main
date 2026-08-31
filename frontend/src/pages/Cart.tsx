import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart, ArrowRight, Leaf, ShieldCheck } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Cart() {
  const { items, cartTotal, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  const deliveryFee = items.length > 0 ? 40 : 0;
  const total = cartTotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
        <ShoppingCart className="h-20 w-20 mx-auto text-muted-foreground/30 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground text-sm mb-6">Explore farm-direct listings with AI fair pricing.</p>
        <Link to="/marketplace">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Browse Marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Direct Procurement Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const l = item.listing;
            const cropName = l?.product?.name || 'Produce';
            const price = l?.price || 0;
            const unit = l?.unit || 'kg';
            const seller = l?.fpo?.name || l?.farmer?.farmName || l?.farmer?.user?.name || 'Verified Producer';

            return (
              <Card key={item.id} className="border shadow-sm">
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg flex items-center justify-center shrink-0 border">
                    <Leaf className="h-8 w-8 text-emerald-600/40" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-base">{cropName}</h3>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                      {seller} ({l?.location})
                    </p>
                    <div className="font-semibold text-emerald-600 text-sm">
                      ₹{price} / {unit}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground mr-1">Qty ({unit}):</span>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                        className="w-20 h-8 text-xs font-semibold"
                      />
                    </div>
                    <div className="w-24 text-right font-bold text-sm text-foreground">
                      ₹{(price * item.quantity).toLocaleString('en-IN')}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.id)}
                      className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary Card */}
        <div className="space-y-4">
          <Card className="border shadow-sm bg-muted/20">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-base">Commercial Summary</h3>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Produce Value ({items.length} lots)</span>
                <span className="font-semibold text-foreground">₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Shared Transit Dispatch Fee</span>
                <span className="font-semibold text-foreground">₹{deliveryFee}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Payout</span>
                <span className="text-emerald-600">₹{total.toLocaleString('en-IN')}</span>
              </div>
              <Button
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
          <div className="p-3 bg-muted/30 rounded-lg text-center text-xs text-muted-foreground border">
            Directly settles to farmer accounts upon delivery verification.
          </div>
        </div>
      </div>
    </div>
  );
}
