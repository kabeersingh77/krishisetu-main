import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/services/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "FARMER" | "CONSUMER" | "BULK_BUYER" | "FPO" | "LOGISTICS" | "ADMIN";
  verified: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("Agriflow_token"),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // In a real app we'd validate the token with /api/auth/me
          // For demo, we decode or use stored user data
          const storedUser = localStorage.getItem("Agriflow_user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } catch (error) {
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("Agriflow_token", newToken);
    localStorage.setItem("Agriflow_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("Agriflow_token");
    localStorage.removeItem("Agriflow_user");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
