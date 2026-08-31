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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/components/ui/use-toast";
import { Sprout, UserCheck, ShieldCheck } from "lucide-react";
import api from "@/services/api";

const DEMO_ACCOUNTS = [
  {
    role: "Farmer",
    email: "farmer@Agriflow.demo",
    name: "Rajesh Patel (Indore)",
  },
  {
    role: "Consumer",
    email: "consumer@Agriflow.demo",
    name: "Priya Verma (Bhopal)",
  },
  {
    role: "Bulk Buyer",
    email: "buyer@Agriflow.demo",
    name: "Hotel Spice Garden",
  },
  {
    role: "FPO Collective",
    email: "fpo@Agriflow.demo",
    name: "Narmada Valley FPO",
  },
  {
    role: "Logistics Partner",
    email: "logistics@Agriflow.demo",
    name: "Suresh Transport",
  },
  {
    role: "Administrator",
    email: "admin@Agriflow.demo",
    name: "Platform Admin",
  },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (
    e?: React.FormEvent,
    customEmail?: string,
    customPass?: string,
  ) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: loginEmail,
        password: loginPass,
      });
      login(res.data.token, res.data.user);
      toast({
        title: "Welcome to Agriflow",
        description: `Signed in as ${res.data.user.name} (${res.data.user.role})`,
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
        title: "Login Failed",
        description: error.response?.data?.error || "Invalid credentials",
      });
    } finally {
      setLoading(false);
    }
  };

  const useDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Demo@123");
    handleLogin(undefined, demoEmail, "Demo@123");
  };

  return (
    <div className="container min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center mx-auto px-4 py-8">
      <Card className="w-full max-w-md border shadow-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Sprout className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Sign In to Agriflow
          </CardTitle>
          <CardDescription>
            Direct Agricultural Marketplace Access
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@Agriflow.demo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <span className="text-xs text-muted-foreground hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-center text-xs text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="underline font-semibold hover:text-foreground"
              >
                Register Here
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Demo Credentials Box */}
      <div className="mt-6 w-full max-w-md">
        <Card className="border bg-muted/30">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              1-Click Demo Accounts (Password: Demo@123)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 gap-2 mt-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <Button
                  key={acc.email}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 px-2.5 flex flex-col items-start text-left hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40"
                  onClick={() => useDemoAccount(acc.email)}
                >
                  <span className="font-semibold text-xs text-foreground">
                    {acc.role}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate w-full">
                    {acc.name}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
