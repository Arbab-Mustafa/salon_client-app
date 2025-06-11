// components/pos-interface.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Receipt,
  Percent,
  Tag,
  X,
  User,
  Users,
  UserCheck,
} from "lucide-react";
import { useServices } from "@/context/service-context";
import { type ServiceCategory, CATEGORY_LABELS } from "@/types/services";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { useCustomers } from "@/context/customer-context";
import { CustomerSelector } from "@/components/customer-selector";
import { TherapistSelector } from "@/components/therapist-selector";
import { useSession } from "next-auth/react";
import { OnScreenKeyboard } from "@/components/on-screen-keyboard";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
};

type DiscountType = "none" | "percentage" | "voucher" | "custom";

export default function PosInterface() {
  const { getActiveServicesByCategory } = useServices();
  const { data: session } = useSession();
  const user = session?.user as { id: string; name: string; role: string };
  const { users } = useAuth();
  const { customers, updateLastVisit } = useCustomers();
  const [activeCategory, setActiveCategory] =
    useState<ServiceCategory>("facials");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>("none");
  const [discountPercentage, setDiscountPercentage] = useState<
    "5" | "10" | "20"
  >("10");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherAmount, setVoucherAmount] = useState("");
  const [customDiscountAmount, setCustomDiscountAmount] = useState("");
  const [showDiscountOptions, setShowDiscountOptions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState<{
    id: string;
    name: string;
  } | null>(
    user && user.role !== "manager" && user.id && user.name
      ? { id: user.id, name: user.name }
      : null
  );
  const [showTherapistSelector, setShowTherapistSelector] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeKeyboardField, setActiveKeyboardField] = useState<
    "voucherCode" | "voucherAmount" | null
  >(null);

  const categories = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    id: value as ServiceCategory,
    name: label,
  }));

  const addToCart = (product: {
    id: string;
    name: string;
    price: number;
    category?: string;
  }) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + change) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setShowPaymentOptions(false);
    setDiscountType("none");
    setVoucherCode("");
    setVoucherAmount("");
    setCustomDiscountAmount("");
    setShowDiscountOptions(false);
    setSelectedCustomer(null);
    if (user?.role === "manager") {
      setSelectedTherapist(null);
    }
  };

  const handleCheckout = () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer before checkout");
      return;
    }

    if (!selectedTherapist) {
      toast.error("Please select a therapist before checkout");
      return;
    }

    setShowPaymentOptions(true);
  };

  const handlePayment = async (method: string) => {
    if (
      !selectedCustomer ||
      typeof selectedCustomer !== "object" ||
      !selectedCustomer.id ||
      typeof selectedCustomer.id !== "string" ||
      !selectedCustomer.name
    ) {
      toast.error("Please select or create a valid customer before payment");
      return;
    }

    if (
      !selectedTherapist ||
      !selectedTherapist.id ||
      !selectedTherapist.name
    ) {
      toast.error("Please select a therapist before payment");
      return;
    }

    // Find full customer and therapist data
    const customerData = customers.find((c) => c.id === selectedCustomer.id);
    const therapistData = users.find((u) => u.id === selectedTherapist.id);
    // Find owner (if needed)
    const ownerData = users.find((u) => u.role === "owner");

    // Prepare items array - NO item-level discounts, keep it simple
    const items = cart.map((item) => {
      return {
        name: item.name,
        category: item.category || "unknown",
        price: item.price,
        quantity: item.quantity,
        discount: 0, // No item-level discounts
      };
    });

    const transactionData = {
      date: new Date(),
      customer: {
        id: selectedCustomer.id,
        name: selectedCustomer.name,
        phone: customerData?.phone || "",
        email: customerData?.email || "",
      },
      therapist: {
        id: selectedTherapist.id,
        name: selectedTherapist.name,
        role: therapistData?.role || "therapist",
      },
      owner: ownerData
        ? {
            id: ownerData.id,
            name: ownerData.name,
            role: ownerData.role,
          }
        : undefined,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discountAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      paymentMethod: method.toLowerCase(),
    };

    // Debug logging
    console.log("Transaction data being sent:", {
      subtotal: transactionData.subtotal,
      discount: transactionData.discount,
      total: transactionData.total,
      discountType,
      discountPercentage:
        discountType === "percentage" ? discountPercentage : null,
      voucherCode: discountType === "voucher" ? voucherCode : null,
      voucherAmount: discountType === "voucher" ? voucherAmount : null,
    });

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData),
      });

      if (res.ok) {
        const responseData = await res.json();
        console.log("Transaction created successfully:", responseData);

        let discountMessage = "";
        if (discountAmount > 0) {
          if (discountType === "percentage") {
            discountMessage = ` (${discountPercentage}% discount applied: -£${discountAmount.toFixed(2)})`;
          } else if (discountType === "voucher") {
            discountMessage = ` (Voucher ${voucherCode} applied: -£${discountAmount.toFixed(2)})`;
          }
        }

        toast.success(
          `Payment of £${total.toFixed(2)} processed via ${method} for ${selectedCustomer.name} by ${selectedTherapist.name}${discountMessage}. Thank you!`
        );
        await updateLastVisit(selectedCustomer.id);
        clearCart();
      } else {
        const errorData = await res.json();
        console.error("Transaction error:", errorData);
        toast.error(
          `Failed to process transaction: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Network error during transaction:", error);
      toast.error("Network error occurred. Please try again.");
    }
  };

  const applyVoucher = () => {
    if (!voucherCode.trim()) {
      toast.error("Please enter a voucher code");
      return;
    }

    const amount = Number(voucherAmount);
    if (!voucherAmount.trim() || isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid voucher amount");
      return;
    }

    if (amount > subtotal) {
      toast.error("Voucher amount cannot exceed cart subtotal");
      return;
    }

    toast.success(`Voucher ${voucherCode} applied for £${amount.toFixed(2)}`);
    setDiscountType("voucher");
    setVoucherAmount(amount.toFixed(2)); // Ensure consistent formatting
    setShowDiscountOptions(false);
  };

  const applyCustomDiscount = () => {
    const amount = Number(customDiscountAmount);
    if (!customDiscountAmount.trim() || isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid discount amount");
      return;
    }

    if (amount > subtotal) {
      toast.error("Discount amount cannot exceed cart subtotal");
      return;
    }

    toast.success(`Custom discount of £${amount.toFixed(2)} applied`);
    setDiscountType("custom");
    setCustomDiscountAmount(amount.toFixed(2));
    setShowDiscountOptions(false);
  };

  const removeDiscount = () => {
    setDiscountType("none");
    setVoucherCode("");
    setVoucherAmount("");
    setCustomDiscountAmount("");
  };

  const categoryServices = getActiveServicesByCategory(activeCategory);

  const filteredServices = searchQuery
    ? Object.values(categories)
        .flatMap((category) => getActiveServicesByCategory(category.id))
        .filter((service) =>
          service.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : categoryServices;

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  let discountAmount = 0;
  if (discountType === "percentage") {
    discountAmount =
      Math.round(subtotal * (Number(discountPercentage) / 100) * 100) / 100;
  } else if (discountType === "voucher" && voucherAmount) {
    const voucherValue = Number(voucherAmount);
    discountAmount = Math.min(voucherValue, subtotal);
    // Ensure we don't have floating point precision issues
    discountAmount = Math.round(discountAmount * 100) / 100;
  } else if (discountType === "custom" && customDiscountAmount) {
    const customValue = Number(customDiscountAmount);
    discountAmount = Math.min(customValue, subtotal);
    discountAmount = Math.round(discountAmount * 100) / 100;
  }

  const total = Math.max(
    0,
    Math.round((subtotal - discountAmount) * 100) / 100
  );

  const topPadding = user?.role === "manager" ? "mt-0" : "mt-20";

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${topPadding} transition-all duration-300`}
    >
      {/* Product Selection */}
      <div
        className={
          showKeyboard
            ? "lg:col-span-1 transition-all duration-300"
            : "lg:col-span-2 transition-all duration-300"
        }
      >
        <Card className="border-pink-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search services & products..."
                  className="pl-8 border-pink-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {searchQuery ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredServices.map((service) => (
                  <Button
                    key={service.id}
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center text-center p-2 border-pink-200 hover:bg-pink-50"
                    onClick={() => addToCart(service)}
                  >
                    <span className="font-medium">{service.name}</span>
                    <span className="text-sm text-muted-foreground mt-1">
                      £{service.price.toFixed(2)}
                    </span>
                  </Button>
                ))}
              </div>
            ) : (
              <Tabs
                defaultValue="facial"
                value={activeCategory}
                onValueChange={(value) =>
                  setActiveCategory(value as ServiceCategory)
                }
              >
                <TabsList className="flex flex-wrap mb-6 h-auto p-1 bg-pink-50">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="flex-1 py-3 border-2 border-transparent data-[state=active]:border-pink-300 data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800 data-[state=active]:shadow-sm m-1 rounded-md"
                    >
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {categories.map((category) => (
                  <TabsContent
                    key={category.id}
                    value={category.id}
                    className="m-0 border-2 border-pink-200 p-4 rounded-lg"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {getActiveServicesByCategory(category.id).map(
                        (service) => (
                          <Button
                            key={service.id}
                            variant="outline"
                            className="h-24 flex flex-col items-center justify-center text-center p-2 border-pink-200 hover:bg-pink-50"
                            onClick={() => addToCart(service)}
                          >
                            <span className="font-medium">{service.name}</span>
                            <span className="text-sm text-muted-foreground mt-1">
                              £{service.price.toFixed(2)}
                            </span>
                          </Button>
                        )
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cart & Checkout */}
      <div
        className={
          showKeyboard
            ? "transition-all duration-300 lg:col-span-2"
            : "transition-all duration-300"
        }
      >
        <Card className="border-pink-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-base">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Cart
              </CardTitle>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 text-xs"
                  onClick={clearCart}
                >
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent
            className="flex flex-col p-2"
            style={{ height: "auto", minHeight: "310px" }}
          >
            <div className="flex-grow">
              {cart.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Your cart is empty
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-450px)] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b border-pink-100 pb-2"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          £{item.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center ml-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                          <span className="sr-only">Decrease</span>
                        </Button>
                        <span className="w-6 text-center text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                          <span className="sr-only">Increase</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Selection */}
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Customer</Label>
                {selectedCustomer && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 text-xs text-gray-500"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="mt-1">
                {selectedCustomer ? (
                  <div className="flex items-center justify-between p-1.5 bg-pink-50 rounded-md">
                    <div className="flex items-center min-w-0">
                      <User className="h-3.5 w-3.5 mr-1.5 text-pink-600 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">
                        {selectedCustomer.name}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs ml-2 flex-shrink-0"
                      onClick={() => setShowCustomerSelector(true)}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-muted-foreground h-8 text-sm"
                    onClick={() => setShowCustomerSelector(true)}
                  >
                    <Users className="mr-1.5 h-3.5 w-3.5" />
                    Select Customer
                  </Button>
                )}
              </div>
            </div>

            {/* Discount Options */}
            {cart.length > 0 && !showPaymentOptions && (
              <div className="mt-2">
                {!showDiscountOptions && discountType === "none" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-pink-600 border-pink-200 h-6 text-sm"
                    onClick={() => setShowDiscountOptions(true)}
                  >
                    <Percent className="mr-1.5 h-3 w-3" />
                    Add Discount or Voucher
                  </Button>
                ) : (
                  showDiscountOptions && (
                    <div className="space-y-1 p-2 bg-pink-50 rounded-md">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-medium text-pink-800">
                          Apply Discount
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-gray-400"
                          onClick={() => setShowDiscountOptions(false)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Close</span>
                        </Button>
                      </div>
                      <div className="grid gap-1.5">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="discount-percentage"
                            className="text-xs"
                          >
                            Percentage Discount
                          </Label>
                          <div className="flex gap-1">
                            {["5", "10", "20"].map((percent) => (
                              <Button
                                key={percent}
                                type="button"
                                size="sm"
                                variant={
                                  discountPercentage === percent &&
                                  discountType === "percentage"
                                    ? "default"
                                    : "outline"
                                }
                                className={
                                  discountPercentage === percent &&
                                  discountType === "percentage"
                                    ? "h-6 min-w-[36px] bg-pink-600 hover:bg-pink-700 text-xs"
                                    : "h-6 min-w-[36px] border-pink-200 text-xs"
                                }
                                onClick={() => {
                                  setDiscountPercentage(
                                    percent as "5" | "10" | "20"
                                  );
                                  setDiscountType("percentage");
                                  setShowDiscountOptions(false);
                                }}
                              >
                                {percent}%
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 pt-1.5 border-t border-pink-100">
                          <Label htmlFor="voucher-code" className="text-xs">
                            Voucher Code
                          </Label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <Input
                              id="voucher-code"
                              placeholder="Enter code"
                              value={voucherCode}
                              onChange={(e) => setVoucherCode(e.target.value)}
                              className="border-pink-200 h-6 text-sm"
                              onFocus={() => {
                                setActiveKeyboardField("voucherCode");
                              }}
                              onClick={() => {
                                setActiveKeyboardField("voucherCode");
                              }}
                            />
                            <Input
                              id="voucher-amount"
                              placeholder="Amount (£)"
                              type="number"
                              min="0"
                              step="0.01"
                              value={voucherAmount}
                              onChange={(e) => setVoucherAmount(e.target.value)}
                              className="border-pink-200 h-6 text-sm"
                              onFocus={() => {
                                setActiveKeyboardField("voucherAmount");
                              }}
                              onClick={() => {
                                setActiveKeyboardField("voucherAmount");
                              }}
                            />
                          </div>
                          <div className="flex gap-2 mt-1">
                            <Button
                              size="sm"
                              className="bg-pink-600 hover:bg-pink-700 h-7 text-sm flex-1"
                              onClick={applyVoucher}
                            >
                              Apply Voucher
                            </Button>
                            <Button
                              type="button"
                              variant={showKeyboard ? "default" : "outline"}
                              size="sm"
                              className={`transition-all duration-200 text-xs flex-1 ${
                                showKeyboard
                                  ? "bg-pink-600 hover:bg-pink-700 text-white"
                                  : "border-pink-300 text-pink-600 hover:bg-pink-50"
                              }`}
                              onClick={() => {
                                setShowKeyboard(!showKeyboard);
                                if (!showKeyboard && activeKeyboardField) {
                                  // If showing keyboard and we have an active field, keep it active
                                  // Otherwise, default to voucher code
                                  setActiveKeyboardField(
                                    activeKeyboardField || "voucherCode"
                                  );
                                }
                              }}
                            >
                              <span className="mr-1">⌨️</span>
                              {showKeyboard ? "Hide Keyboard" : "Show Keyboard"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Keyboard and Checkout/Payment Options Split Area */}
            {(showKeyboard || showPaymentOptions) && (
              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                {/* Left: On-Screen Keyboard */}
                {showKeyboard && (
                  <div className="w-full sm:w-1/2 basis-1/2 flex-1 bg-pink-50 rounded-md p-2 border border-pink-100">
                    <OnScreenKeyboard
                      onKeyPress={(key) => {
                        if (!activeKeyboardField) return;
                        let currentValue =
                          activeKeyboardField === "voucherCode"
                            ? voucherCode
                            : voucherAmount;
                        let newValue = currentValue;
                        if (key === "backspace") {
                          newValue = currentValue.slice(0, -1);
                        } else if (key === "space") {
                          newValue = currentValue + " ";
                        } else if (key === "clear") {
                          newValue = "";
                        } else {
                          // Only allow numbers and dot for amount, any char for code
                          if (
                            activeKeyboardField === "voucherAmount" &&
                            !/^[0-9.]$/.test(key)
                          )
                            return;
                          if (
                            activeKeyboardField === "voucherAmount" &&
                            key === "." &&
                            currentValue.includes(".")
                          )
                            return;
                          newValue = currentValue + key;
                        }
                        if (activeKeyboardField === "voucherCode") {
                          setVoucherCode(newValue);
                        } else {
                          setVoucherAmount(newValue);
                        }
                      }}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="flex-1 border-pink-200"
                        onClick={() => setActiveKeyboardField("voucherCode")}
                        variant={
                          activeKeyboardField === "voucherCode"
                            ? "default"
                            : "outline"
                        }
                      >
                        Edit Code
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 border-pink-200"
                        onClick={() => setActiveKeyboardField("voucherAmount")}
                        variant={
                          activeKeyboardField === "voucherAmount"
                            ? "default"
                            : "outline"
                        }
                      >
                        Edit Amount
                      </Button>
                    </div>
                  </div>
                )}
                {/* Right: Totals and Checkout/Payment Options */}
                <div className="w-full sm:w-1/2 basis-1/2 flex-1 flex flex-col justify-between">
                  {/* Totals Section */}
                  <div className="mb-4">
                    {cart.length > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-gray-600 pt-2 border-t border-pink-100">
                          <span>Subtotal</span>
                          <span>£{subtotal.toFixed(2)}</span>
                        </div>
                        {discountType !== "none" && discountAmount > 0 && (
                          <div className="flex justify-between text-sm text-pink-600 mt-1">
                            <span className="flex items-center">
                              {discountType === "percentage" ? (
                                <>
                                  <Percent className="mr-1 h-3 w-3" />
                                  {discountPercentage}% Discount
                                </>
                              ) : discountType === "voucher" ? (
                                <>
                                  <Tag className="mr-1 h-3 w-3" />
                                  Voucher: {voucherCode}
                                </>
                              ) : (
                                <>
                                  <Percent className="mr-1 h-3 w-3" />
                                  Custom Discount
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-1 text-gray-400 hover:text-red-500"
                                onClick={removeDiscount}
                              >
                                <X className="h-2.5 w-2.5" />
                                <span className="sr-only">Remove discount</span>
                              </Button>
                            </span>
                            <span>-£{discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium text-base mt-2 pt-2 border-t border-pink-200">
                          <span>Total</span>
                          <span>£{total.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {/* Checkout/Payment Buttons */}
                  {showPaymentOptions ? (
                    <div className="w-full space-y-2">
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 h-9 text-sm"
                        onClick={() => handlePayment("Card")}
                      >
                        <CreditCard className="mr-1.5 h-4 w-4" />
                        Pay with Card
                      </Button>
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 h-9 text-sm"
                        onClick={() => handlePayment("Cash")}
                      >
                        <Banknote className="mr-1.5 h-4 w-4" />
                        Pay with Cash
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full h-9 text-sm"
                        onClick={() => setShowPaymentOptions(false)}
                      >
                        Back to Cart
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-pink-600 hover:bg-pink-700 h-9 text-sm"
                      disabled={cart.length === 0}
                      onClick={handleCheckout}
                    >
                      <Receipt className="mr-1.5 h-4 w-4" />
                      Checkout
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Total (hidden when keyboard is open) */}
            {!showKeyboard && (
              <div className="mt-auto">
                {cart.length > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-gray-600 pt-2 border-t border-pink-100">
                      <span>Subtotal</span>
                      <span>£{subtotal.toFixed(2)}</span>
                    </div>
                    {discountType !== "none" && discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-pink-600 mt-1">
                        <span className="flex items-center">
                          {discountType === "percentage" ? (
                            <>
                              <Percent className="mr-1 h-3 w-3" />
                              {discountPercentage}% Discount
                            </>
                          ) : discountType === "voucher" ? (
                            <>
                              <Tag className="mr-1 h-3 w-3" />
                              Voucher: {voucherCode}
                            </>
                          ) : (
                            <>
                              <Percent className="mr-1 h-3 w-3" />
                              Custom Discount
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 text-gray-400 hover:text-red-500"
                            onClick={removeDiscount}
                          >
                            <X className="h-2.5 w-2.5" />
                            <span className="sr-only">Remove discount</span>
                          </Button>
                        </span>
                        <span>-£{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium text-base mt-2 pt-2 border-t border-pink-200">
                      <span>Total</span>
                      <span>£{total.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            )}
            {/* Checkout/Payment Button (hidden when keyboard is open) */}
            {!showPaymentOptions && !showKeyboard && (
              <CardFooter className="p-3">
                <Button
                  className="w-full bg-pink-600 hover:bg-pink-700 h-9 text-sm"
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                >
                  <Receipt className="mr-1.5 h-4 w-4" />
                  Checkout
                </Button>
              </CardFooter>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Selector Modal */}
      {showCustomerSelector && (
        <CustomerSelector
          onSelect={(customer) => {
            setSelectedCustomer(customer);
            setShowCustomerSelector(false);
          }}
          onClose={() => setShowCustomerSelector(false)}
          therapistId={selectedTherapist?.id || user?.id || ""}
        />
      )}

      {/* Therapist Selector Modal */}
      {showTherapistSelector && (
        <TherapistSelector
          onSelect={(therapist) => {
            setSelectedTherapist(therapist);
            setShowTherapistSelector(false);
          }}
          onClose={() => setShowTherapistSelector(false)}
        />
      )}
    </div>
  );
}
