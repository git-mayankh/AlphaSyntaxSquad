import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";

export type Organization = Database["public"]["Tables"]["organizations"]["Row"] & {
  member_count?: number;
};

export function useOrganizations() {
  const supabase = createSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch orgs where user is member
      const { data, error } = await supabase
        .from("organizations")
        .select(`
          *,
          members:organization_members!inner(user_id),
          all_members:organization_members(count)
        `)
        .eq("members.user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return data.map((org: any) => ({
        ...org,
        member_count: org.all_members?.[0]?.count || 1
      })) as Organization[];
    }
  });

  const createOrgMutation = useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate a simple unique share code (e.g., ORG-1A2B3C)
      const shareCode = `ORG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { data, error } = await supabase
        .from("organizations")
        .insert({
          name,
          share_code: shareCode,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Automatically add creator as a member
      await supabase
        .from("organization_members")
        .insert({
          org_id: data.id,
          user_id: user.id,
          role: "admin"
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    }
  });

  const joinOrgMutation = useMutation({
    mutationFn: async ({ shareCode }: { shareCode: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find the org by share code
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("share_code", shareCode.trim().toUpperCase())
        .single();
        
      if (orgError || !org) throw new Error("Invalid share code or organization not found");

      // Add user to the org
      const { error: joinError } = await supabase
        .from("organization_members")
        .insert({
          org_id: org.id,
          user_id: user.id,
          role: "member"
        });

      if (joinError) {
        if (joinError.code === "23505") { // Unique constraint violation message code in PG usually
           throw new Error("You are already a member of this organization");
        }
        throw joinError;
      }

      return org;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    }
  });

  const updateOrgMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("organizations")
        .update({ name })
        .eq("id", id)
        .eq("created_by", user.id) // Only owner can edit
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    }
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", id)
        .eq("created_by", user.id); // Only owner can delete

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      // Might want to invalidate sessions as well if deleting orgs deletes sessions,
      // but standard cascade should work. We just update the org list.
    }
  });

  return {
    ...query,
    createOrganization: createOrgMutation.mutateAsync,
    joinOrganization: joinOrgMutation.mutateAsync,
    updateOrganization: updateOrgMutation.mutateAsync,
    deleteOrganization: deleteOrgMutation.mutateAsync,
    isCreating: createOrgMutation.isPending,
    isJoining: joinOrgMutation.isPending,
    isUpdating: updateOrgMutation.isPending,
    isDeleting: deleteOrgMutation.isPending
  };
}
