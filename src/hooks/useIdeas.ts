import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import { Database } from "@/lib/supabase/types";

export type IdeaRow = Database["public"]["Tables"]["ideas"]["Row"] & {
  author: { name: string | null; avatar_url: string | null } | null;
  votes_count: number;
  comments_count: number;
  reactions_count: number;
  user_reaction_emoji?: string | null;
  position?: { x: number; y: number } | null;
};

export function useIdeas(sessionId: string) {
  const supabase = createSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["ideas", sessionId],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const { data, error } = await supabase
        .from("ideas")
        .select(`
          *,
          author:profiles!ideas_author_id_fkey(name, avatar_url),
          idea_votes(user_id),
          idea_comments(id),
          idea_reactions(id, emoji, user_id),
          positions:idea_positions(x, y)
        `)
        .eq("session_id", sessionId);

      if (error) throw error;
      
      // format votes count, positions, and author correctly from join
      return data.map((idea: any) => {
        const votesArr = idea.idea_votes || [];
        const commentsArr = idea.idea_comments || [];
        const reactionsArr = idea.idea_reactions || [];

        // Find if current user reacted
        const userReaction = userId
          ? reactionsArr.find((r: any) => r.user_id === userId)?.emoji || null
          : null;

        return {
          ...idea,
          votes_count: votesArr.length,
          comments_count: commentsArr.length,
          reactions_count: reactionsArr.length,
          user_reaction_emoji: userReaction,
          author: Array.isArray(idea.author) ? idea.author[0] : idea.author,
          position: Array.isArray(idea.positions) ? idea.positions[0] : idea.positions
        };
      }) as IdeaRow[];
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "idea_positions",
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
          table: "idea_comments",
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
          table: "idea_reactions",
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
