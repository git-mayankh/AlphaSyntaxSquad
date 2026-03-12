import { useQuery } from "@tanstack/react-query";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";

export type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];

export function useSessionData(sessionId: string) {
  const supabase = createSupabaseClient();

  return useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      
      if (error) throw error;
      return data as SessionRow;
    },
    enabled: !!sessionId,
  });
}
