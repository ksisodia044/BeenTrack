-- Fix: tighten sale_items INSERT policy to only allow inserting items for sales you created
DROP POLICY "Authenticated users can insert sale items" ON public.sale_items;
CREATE POLICY "Users can insert items for their own sales" ON public.sale_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales WHERE id = sale_id AND cashier_id = auth.uid()
    )
  );