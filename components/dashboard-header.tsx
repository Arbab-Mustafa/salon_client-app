"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  ShoppingCart,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Users,
  Scissors,
  UserCircle,
  Clock,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Logo from "./logo";

export default function DashboardHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  // Main nav links
  const navLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <Home className="mr-1 h-5 w-5" />,
    },
    {
      href: "/users",
      label: "Users",
      icon: <Users className="mr-1 h-5 w-5" />,
    },
    {
      href: "/services",
      label: "Services",
      icon: <Scissors className="mr-1 h-5 w-5" />,
    },
    {
      href: "/hours",
      label: "Hours",
      icon: <Clock className="mr-1 h-5 w-5" />,
    },
    {
      href: "/pos",
      label: "Checkout",
      icon: <ShoppingCart className="mr-1 h-5 w-5" />,
    },
    {
      href: "/customers",
      label: "Customers",
      icon: <UserCircle className="mr-1 h-5 w-5" />,
    },
    {
      href: "/reports",
      label: "Reports",
      icon: <BarChart3 className="mr-1 h-5 w-5" />,
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-pink-200 z-20">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <Link
            href={session?.user?.role === "owner" ? "/dashboard" : "/pos"}
            className="flex items-center"
          >
            <Logo width={100} height={30} className="mr-3" />
          </Link>
        </div>
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center text-pink-600 font-medium hover:text-pink-800 transition px-2 py-1"
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
        {/* Profile Dropdown */}
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-4 p-2 rounded-full hover:bg-pink-50 transition">
                <User className="h-6 w-6 text-pink-600" />
                <span className="sr-only">User menu</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {session?.user?.name || "User"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Mobile Menu Button */}
          <button
            className="md:hidden ml-2 p-2 rounded-full hover:bg-pink-50 transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-pink-600" />
            ) : (
              <Menu className="h-6 w-6 text-pink-600" />
            )}
          </button>
        </div>
      </div>
      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-white border-t border-pink-100 py-2 shadow">
          <div className="container mx-auto px-4 space-y-1 flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center text-pink-600 font-medium hover:text-pink-800 transition px-2 py-2 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
