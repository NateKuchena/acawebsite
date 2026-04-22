import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// Generic fetcher for Supabase queries
export function useSupabaseQuery<T>(
  key: string | null,
  query: () => Promise<{ data: T | null; error: unknown }>,
  options?: {
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
    refreshInterval?: number;
  }
) {
  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {
      const { data, error } = await query();
      if (error) throw error;
      return data;
    },
    {
      revalidateOnFocus: options?.revalidateOnFocus ?? false,
      revalidateOnReconnect: options?.revalidateOnReconnect ?? true,
      refreshInterval: options?.refreshInterval,
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

// Pre-built hooks for common queries
export function useStudents(status?: string) {
  return useSupabaseQuery(
    `students-${status || "all"}`,
    async () => {
      let query = supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      return query.limit(100);
    }
  );
}

export function useStudent(id: string) {
  return useSupabaseQuery(
    id ? `student-${id}` : null,
    async () => supabase.from("students").select("*").eq("id", id).single()
  );
}

export function useEmployees(status?: string) {
  return useSupabaseQuery(
    `employees-${status || "all"}`,
    async () => {
      let query = supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      return query.limit(100);
    }
  );
}

export function useAssets(status?: string) {
  return useSupabaseQuery(
    `assets-${status || "all"}`,
    async () => {
      let query = supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      return query.limit(100);
    }
  );
}

export function useFeeCategories() {
  return useSupabaseQuery("fee-categories", async () =>
    supabase.from("fee_categories").select("*").order("name")
  );
}

export function useExpenseCategories() {
  return useSupabaseQuery("expense-categories", async () =>
    supabase.from("expense_categories").select("*").order("name")
  );
}
