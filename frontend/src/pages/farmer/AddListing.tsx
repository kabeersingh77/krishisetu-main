import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, ArrowRight, CheckCircle2, TrendingUp, Info, HelpCircle, AlertCircle } from 'lucide-react';
import api from '@/services/api';

const CROPS = [
  'Tomato', 'Potato', 'Onion', 'Wheat', 'Soybean', 'Rice', 'Chilli', 'Cauliflower', 'Cabbage', 'Mango'
];

const LOCATIONS = [
  'Indore', 'Dewas', 'Bhopal', 'Ujjain', 'Jabalpur', 'Nagpur', 'Jaipur', 'Delhi'
];

export default function AddListing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);

  // Form State
  const [crop, setCrop] = useState('Tomato');
  const [quantity, setQuantity] = useState(250);
  const [quality, setQuality] = useState('Grade A');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('Indore');
  const [price, setPrice] = useState<number | ''>('');
  const [organic, setOrganic] = useState(false);
  const [description, setDescription] = useState('');

  // AI State
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiRec, setAiRec] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await api.get('/products');
        setProducts(res.data || []);
      } catch (e) {
        console.error(e);
      }
    }
    loadProducts();
  }, []);

  const handleGetAiRecommendation = async () => {
    setLoadingAi(true);
    try {
      const res = await api.post('/ai/price-recommendation', {
        crop,
        quantity: Number(quantity),
        quality,
        location,
        harvestDate
      });
      setAiRec(res.data);
      if (price === '') {
        setPrice(res.data.recommendedPrice);
      }
      toast({
        title: 'AI Price Engine Calculated',
        description: `Recommended Fair Price: ₹${res.data.recommendedPrice}/kg (Confidence: ${res.data.confidence}%)`,
      });
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Price Engine Notice',
        description: e.response?.data?.error || 'Could not calculate AI price recommendation',
        variant: 'destructive',
      });
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || Number(price) <= 0) {
      toast({ title: 'Validation Error', description: 'Please enter a valid selling price', variant: 'destructive' });
      return;
    }

    const matchedProduct = products.find(p => p.name.toLowerCase() === crop.toLowerCase());
    if (!matchedProduct) {
      toast({ title: 'Error', description: 'Product not registered in catalog', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/listings', {
        productId: matchedProduct.id,
        quantity: Number(quantity),
        price: Number(price),
        quality,
        harvestDate,
        location,
        organic,
        description
      });
      toast({
        title: 'Listing Published Successfully',
        description: `${quantity} kg of ${quality} ${crop} is now active on the direct marketplace.`,
      });
      navigate('/farmer/listings');
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Failed to create listing',
        description: e.response?.data?.error || 'Server error',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">List Fresh Produce</h1>
        <p className="text-muted-foreground text-sm">Directly sell to consumers, restaurants, and bulk buyers with AI fair pricing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Produce Specifications</CardTitle>
              <CardDescription>Enter harvest and batch details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Crop Name</Label>
                    <Select value={crop} onValueChange={setCrop}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Crop" />
                      </SelectTrigger>
                      <SelectContent>
                        {CROPS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quality Grade</Label>
                    <Select value={quality} onValueChange={setQuality}>
                      <SelectTrigger>
                        <SelectValue placeholder="Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Grade A">Grade A (Premium / Export)</SelectItem>
                        <SelectItem value="Grade B">Grade B (Standard Market)</SelectItem>
                        <SelectItem value="Grade C">Grade C (Processing / Economy)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Available Quantity (kg)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Farm Location</Label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Location" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Harvest Date</Label>
                  <Input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    required
                  />
                </div>

                {/* AI Price Button trigger */}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetAiRecommendation}
                    disabled={loadingAi}
                    className="w-full border-emerald-600/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 gap-2 font-medium"
                  >
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    {loadingAi ? 'Analyzing Market Supply & Demand...' : 'Get AI Fair Price Recommendation'}
                  </Button>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label>Your Listing Price (₹ / kg)</Label>
                    {aiRec && (
                      <span className="text-xs text-emerald-600 font-medium">
                        Suggested: ₹{aiRec.priceRange?.min} - ₹{aiRec.priceRange?.max}
                      </span>
                    )}
                  </div>
                  <Input
                    type="number"
                    step="0.5"
                    min={1}
                    placeholder="e.g. 45"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id="organic" checked={organic} onCheckedChange={(v) => setOrganic(Boolean(v))} />
                  <label htmlFor="organic" className="text-sm font-medium leading-none cursor-pointer">
                    Certified Organic Produce (No synthetic pesticides)
                  </label>
                </div>

                <div className="space-y-2">
                  <Label>Description / Storage Notes (Optional)</Label>
                  <Textarea
                    placeholder="E.g. Freshly harvested Roma tomatoes from Dewas road farm. Graded and packed in clean crates."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  {submitting ? 'Publishing...' : 'Publish Listing on Marketplace'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* AI Explainability Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card className={`border shadow-sm transition-all ${aiRec ? 'border-emerald-500/50 bg-emerald-50/10' : 'bg-muted/10'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  KrishiSetu AI Price Engine
                </CardTitle>
                {aiRec && (
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Confidence: {aiRec.confidence}%
                  </Badge>
                )}
              </div>
              <CardDescription>Multi-factor statistical supply-demand pricing model</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!aiRec ? (
                <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                  <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                  Click <strong>"Get AI Fair Price Recommendation"</strong> to calculate optimal market value based on 90-day mandi prices, local supply ratio, and seasonal trends.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Recommended Price Box */}
                  <div className="p-4 rounded-lg bg-emerald-100/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                    <div className="text-xs uppercase font-bold text-emerald-800 dark:text-emerald-300">AI Recommended Price</div>
                    <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 my-1">
                      ₹{aiRec.recommendedPrice} <span className="text-sm font-normal text-muted-foreground">/ kg</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Fair Range: ₹{aiRec.priceRange?.min} – ₹{aiRec.priceRange?.max}
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="text-xs font-semibold">Demand Velocity:</span>
                      <Badge className={
                        aiRec.demandLevel === 'VERY_HIGH' ? 'bg-red-500' :
                        aiRec.demandLevel === 'HIGH' ? 'bg-emerald-600' :
                        aiRec.demandLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-slate-500'
                      }>
                        {aiRec.demandLevel}
                      </Badge>
                    </div>
                  </div>

                  {/* Explainability Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Why this price?</h4>
                    <div className="space-y-2">
                      {aiRec.factors?.map((f: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-background border">
                          <span className="font-medium text-foreground">{f.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-[11px]">{f.value}</span>
                            <span className={`font-semibold ${f.direction === 'up' ? 'text-emerald-600' : f.direction === 'down' ? 'text-rose-600' : 'text-slate-600'}`}>
                              {f.impact}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Explanation */}
                  <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border leading-relaxed">
                    <strong>Model Explanation:</strong> {aiRec.explanation}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPrice(aiRec.recommendedPrice)}
                    className="w-full text-xs font-medium"
                  >
                    Accept AI Price (₹{aiRec.recommendedPrice}/kg)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
