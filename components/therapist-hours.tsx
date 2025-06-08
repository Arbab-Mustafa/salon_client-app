"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { useHours } from "@/context/hours-context";
import { toast } from "sonner";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";

export default function TherapistHours() {
  const { users, user } = useAuth();
  const { hours, addHours, getHoursForTherapist, calculateCommission } =
    useHours();

  const isOwner = user?.role === "owner";

  // State
  const [selectedTherapist, setSelectedTherapist] = useState<string>(
    isOwner ? "" : user?.id || ""
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [hoursWorked, setHoursWorked] = useState<string>("8");
  const [month, setMonth] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get start and end of selected month
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  // Get all days in the month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get therapist details with proper type checking
  const therapist = users.find((u) => u.id === selectedTherapist) || null;

  // Calculate commission for the selected month
  const commission = selectedTherapist
    ? calculateCommission(selectedTherapist, monthStart, monthEnd)
    : null;

  // Validate hours input
  const validateHours = (value: string): boolean => {
    const hours = Number.parseFloat(value);

    if (isNaN(hours)) {
      setInputError("Please enter a valid number");
      return false;
    }

    if (hours < 0) {
      setInputError("Hours cannot be negative");
      return false;
    }

    if (hours > 24) {
      setInputError("Hours cannot exceed 24");
      return false;
    }

    if (hours % 0.5 !== 0) {
      setInputError("Hours must be in 30-minute increments");
      return false;
    }

    setInputError(null);
    return true;
  };

  // Handle hours input change
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHoursWorked(value);
    validateHours(value);
  };

  // Handle adding hours
  const handleAddHours = async () => {
    if (!selectedTherapist) {
      toast.error("Please select a therapist");
      return;
    }

    if (!validateHours(hoursWorked)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addHours(
        selectedTherapist,
        format(selectedDate, "yyyy-MM-dd"),
        Number.parseFloat(hoursWorked)
      );
      toast.success(
        `Added ${hoursWorked} hours for ${therapist?.name} on ${format(
          selectedDate,
          "dd MMM yyyy"
        )}`
      );
      setHoursWorked("8"); // Reset to default
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add hours"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get hours for a specific day
  const getHoursForDay = (therapistId: string, date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    const entry = hours.find(
      (h) => h.therapistId === therapistId && h.date === dateString
    );
    return entry ? entry.hours : 0;
  };

  // Get total hours for the month
  const totalHours = selectedTherapist
    ? getHoursForTherapist(selectedTherapist, monthStart, monthEnd)
    : 0;

  // Get paginated hours data
  const getPaginatedHours = () => {
    if (!selectedTherapist) return { data: [], total: 0, totalPages: 1 };

    const therapistHours = hours
      .filter((h) => h.therapistId === selectedTherapist)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return {
      data: therapistHours.slice(startIndex, endIndex),
      total: therapistHours.length,
      totalPages: Math.ceil(therapistHours.length / itemsPerPage),
    };
  };

  // Add export functions
  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((header) => row[header]).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportHoursReport = () => {
    if (!selectedTherapist || !therapist?.name) return;

    const hoursData = hours
      .filter((h) => h.therapistId === selectedTherapist)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((entry) => ({
        Date: format(new Date(entry.date), "dd/MM/yyyy"),
        Hours: entry.hours,
      }));

    exportToCSV(
      hoursData,
      `${therapist.name}-hours-${format(month, "MMM-yyyy")}`
    );
  };

  const exportCommissionReport = () => {
    if (!selectedTherapist || !therapist?.name || !commission) return;

    const commissionData = [
      {
        "Report Period": format(month, "MMMM yyyy"),
        "Therapist Name": therapist.name,
        "Employment Type":
          therapist.employmentType === "employed"
            ? "Employed"
            : "Self-employed",
        "Total Revenue": `£${commission.revenue.toFixed(2)}`,
        "Hours Worked": commission.hours,
        ...(therapist.employmentType === "employed"
          ? {
              "Base Wage": `£${commission.wage.toFixed(2)}`,
              "Holiday Pay": `£${commission.holidayPay.toFixed(2)}`,
              "Employer NIC": `£${commission.employerNIC.toFixed(2)}`,
              Commission: `£${commission.commission.toFixed(2)}`,
              "Total Earnings": `£${commission.therapistShare.toFixed(2)}`,
              "Salon Revenue": `£${commission.salonShare.toFixed(2)}`,
            }
          : {
              "Therapist Share": `£${commission.therapistShare.toFixed(2)}`,
              "Salon Share": `£${commission.salonShare.toFixed(2)}`,
            }),
      },
    ];

    exportToCSV(
      commissionData,
      `${therapist.name}-commission-${format(month, "MMM-yyyy")}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Therapist Selection */}
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle>Therapist Hours & Commission</CardTitle>
          <CardDescription>
            Track hours worked and calculate commission for therapists
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="therapist">Select Therapist</Label>
              <Select
                value={selectedTherapist}
                onValueChange={setSelectedTherapist}
                disabled={!isOwner && user?.id !== selectedTherapist}
              >
                <SelectTrigger id="therapist" className="border-pink-200">
                  <SelectValue placeholder="Select a therapist" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => u.role === "therapist")
                    .map((therapist) => (
                      <SelectItem key={therapist.id} value={therapist.id}>
                        {therapist.name} (
                        {therapist.employmentType === "employed"
                          ? "Employed"
                          : "Self-employed"}
                        )
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="border-pink-200"
                  onClick={() => {
                    const prevMonth = new Date(month);
                    prevMonth.setMonth(prevMonth.getMonth() - 1);
                    setMonth(prevMonth);
                  }}
                >
                  Previous
                </Button>
                <span className="flex-1 text-center">
                  {format(month, "MMMM yyyy")}
                </span>
                <Button
                  variant="outline"
                  className="border-pink-200"
                  onClick={() => {
                    const nextMonth = new Date(month);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    setMonth(nextMonth);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          {selectedTherapist && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Add Hours for a Specific Day</Label>
                <div className="mt-2 border rounded-md p-2 border-pink-200">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    month={month}
                    onMonthChange={setMonth}
                    className="rounded-md border-0"
                    modifiers={{
                      hasHours: (date) =>
                        getHoursForDay(selectedTherapist, date) > 0,
                    }}
                    modifiersClassNames={{
                      hasHours: "bg-pink-100 font-bold text-pink-800",
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="hours">
                    Hours Worked on {format(selectedDate, "dd MMM yyyy")}
                  </Label>
                  <div className="flex flex-col space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Input
                        id="hours"
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={hoursWorked}
                        onChange={handleHoursChange}
                        className={`border-pink-200 ${
                          inputError ? "border-red-500" : ""
                        }`}
                        disabled={isSubmitting}
                      />
                      <Button
                        className="bg-pink-600 hover:bg-pink-700"
                        onClick={handleAddHours}
                        disabled={isSubmitting || !!inputError}
                      >
                        {isSubmitting ? "Adding..." : "Add Hours"}
                      </Button>
                    </div>
                    {inputError && (
                      <p className="text-sm text-red-500">{inputError}</p>
                    )}
                    {getHoursForDay(selectedTherapist, selectedDate) > 0 && (
                      <p className="text-sm text-pink-600">
                        Currently logged:{" "}
                        {getHoursForDay(selectedTherapist, selectedDate)} hours
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-pink-100">
                  <h3 className="font-medium mb-2">
                    Hours Summary for {format(month, "MMMM yyyy")}
                  </h3>
                  <p>
                    Total Hours: <span className="font-bold">{totalHours}</span>
                  </p>

                  {therapist?.employmentType === "employed" &&
                    therapist.hourlyRate && (
                      <p className="mt-1">
                        Base Wage:{" "}
                        <span className="font-bold">
                          £{(totalHours * therapist.hourlyRate).toFixed(2)}
                        </span>
                      </p>
                    )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Calculation */}
      {selectedTherapist && commission && (
        <Card className="border-pink-200">
          <CardHeader>
            <CardTitle>Commission Calculation for {therapist?.name}</CardTitle>
            <CardDescription>{format(month, "MMMM yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Total Revenue</TableCell>
                  <TableCell className="text-right font-medium">
                    £{commission.revenue.toFixed(2)}
                  </TableCell>
                </TableRow>

                {therapist?.employmentType === "employed" ? (
                  <>
                    <TableRow>
                      <TableCell>Hours Worked</TableCell>
                      <TableCell className="text-right">
                        {commission.hours}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        Base Wage (£{therapist.hourlyRate}/hr)
                      </TableCell>
                      <TableCell className="text-right">
                        £{commission.wage.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Holiday Pay (12%)</TableCell>
                      <TableCell className="text-right">
                        £{commission.holidayPay.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Employer NIC (13.8%)</TableCell>
                      <TableCell className="text-right">
                        £{commission.employerNIC.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Commission (10% after costs)</TableCell>
                      <TableCell className="text-right">
                        £{commission.commission.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-pink-50">
                      <TableCell className="font-bold">
                        Total Therapist Earnings
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        £{commission.therapistShare.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-pink-50">
                      <TableCell className="font-bold">Salon Revenue</TableCell>
                      <TableCell className="text-right font-bold">
                        £{commission.salonShare.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  <>
                    <TableRow>
                      <TableCell>Therapist Share (40%)</TableCell>
                      <TableCell className="text-right">
                        £{commission.therapistShare.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-pink-50">
                      <TableCell className="font-bold">
                        Salon Share (60%)
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        £{commission.salonShare.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-pink-200"
              onClick={exportHoursReport}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Hours Report
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-pink-200"
              onClick={exportCommissionReport}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Commission Report
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Hours Log */}
      {selectedTherapist &&
        hours.filter((h) => h.therapistId === selectedTherapist).length > 0 && (
          <Card className="border-pink-200">
            <CardHeader>
              <CardTitle>Hours Log for {therapist?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPaginatedHours().data.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {format(new Date(entry.date), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.hours}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {getPaginatedHours().totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      getPaginatedHours().total
                    )}{" "}
                    of {getPaginatedHours().total} entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="border-pink-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {getPaginatedHours().totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(getPaginatedHours().totalPages, p + 1)
                        )
                      }
                      disabled={currentPage === getPaginatedHours().totalPages}
                      className="border-pink-200"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
    </div>
  );
}
