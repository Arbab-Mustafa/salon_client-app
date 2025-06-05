"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export default function BrandingPage() {
  const [logo, setLogo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch("/api/settings/logo");
        if (!response.ok) throw new Error("Failed to fetch logo");
        const data = await response.json();
        setLogo(data.logo || "");
      } catch (error) {
        console.error("Error fetching logo:", error);
        toast({
          title: "Error",
          description: "Failed to fetch logo settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogo();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/settings/logo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logo }),
      });

      if (!response.ok) throw new Error("Failed to update logo");

      toast({
        title: "Success",
        description: "Logo settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating logo:", error);
      toast({
        title: "Error",
        description: "Failed to update logo settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Branding Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="logo" className="block text-sm font-medium mb-2">
            Logo URL
          </label>
          <Input
            id="logo"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            placeholder="Enter logo URL"
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          Save Changes
        </Button>
      </form>
    </div>
  );
}
