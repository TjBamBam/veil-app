import { createContext, useContext, ReactNode } from "react";
import type { User } from""../types/app";

interface AuthContextType {
  user: User | null;
  login: (id: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("Auth context not found");
  return context;
};
