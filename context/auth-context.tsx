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
  active: boolean;
  employmentType?: EmploymentType;
  hourlyRate?: number;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  addUser: (userData: Partial<User> & { password: string }) => Promise<void>;
  updateUser: (id: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users from the API
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/users");
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const updateUser = async (id: string, userData: Partial<User>) => {
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          ...userData,
          // Ensure active is always a boolean
          active:
            userData.active !== undefined
              ? Boolean(userData.active)
              : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user");
      }

      const updatedUser = await response.json();
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u._id === id ? updatedUser : u))
      );

      // If updating current user, update user state
      if (user?._id === id) {
        setUser(updatedUser);
      }
    } catch (error: any) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  const addUser = async (userData: Partial<User> & { password: string }) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...userData,
          // Ensure active is always a boolean
          active:
            userData.active !== undefined ? Boolean(userData.active) : true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add user");
      }

      const newUser = await response.json();
      setUsers((prevUsers) => [...prevUsers, newUser]);
    } catch (error: any) {
      console.error("Error adding user:", error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        loading,
        error,
        login: async (username: string, password: string) => {
          // Implementation of login function
        },
        logout: async () => {
          // Implementation of logout function
        },
        addUser,
        updateUser,
        deleteUser,
        refreshUsers: async () => {
          // Implementation of refreshUsers function
        },
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
