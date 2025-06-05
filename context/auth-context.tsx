"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type EmploymentType = "employed" | "self-employed";

export interface User {
  _id: string;
  id?: string; // for frontend mapping if needed
  username: string;
  name: string;
  email: string;
  role: string;
  active?: boolean;
  employmentType?: EmploymentType;
  hourlyRate?: number;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  users: User[];
  addUser: (
    user: Omit<User, "_id" | "createdAt" | "updatedAt"> & { password: string }
  ) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users from the API
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/users");
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, []);

  const addUser = async (
    userData: Omit<User, "_id" | "createdAt" | "updatedAt"> & {
      password: string;
    }
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error("Failed to add user");
      const newUser = await response.json();
      setUsers((prev) => [...prev, newUser]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (id: string, userData: Partial<User>) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...userData }),
      });
      if (!response.ok) throw new Error("Failed to update user");
      const updatedUser = await response.json();
      setUsers((prev) => prev.map((u) => (u._id === id ? updatedUser : u)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("Failed to delete user");
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        users,
        addUser,
        updateUser,
        deleteUser,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
