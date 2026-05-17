
-- Postcards table
CREATE TABLE public.postcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory text NOT NULL CHECK (char_length(memory) BETWEEN 1 AND 600),
  emotion text NOT NULL CHECK (emotion IN (
    'alegria','euforia','gratidao','serenidade','paixao',
    'raiva','melancolia','medo','frustracao','saudade','nostalgia'
  )),
  confidence numeric(3,2) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  language text,
  sender text CHECK (sender IS NULL OR char_length(sender) <= 80),
  recipient text CHECK (recipient IS NULL OR char_length(recipient) <= 80),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  featured boolean NOT NULL DEFAULT false,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_postcards_curation ON public.postcards (status, featured, created_at DESC);
CREATE INDEX idx_postcards_ip_hash_created ON public.postcards (ip_hash, created_at DESC);

ALTER TABLE public.postcards ENABLE ROW LEVEL SECURITY;

-- No public access to the raw table. Service role bypasses RLS for the edge function.
-- (No SELECT/INSERT/UPDATE/DELETE policies = denied for anon/authenticated)

-- Public view: only approved postcards, safe columns only
CREATE VIEW public.public_postcards
WITH (security_invoker = true)
AS
SELECT
  id,
  memory,
  emotion,
  sender,
  recipient,
  featured,
  created_at
FROM public.postcards
WHERE status = 'approved';

-- The view uses security_invoker so it respects RLS of the caller.
-- We need a SELECT policy that allows anon to read approved rows through the view.
CREATE POLICY "Public can read approved postcards"
ON public.postcards
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

GRANT SELECT ON public.public_postcards TO anon, authenticated;
