import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  CheckCircle2,
  ShieldCheck,
  Truck,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import api from "@/services/api";

export default function Checkout() {
  const { items, cartTotal, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  const [address, setAddress] = useState({
    name: user?.name || "Verified Buyer",
    street: "Plot 45, Scheme 78, Vijay Nagar",
    city: "Indore",
    state: "Madhya Pradesh",
    pinCode: "452010",
  });

  const deliveryFee = 40;
  const total = cartTotal + deliveryFee;

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const res = await api.post("/orders", {
        address: address.street,
        city: address.city,
        state: address.state,
        pin: address.pinCode,
        deliveryOption: "STANDARD",
      });
      setCreatedOrder(res.data);
      await refreshCart();
      setStep(3); // Success step
      toast({
        title: "Order Placed Successfully!",
        description:
          "Inventory updated, delivery request created, and farmer notified.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Order Placement Failed",
        description: error.response?.data?.error || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    const targetDashboard =
      user?.role === "CONSUMER"
        ? "/consumer/orders"
        : user?.role === "BULK_BUYER"
          ? "/buyer"
          : user?.role === "FARMER"
            ? "/farmer/orders"
            : "/marketplace";

    return (
      <div className="container mx-auto px-4 py-20 max-w-xl text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-full border-2 border-emerald-500">
            <CheckCircle2 className="h-16 w-16 text-emerald-600" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Order Confirmed!
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Order Ref:{" "}
            <span className="font-mono font-bold text-foreground">
              #{createdOrder?.id?.slice(-8).toUpperCase()}
            </span>
          </p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your order has been routed directly to the farm producers. Delivery
          tracking has been initiated via Agriflow logistics network.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(targetDashboard)}>
            Track Order Status
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => navigate("/marketplace")}
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Checkout</h1>
        <p className="text-muted-foreground text-sm">
          Direct fulfillment settlement and delivery destination.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Address */}
          <Card
            className={`border shadow-sm ${step !== 1 ? "opacity-80" : ""}`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>1. Shipping Destination</span>
                {step > 1 && (
                  <Badge variant="outline" className="text-xs text-emerald-600">
                    Saved
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Contact Name</Label>
                  <Input
                    value={address.name}
                    onChange={(e) =>
                      setAddress({ ...address, name: e.target.value })
                    }
                    disabled={step !== 1}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">PIN Code</Label>
                  <Input
                    value={address.pinCode}
                    onChange={(e) =>
                      setAddress({ ...address, pinCode: e.target.value })
                    }
                    disabled={step !== 1}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Street Address / Receiving Depot
                </Label>
                <Input
                  value={address.street}
                  onChange={(e) =>
                    setAddress({ ...address, street: e.target.value })
                  }
                  disabled={step !== 1}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">City</Label>
                  <Input
                    value={address.city}
                    onChange={(e) =>
                      setAddress({ ...address, city: e.target.value })
                    }
                    disabled={step !== 1}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">State</Label>
                  <Input
                    value={address.state}
                    onChange={(e) =>
                      setAddress({ ...address, state: e.target.value })
                    }
                    disabled={step !== 1}
                  />
                </div>
              </div>
              {step === 1 && (
                <Button
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setStep(2)}
                >
                  Continue to Commercial Payment{" "}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Payment Simulation */}
          <Card
            className={`border shadow-sm ${step !== 2 ? "opacity-60" : ""}`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                2. Demo Payment Simulation
              </CardTitle>
              <CardDescription>
                Instant escrow settlement simulation for Hackathon prototype
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 2 && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between font-semibold text-sm">
                      <span>Agriflow Instant Escrow Settle</span>
                      <Badge className="bg-emerald-600 text-[10px]">
                        Demo Mode Active
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Funds are held in simulated smart contract escrow and
                      settled directly to verified farmer bank accounts upon
                      digital delivery signature.
                    </p>
                  </div>

                  <Button
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    onClick={handlePlaceOrder}
                    disabled={loading}
                  >
                    {loading
                      ? "Confirming Escrow..."
                      : `Authorize & Settle Order (₹${total.toLocaleString("en-IN")})`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Order Items ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="divide-y max-h-56 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-foreground">
                        {item.listing?.product?.name}
                      </div>
                      <div className="text-muted-foreground">
                        {item.quantity} {item.listing?.unit} @ ₹
                        {item.listing?.price}/{item.listing?.unit}
                      </div>
                    </div>
                    <div className="font-bold text-sm">
                      ₹
                      {(
                        (item.listing?.price || 0) * item.quantity
                      ).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shared Transit Logistics</span>
                  <span>₹{deliveryFee}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total Payout</span>
                <span className="text-emerald-600">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
