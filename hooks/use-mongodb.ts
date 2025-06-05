import { useState, useCallback } from "react";

interface MongoDBResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface MongoDBOptions {
  operation: string;
  model: string;
  data?: any;
  query?: any;
  options?: any;
}

export function useMongoDB() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeOperation = useCallback(
    async <T>({
      operation,
      model,
      data,
      query,
      options,
    }: MongoDBOptions): Promise<MongoDBResponse<T>> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/mongodb", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            operation,
            model,
            data,
            query,
            options,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "An error occurred");
        }

        return result;
      } catch (err: any) {
        setError(err.message);
        return {
          success: false,
          error: err.message,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Convenience methods for common operations
  const create = useCallback(
    <T>(model: string, data: any) => {
      return executeOperation<T>({
        operation: "create",
        model,
        data,
      });
    },
    [executeOperation]
  );

  const findById = useCallback(
    <T>(model: string, id: string) => {
      return executeOperation<T>({
        operation: "findById",
        model,
        data: { id },
      });
    },
    [executeOperation]
  );

  const findOne = useCallback(
    <T>(model: string, query: any) => {
      return executeOperation<T>({
        operation: "findOne",
        model,
        query,
      });
    },
    [executeOperation]
  );

  const find = useCallback(
    <T>(model: string, query: any = {}, options: any = {}) => {
      return executeOperation<T>({
        operation: "find",
        model,
        query,
        options,
      });
    },
    [executeOperation]
  );

  const update = useCallback(
    <T>(model: string, id: string, data: any) => {
      return executeOperation<T>({
        operation: "update",
        model,
        data: { id, ...data },
      });
    },
    [executeOperation]
  );

  const remove = useCallback(
    <T>(model: string, id: string) => {
      return executeOperation<T>({
        operation: "delete",
        model,
        data: { id },
      });
    },
    [executeOperation]
  );

  // Custom operations
  const findUserByUsername = useCallback(
    <T>(username: string) => {
      return executeOperation<T>({
        operation: "findByUsername",
        model: "user",
        data: { username },
      });
    },
    [executeOperation]
  );

  const findCustomerByMobile = useCallback(
    <T>(mobile: string) => {
      return executeOperation<T>({
        operation: "findByMobile",
        model: "customer",
        data: { mobile },
      });
    },
    [executeOperation]
  );

  const getTransactionsByDateRange = useCallback(
    <T>(startDate: Date, endDate: Date) => {
      return executeOperation<T>({
        operation: "findByDateRange",
        model: "transaction",
        data: { startDate, endDate },
      });
    },
    [executeOperation]
  );

  const getTherapistHoursByDateRange = useCallback(
    <T>(therapistId: string, startDate: Date, endDate: Date) => {
      return executeOperation<T>({
        operation: "findByDateRange",
        model: "therapistHours",
        data: { therapistId, startDate, endDate },
      });
    },
    [executeOperation]
  );

  return {
    loading,
    error,
    executeOperation,
    create,
    findById,
    findOne,
    find,
    update,
    remove,
    findUserByUsername,
    findCustomerByMobile,
    getTransactionsByDateRange,
    getTherapistHoursByDateRange,
  };
}
