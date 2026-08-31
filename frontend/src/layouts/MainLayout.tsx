import React from "react";
import { Link, Outlet } from "react-router-dom";
import { ShoppingCart, Sprout, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MainLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { cartCount } = useCart();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center mx-auto px-4">
          <Link to="/" className="flex items-center space-x-2 mr-6">
            <Sprout className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block text-xl">
              Agriflow
            </span>
          </Link>

          <nav className="flex items-center space-x-6 text-sm font-medium flex-1">
            <Link
              to="/marketplace"
              className="transition-colors hover:text-foreground/80"
            >
              Marketplace
            </Link>
            <Link
              to="/about"
              className="transition-colors hover:text-foreground/80"
            >
              About
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary text-[10px]">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  to={
                    user?.role === "FARMER"
                      ? "/farmer"
                      : user?.role === "CONSUMER"
                        ? "/consumer"
                        : user?.role === "BULK_BUYER"
                          ? "/buyer"
                          : user?.role === "FPO"
                            ? "/fpo"
                            : user?.role === "LOGISTICS"
                              ? "/logistics"
                              : "/admin"
                  }
                >
                  <Button variant="outline">Dashboard</Button>
                </Link>
                <Button variant="ghost" onClick={logout}>
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row mx-auto px-4">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built for fairer prices and a shorter supply chain. © 2026 Agriflow.
          </p>
        </div>
      </footer>
    </div>
  );
}
