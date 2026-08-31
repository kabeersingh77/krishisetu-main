import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sprout, TrendingUp, Truck, ShieldCheck, Map, HandCoins, Building2, Store, ArrowRight, ArrowRightCircle, LineChart, Route } from 'lucide-react';
import api from '@/services/api';

export default function Landing() {
  const [impactMetrics, setImpactMetrics] = useState({
    farmersConnected: '5,000+',
    produceTraded: '12,000 MT',
    ordersFulfilled: '45,000+',
    avgFarmerIncrease: '75%'
  });

  useEffect(() => {
    // Attempt to fetch real metrics if backend is running
    api.get('/analytics/impact').then(res => {
      if (res.data) {
        setImpactMetrics({
          farmersConnected: `${res.data.farmersConnected}+`,
          produceTraded: `${(res.data.produceTraded / 1000).toFixed(1)} MT`,
          ordersFulfilled: `${res.data.directTransactions}+`,
          avgFarmerIncrease: `+${res.data.farmerRealizationImprovement}%`
        });
      }
    }).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative px-6 py-24 md:py-32 overflow-hidden border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-5xl text-center space-y-8">
          <span className="inline-block rounded-full border bg-primary/10 text-primary hover:bg-primary/20 mb-4 px-3 py-1 text-sm border-primary/20 font-semibold">
            KrishiSetu Direct Sourcing Architecture
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Fairer prices begin with a <span className="text-emerald-600">shorter supply chain.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            KrishiSetu connects farmers and FPOs directly with consumers and bulk buyers while using intelligent pricing, demand forecasting, and logistics optimization to make agricultural commerce more efficient.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
            <Link to="/marketplace">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-lg bg-emerald-600 hover:bg-emerald-700 text-white">
                Explore Marketplace
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-lg">
                Sell Your Produce
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto h-12 px-8 text-lg">
                Buy in Bulk
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Problem - Supply Chain Comparison */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Why the Traditional System Fails</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Too many intermediaries mean farmers earn less while consumers pay more.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900">
              <CardContent className="p-8 space-y-6">
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Traditional Chain (6 Intermediary Tiers)</h3>
                <div className="flex flex-col gap-2">
                  <ChainStep name="Farmer" price="₹20/kg" />
                  <ArrowRightCircle className="h-4 w-4 mx-auto text-muted-foreground/50 rotate-90" />
                  <ChainStep name="Local Village Trader" price="₹25/kg" />
                  <ArrowRightCircle className="h-4 w-4 mx-auto text-muted-foreground/50 rotate-90" />
                  <ChainStep name="Mandi Wholesaler" price="₹35/kg" />
                  <ArrowRightCircle className="h-4 w-4 mx-auto text-muted-foreground/50 rotate-90" />
                  <ChainStep name="Regional Distributor" price="₹45/kg" />
                  <ArrowRightCircle className="h-4 w-4 mx-auto text-muted-foreground/50 rotate-90" />
                  <ChainStep name="City Retailer" price="₹55/kg" />
                  <ArrowRightCircle className="h-4 w-4 mx-auto text-muted-foreground/50 rotate-90" />
                  <ChainStep name="Consumer Pays" price="₹60/kg" highlight />
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-md">
              <CardContent className="p-8 space-y-6">
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">KrishiSetu Direct Architecture</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center p-4 bg-background rounded-lg shadow-sm border border-border">
                    <span className="font-semibold text-lg">Farmer / FPO</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">Earns ₹35/kg (+75%)</span>
                  </div>
                  <div className="flex justify-center">
                    <div className="h-24 w-1 bg-gradient-to-b from-emerald-500 to-emerald-500 flex items-center justify-center relative">
                      <div className="absolute bg-background p-2 rounded-full border shadow-sm">
                        <Sprout className="h-5 w-5 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-background rounded-lg shadow-sm border border-border">
                    <span className="font-semibold text-lg">Consumer / Bulk Buyer</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">Pays ₹42/kg (-30%)</span>
                  </div>
                </div>
                <div className="pt-6 mt-6 border-t text-center">
                  <p className="font-semibold text-lg">4 Intermediaries Removed.</p>
                  <p className="text-muted-foreground">Farmers earn 75% more. Consumers save 30%.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold">Platform Capabilities</h2>
            <p className="text-muted-foreground text-lg">Technology that empowers agricultural commerce.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon={Store} title="Direct Marketplace" desc="Connect directly with farmers and FPOs for transparent sourcing." />
            <FeatureCard icon={TrendingUp} title="AI Price Engine" desc="Data-driven pricing algorithms ensure fair transactions for everyone." />
            <FeatureCard icon={LineChart} title="Demand Forecasting" desc="Predict market demand to reduce post-harvest waste." />
            <FeatureCard icon={Route} title="Smart Logistics" desc="Optimized delivery routes for faster, cost-effective transport." />
            <FeatureCard icon={Building2} title="Bulk Procurement" desc="Streamlined purchasing flows tailored for institutional buyers." />
            <FeatureCard icon={ShieldCheck} title="Quality Assurance" desc="Standardized grading systems build trust in every transaction." />
          </div>
        </div>
      </section>

      {/* Impact Metrics */}
      <section className="py-20 px-6 bg-emerald-600 text-white">
        <div className="container mx-auto max-w-6xl text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Platform Impact</h2>
            <p className="text-emerald-100">Prototype simulation based on platform transaction data</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Metric title="Farmers Connected" value={impactMetrics.farmersConnected} />
            <Metric title="Produce Traded" value={impactMetrics.produceTraded} />
            <Metric title="Orders Fulfilled" value={impactMetrics.ordersFulfilled} />
            <Metric title="Farmer Income Growth" value={impactMetrics.avgFarmerIncrease} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-3xl space-y-12">
          <h2 className="text-3xl font-bold text-center">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How does the AI pricing engine work?</AccordionTrigger>
              <AccordionContent>
                Our AI analyzes historical market data, real-time demand, local weather conditions, and seasonal trends to suggest a fair price range. This prevents extreme price manipulation by middlemen and ensures farmers get fair compensation.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Who handles the logistics?</AccordionTrigger>
              <AccordionContent>
                KrishiSetu partners with local logistics providers and delivery agents. Our Route Optimizer ensures that pick-ups and drop-offs are clustered efficiently to minimize transit time and costs.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Is it only for bulk buyers?</AccordionTrigger>
              <AccordionContent>
                No. KrishiSetu serves both individual consumers buying weekly groceries and bulk buyers (restaurants, institutions) procuring tons of produce. The platform automatically routes these differently to optimize the supply chain.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-muted text-center border-t">
        <div className="container mx-auto max-w-2xl space-y-8">
          <h2 className="text-4xl font-bold">Join KrishiSetu today</h2>
          <p className="text-xl text-muted-foreground">Experience the future of agricultural commerce.</p>
          <Link to="/register">
            <Button size="lg" className="h-12 px-8 text-lg bg-emerald-600 hover:bg-emerald-700 text-white">Create an Account</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function ChainStep({ name, price, highlight }: { name: string, price: string, highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center p-3 rounded-md border ${highlight ? 'bg-red-100 dark:bg-red-900 border-red-300' : 'bg-background border-border'}`}>
      <span className="font-medium">{name}</span>
      <span className={`font-semibold ${highlight ? 'text-red-700 dark:text-red-300' : ''}`}>{price}</span>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <Card className="border-border bg-card hover:shadow-md transition-shadow">
      <CardContent className="p-6 space-y-4">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}

function Metric({ title, value }: { title: string, value: string }) {
  return (
    <div className="space-y-2">
      <h4 className="text-4xl md:text-5xl font-extrabold">{value}</h4>
      <p className="text-emerald-100 font-medium">{title}</p>
    </div>
  );
}
