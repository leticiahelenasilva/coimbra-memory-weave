ALTER TABLE public.postcards
ADD COLUMN IF NOT EXISTS variant_idx smallint NOT NULL DEFAULT 0
CHECK (variant_idx BETWEEN 0 AND 2);

CREATE OR REPLACE VIEW public.public_postcards
WITH (security_invoker = true)
AS
SELECT
  id,
  memory,
  emotion,
  sender,
  recipient,
  featured,
  created_at,
  variant_idx
FROM public.postcards
WHERE status = 'approved';

GRANT SELECT ON public.public_postcards TO anon, authenticated;
