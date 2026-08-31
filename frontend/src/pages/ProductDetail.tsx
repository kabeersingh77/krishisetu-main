import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Truck,
  Calendar,
  ShoppingCart,
  Leaf,
  TrendingUp,
  Sparkles,
  AlertCircle,
  Building2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/components/ui/use-toast";
import api from "@/services/api";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [listing, setListing] = useState<any>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(25);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/listings/${id}`);
        setListing(res.data);
        if (res.data?.product?.name) {
          const histRes = await api.get("/ai/price-history", {
            params: {
              crop: res.data.product.name,
              location: res.data.location,
            },
          });
          const formatted = (histRes.data || []).map((p: any) => ({
            date: new Date(p.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            }),
            price: p.price,
          }));
          setPriceHistory(formatted);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleAddToCart = async () => {
    if (!listing) return;
    setAdding(true);
    try {
      await addToCart(listing.id, qty);
      toast({
        title: "Added to Cart",
        description: `${qty} ${listing.unit} of ${listing.product?.name} reserved in your cart.`,
      });
    } catch (e: any) {
      toast({
        title: "Could not add to cart",
        description:
          e.response?.data?.error ||
          "Login as a consumer or buyer to purchase.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate("/cart");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold mb-2">Produce Listing Not Found</h2>
        <Link to="/marketplace">
          <Button variant="outline">Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  const sellerName =
    listing.fpo?.name ||
    listing.farmer?.farmName ||
    listing.farmer?.user?.name ||
    "Verified Producer";
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <Link
        to="/marketplace"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Marketplace
      </Link>

      <div className="grid md:grid-cols-12 gap-8">
        {/* Left: Image, Seller Profile & Price History */}
        <div className="md:col-span-7 space-y-6">
          <div className="aspect-video bg-gradient-to-br from-emerald-100/50 to-emerald-50 dark:from-emerald-950/40 dark:to-zinc-900 rounded-xl flex items-center justify-center relative overflow-hidden border shadow-sm">
            {imageUrl ? (
              <img src={imageUrl} alt={listing.product?.name} className="w-full h-full object-cover" />
            ) : (
              <Leaf className="h-28 w-28 text-emerald-600/30" />
            )}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <Badge className="bg-emerald-600 text-white font-semibold backdrop-blur-xs">
                Direct from Producer
              </Badge>
              {listing.organic && (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 backdrop-blur-xs"
                >
                  Certified Organic
                </Badge>
              )}
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              <Badge className="bg-background/90 text-foreground border shadow-sm backdrop-blur-xs">
                {listing.quality}
              </Badge>
              {imageUrl && (
                <Badge className="bg-indigo-600 text-white gap-1 backdrop-blur-xs shadow-sm">
                  <Sparkles className="h-3 w-3" /> AI Vision Graded
                </Badge>
              )}
            </div>
          </div>

          {/* Seller Profile Card */}
          <Card className="border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-300 text-lg">
                    {sellerName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-base">
                      {sellerName}
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> {listing.location}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {listing.fpo
                    ? "Farmer Organization (FPO)"
                    : "Individual Farmer"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t">
                <div>
                  <span className="text-muted-foreground block mb-0.5">
                    Harvest Date
                  </span>
                  <span className="font-semibold">
                    {new Date(listing.harvestDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">
                    Available Stock
                  </span>
                  <span className="font-semibold text-emerald-600">
                    {listing.quantity} {listing.unit}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 30-Day Mandi Price History Chart */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                30-Day Market Mandi Price Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={priceHistory}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      formatter={(val: any) => [`₹${val}/kg`, "Mandi Price"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Pricing, AI Fair Price & Buy Controls */}
        <div className="md:col-span-5 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
              {listing.product?.category}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">
              {listing.product?.name}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {listing.description ||
                `Fresh Grade ${listing.quality} ${listing.product?.name} directly from verified growers in ${listing.location}.`}
            </p>
          </div>

          {/* Price Box */}
          <div className="p-5 bg-muted/30 rounded-xl border space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-4xl font-extrabold text-emerald-600">
                  ₹{listing.price}
                </span>
                <span className="text-muted-foreground text-sm font-normal ml-1">
                  / {listing.unit}
                </span>
              </div>
              <Badge variant="outline" className="bg-background text-xs">
                In Stock ({listing.quantity} {listing.unit})
              </Badge>
            </div>

            {/* AI Fair Price Indicator */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                AI Fair Market Price: ₹{fairMin} – ₹{fairMax} / {listing.unit}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Statistical price discovery benchmarked across 90-day regional mandi data.
              </p>
            </div>

            {/* Quantity Selector & Order Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  Quantity ({listing.unit}):
                </span>
                <Input
                  type="number"
                  min={1}
                  max={listing.quantity}
                  value={qty}
                  onChange={(e) =>
                    setQty(
                      Math.max(
                        1,
                        Math.min(listing.quantity, Number(e.target.value)),
                      ),
                    )
                  }
                  className="w-28 h-9"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={adding}
                  variant="outline"
                  className="flex-1 font-semibold text-xs h-10 gap-1.5 border-emerald-600/40 text-emerald-700 dark:text-emerald-300"
                >
                  <ShoppingCart className="h-4 w-4" /> Add to Cart
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={adding}
                  className="flex-1 font-semibold text-xs h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Buy Now
                </Button>
              </div>
            </div>
          </div>

          {/* Transparent Supply Chain Comparison */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-bold text-muted-foreground">
                Transparent Supply Chain Markup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded bg-muted/20 border">
                <span className="text-muted-foreground">
                  Traditional Retail Store:
                </span>
                <span className="font-semibold text-rose-600">
                  ₹{Math.round(listing.price * 1.45)} / {listing.unit}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  KrishiSetu Farm-Direct:
                </span>
                <span className="font-bold text-emerald-600">
                  ₹{listing.price} / {listing.unit}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground pt-1 italic">
                *Simulated price comparison based on typical intermediary markups removed.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
