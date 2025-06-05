// Only export types and pure utility functions from this file

export interface TransactionItem {
  name: string;
  category: string;
  price: number;
  quantity: number;
  discount: number;
}

export interface TransactionData {
  id?: string;
  date: Date;
  customer: { id: string; name: string; phone?: string; email?: string };
  therapist: { id: string; name: string; role: string };
  owner: { id: string; name: string; role: string };
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
}

// Pure grouping/utility functions (no DB access)
export const groupTransactionsByTherapist = (
  transactions: TransactionData[]
) => {
  const grouped: Record<
    string,
    {
      therapistId: string;
      totalAmount: number;
      transactionCount: number;
      transactions: TransactionData[];
    }
  > = {};

  transactions.forEach((transaction) => {
    if (!grouped[transaction.therapist]) {
      grouped[transaction.therapist] = {
        therapistId: transaction.therapistId,
        totalAmount: 0,
        transactionCount: 0,
        transactions: [],
      };
    }

    grouped[transaction.therapist].totalAmount +=
      transaction.amount - transaction.discount;
    grouped[transaction.therapist].transactionCount += 1;
    grouped[transaction.therapist].transactions.push(transaction);
  });

  return grouped;
};

export const groupTransactionsByCustomer = (
  transactions: TransactionData[]
) => {
  const grouped: Record<
    string,
    {
      totalAmount: number;
      transactionCount: number;
      transactions: TransactionData[];
    }
  > = {};

  transactions.forEach((transaction) => {
    if (!grouped[transaction.customer]) {
      grouped[transaction.customer] = {
        totalAmount: 0,
        transactionCount: 0,
        transactions: [],
      };
    }

    grouped[transaction.customer].totalAmount +=
      transaction.amount - transaction.discount;
    grouped[transaction.customer].transactionCount += 1;
    grouped[transaction.customer].transactions.push(transaction);
  });

  return grouped;
};

export const groupTransactionsByService = (transactions: TransactionData[]) => {
  const grouped: Record<
    string,
    {
      totalAmount: number;
      transactionCount: number;
      transactions: TransactionData[];
      category: string;
    }
  > = {};

  transactions.forEach((transaction) => {
    if (!grouped[transaction.service]) {
      grouped[transaction.service] = {
        totalAmount: 0,
        transactionCount: 0,
        transactions: [],
        category: transaction.category,
      };
    }

    grouped[transaction.service].totalAmount +=
      transaction.amount - transaction.discount;
    grouped[transaction.service].transactionCount += 1;
    grouped[transaction.service].transactions.push(transaction);
  });

  return grouped;
};

export const groupTransactionsByCategory = (
  transactions: TransactionData[]
) => {
  const grouped: Record<
    string,
    {
      totalAmount: number;
      transactionCount: number;
      transactions: TransactionData[];
    }
  > = {};

  transactions.forEach((transaction) => {
    if (!grouped[transaction.category]) {
      grouped[transaction.category] = {
        totalAmount: 0,
        transactionCount: 0,
        transactions: [],
      };
    }

    grouped[transaction.category].totalAmount +=
      transaction.amount - transaction.discount;
    grouped[transaction.category].transactionCount += 1;
    grouped[transaction.category].transactions.push(transaction);
  });

  return grouped;
};

// You may also keep getDateRange if it is pure (does not use DB)
export const getDateRange = (
  period: "day" | "week" | "month" | "year",
  date: Date = new Date()
) => {
  const startDate = new Date(date);
  const endDate = new Date(date);

  switch (period) {
    case "day":
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "week":
      const day = startDate.getDay();
      startDate.setDate(startDate.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "month":
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "year":
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setMonth(11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return { startDate, endDate };
};

// Helper function to get unique customers
export const getUniqueCustomers = async () => {
  const customers = await Transaction.distinct("customer");
  return customers.sort();
};

// Helper function to get unique therapists
export const getUniqueTherapists = async () => {
  const therapists = await Transaction.distinct("therapist");
  return therapists.sort();
};

// Helper function to get unique services
export const getUniqueServices = async () => {
  const services = await Transaction.distinct("service");
  return services.sort();
};

// Helper function to get unique categories
export const getUniqueCategories = async () => {
  const categories = await Transaction.distinct("category");
  return categories.sort();
};

// Helper function to add a transaction
export const addTransaction = async (
  transaction: Omit<TransactionData, "id">
) => {
  const newTransaction = await Transaction.create(transaction);
  return newTransaction;
};

// Helper function to get top customers for a therapist
export const getTopCustomersForTherapist = async (
  therapistId: string,
  limit = 10
) => {
  const result = await Transaction.aggregate([
    { $match: { therapistId } },
    {
      $group: {
        _id: "$customer",
        totalAmount: { $sum: { $subtract: ["$amount", "$discount"] } },
        transactionCount: { $sum: 1 },
      },
    },
    { $sort: { totalAmount: -1 } },
    { $limit: limit },
  ]);

  return result.map((item) => ({
    customer: item._id,
    totalAmount: item.totalAmount,
    transactionCount: item.transactionCount,
  }));
};
