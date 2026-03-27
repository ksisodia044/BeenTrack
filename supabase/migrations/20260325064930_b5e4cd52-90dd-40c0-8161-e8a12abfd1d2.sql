-- Create a proper function to get next receipt number
CREATE OR REPLACE FUNCTION public.next_receipt_no()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_val BIGINT;
BEGIN
  SELECT nextval('public.receipt_no_seq') INTO seq_val;
  RETURN 'RCP-' || seq_val;
END;
$$;