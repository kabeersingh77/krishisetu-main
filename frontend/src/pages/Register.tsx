import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  Sprout,
  ShoppingCart,
  User,
  Building2,
  Truck,
  Users,
} from "lucide-react";
import api from "@/services/api";

const ROLES = [
  {
    id: "CONSUMER",
    label: "Retail Consumer",
    desc: "Buy fresh produce directly from farms",
    icon: ShoppingCart,
  },
  {
    id: "FARMER",
    label: "Farmer / Producer",
    desc: "List harvest & get AI price recommendations",
    icon: Sprout,
  },
  {
    id: "BULK_BUYER",
    label: "Bulk Buyer",
    desc: "Restaurants, hotels & institutions",
    icon: Building2,
  },
  {
    id: "FPO",
    label: "FPO Collective",
    desc: "Farmer Producer Organizations",
    icon: Users,
  },
  {
    id: "LOGISTICS",
    label: "Logistics Partner",
    desc: "Delivery fleet & transport agents",
    icon: Truck,
  },
];

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "CONSUMER",
    phone: "",
    location: "Indore",
    farmName: "",
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { ...formData };
      if (formData.role === "FARMER" || formData.role === "FPO") {
        payload.farmName = formData.farmName || `${formData.name}'s Farm`;
        payload.farmLocation = formData.location || "Indore";
        payload.lat = 22.7196;
        payload.lng = 75.8577;
      }
      const res = await api.post("/auth/register", payload);
      login(res.data.token, res.data.user);
      toast({
        title: "Registration Successful!",
        description: `Welcome to Agriflow, ${res.data.user.name} (${formData.role})`,
      });

      const rolePaths: Record<string, string> = {
        FARMER: "/farmer",
        CONSUMER: "/consumer",
        BULK_BUYER: "/buyer",
        FPO: "/fpo",
        LOGISTICS: "/logistics",
        ADMIN: "/admin",
      };
      navigate(rolePaths[res.data.user.role] || "/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description:
          error.response?.data?.error || "Could not register account",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center mx-auto px-4 py-10">
      <Card className="w-full max-w-xl border shadow-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Sprout className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Create Agriflow Account
          </CardTitle>
          <CardDescription>
            Select your account type to access role-tailored agricultural tools
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-6">
            {/* Visual Role Cards Selector */}
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">
                What would you like to join as?
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = formData.role === r.id;
                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setFormData({ ...formData, role: r.id })}
                      className={`p-3 rounded-lg border text-left transition-all flex items-start gap-3 ${isSelected ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-sm ring-1 ring-emerald-600" : "bg-background hover:bg-muted/50 border-border"}`}
                    >
                      <div
                        className={`p-2 rounded-md ${isSelected ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-foreground">
                          {r.label}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {r.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">
                  Full Name / Contact Person
                </Label>
                <Input
                  id="name"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            {(formData.role === "FARMER" || formData.role === "FPO") && (
              <div className="space-y-1.5">
                <Label htmlFor="farmName" className="text-xs">
                  Farm Name / Cooperative Org
                </Label>
                <Input
                  id="farmName"
                  placeholder="e.g. Patel Organic Farms"
                  value={formData.farmName}
                  onChange={(e) =>
                    setFormData({ ...formData, farmName: e.target.value })
                  }
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs">
                  City / Hub Location
                </Label>
                <Input
                  id="location"
                  required
                  placeholder="e.g. Indore, Bhopal"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="Create a secure password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : `Register as ${ROLES.find((r) => r.id === formData.role)?.label}`}
            </Button>
            <div className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="underline font-semibold hover:text-foreground"
              >
                Sign In
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
