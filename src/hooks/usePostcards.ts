import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { EmotionKey } from "@/data/emotions";

export interface PublicPostcard {
  id: string;
  memory: string;
  emotion: EmotionKey;
  variant_idx: number;
  sender: string | null;
  recipient: string | null;
  featured: boolean;
  created_at: string;
}

/**
 * Fetches approved postcards for the home carousel.
 * Curation: featured-first (up to 8), then most recent non-featured (up to 12).
 */
export const usePostcards = () => {
  const [postcards, setPostcards] = useState<PublicPostcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [featuredRes, recentRes] = await Promise.all([
          supabase
            .from("public_postcards" as never)
            .select("*")
            .eq("featured", true)
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("public_postcards" as never)
            .select("*")
            .eq("featured", false)
            .order("created_at", { ascending: false })
            .limit(12),
        ]);
        if (cancelled) return;
        const featured = (featuredRes.data ?? []) as PublicPostcard[];
        const recent = (recentRes.data ?? []) as PublicPostcard[];
        setPostcards([...featured, ...recent]);
      } catch (e) {
        console.error("[usePostcards]", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { postcards, loading };
};
