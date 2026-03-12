"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { Suspense } from "react";

function JoinPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const supabase = createSupabaseClient();

  useEffect(() => {
    const joinSession = async () => {
      if (!code || code.length !== 8) {
        toast.error("Invalid or missing invite code");
        router.push("/dashboard");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("sessions")
          .select("id, title, status")
          .eq("invite_code", code.toUpperCase())
          .single();

        if (error || !data) {
          toast.error("Invalid invite code. Session not found.");
          router.push("/dashboard");
          return;
        }

        if (data.status === "closed") {
          toast.error("This session is closed and no longer accepting participants.");
          router.push("/dashboard");
          return;
        }

        toast.success(`Joining "${data.title}"!`);
        router.push(`/session/${data.id}`);
      } catch (err: any) {
        toast.error(err.message || "Failed to join session");
        router.push("/dashboard");
      }
    };

    joinSession();
  }, [code, router, supabase]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-bg-base">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
      <h2 className="text-lg font-semibold text-text-primary">Joining Session...</h2>
      <p className="text-sm text-text-secondary mt-2">Verifying your invite code</p>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-bg-base">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    }>
      <JoinPageInner />
    </Suspense>
  );
}
