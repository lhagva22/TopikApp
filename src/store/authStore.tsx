import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserStatus = "guest" | "free" | "paid";

export interface User {
  id: string;
  email: string;
  name: string;
  status: "guest" | "free" | "paid";
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  subscriptionMonths?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradeToPaid: (months: number) => Promise<void>;
  getDaysRemaining: () => number;
  getTotalDays: () => number;
  getDaysUsed: () => number;
  getSubscriptionProgress: () => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: "topik_user",
  USERS: "topik_users",
} as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from AsyncStorage on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        // Convert date strings back to Date objects
        if (parsedUser.subscriptionStartDate) {
          parsedUser.subscriptionStartDate = new Date(parsedUser.subscriptionStartDate);
        }
        if (parsedUser.subscriptionEndDate) {
          parsedUser.subscriptionEndDate = new Date(parsedUser.subscriptionEndDate);
        }
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save user to AsyncStorage whenever it changes
  const saveUser = async (userData: User | null) => {
    try {
      if (userData) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const login = async (email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    try {
      // Mock login - check if user exists in AsyncStorage
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const users = usersData ? JSON.parse(usersData) : {};
      
      if (users[email] && users[email].password === password) {
        const userData = users[email];
        const newUser: User = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          status: userData.status || "free",
          subscriptionStartDate: userData.subscriptionStartDate 
            ? new Date(userData.subscriptionStartDate) 
            : undefined,
          subscriptionEndDate: userData.subscriptionEndDate 
            ? new Date(userData.subscriptionEndDate) 
            : undefined,
          subscriptionMonths: userData.subscriptionMonths,
        };
        setUser(newUser);
        await saveUser(newUser);
      } else {
        throw new Error("Имэйл эсвэл нууц үг буруу байна");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    try {
      // Mock registration
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const users = usersData ? JSON.parse(usersData) : {};
      
      if (users[email]) {
        throw new Error("Энэ имэйл хаягаар бүртгэл үүссэн байна");
      }
      
      const newUser = {
        id: Date.now().toString(),
        email,
        password,
        name,
        status: "free" as UserStatus,
      };
      
      users[email] = newUser;
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      
      const userWithoutPassword = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        status: newUser.status,
      };
      
      setUser(userWithoutPassword);
      await saveUser(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    await saveUser(null);
  };

  const upgradeToPaid = async (months: number) => {
    if (!user) return;
    
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months);
      
      const updatedUser: User = { 
        ...user, 
        status: "paid",
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
        subscriptionMonths: months,
      };
      
      setUser(updatedUser);
      await saveUser(updatedUser);
      
      // Update in users database
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const users = usersData ? JSON.parse(usersData) : {};
      if (users[user.email]) {
        users[user.email].status = "paid";
        users[user.email].subscriptionStartDate = startDate.toISOString();
        users[user.email].subscriptionEndDate = endDate.toISOString();
        users[user.email].subscriptionMonths = months;
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      throw error;
    }
  };

  const getDaysRemaining = () => {
    if (!user?.subscriptionEndDate) return 0;
    
    const now = new Date();
    const endDate = new Date(user.subscriptionEndDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const getTotalDays = () => {
    if (!user?.subscriptionStartDate || !user?.subscriptionEndDate) return 0;
    
    const startDate = new Date(user.subscriptionStartDate);
    const endDate = new Date(user.subscriptionEndDate);
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getDaysUsed = () => {
    if (!user?.subscriptionStartDate) return 0;
    
    const now = new Date();
    const startDate = new Date(user.subscriptionStartDate);
    const diffTime = now.getTime() - startDate.getTime();
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    const totalDays = getTotalDays();
    return Math.min(diffDays, totalDays);
  };

  const getSubscriptionProgress = () => {
    const totalDays = getTotalDays();
    const daysUsed = getDaysUsed();
    
    if (totalDays === 0) return 0;
    
    return Math.round((daysUsed / totalDays) * 100);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        upgradeToPaid,
        getDaysRemaining,
        getTotalDays,
        getDaysUsed,
        getSubscriptionProgress,
      }}
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