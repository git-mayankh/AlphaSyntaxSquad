import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import { Database } from "@/lib/supabase/types";

export type IdeaRow = Database["public"]["Tables"]["ideas"]["Row"] & {
  author: { name: string | null; avatar_url: string | null } | null;
  votes_count: number;
};

export function useIdeas(sessionId: string) {
  const supabase = createSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["ideas", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideas")
        .select(`
          *,
          author:profiles!ideas_author_id_fkey(name, avatar_url),
          votes:idea_votes(count)
        `)
        .eq("session_id", sessionId);

      if (error) throw error;
      
      // format votes count and author correctly from join
      return data.map((idea: any) => ({
        ...idea,
        votes_count: idea.votes?.[0]?.count || 0,
        author: Array.isArray(idea.author) ? idea.author[0] : idea.author
      })) as IdeaRow[];
    },
    enabled: !!sessionId,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!sessionId) return;
    
    const channel = supabase
      .channel(`ideas-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ideas",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ideas", sessionId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "idea_votes",
        },
        () => {
           queryClient.invalidateQueries({ queryKey: ["ideas", sessionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient, supabase]);

  return query;
}
