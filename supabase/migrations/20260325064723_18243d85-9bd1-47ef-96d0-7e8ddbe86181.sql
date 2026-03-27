-- Fix: Recreate the trigger for auto-creating profile + role on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Products table ──
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  unit TEXT NOT NULL DEFAULT 'pcs',
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  reorder_level INTEGER NOT NULL DEFAULT 5,
  supplier_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Suppliers table ──
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admins can update suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admins can delete suppliers" ON public.suppliers FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

-- Add FK from products to suppliers
ALTER TABLE public.products ADD CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- ── Sales table ──
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no TEXT NOT NULL UNIQUE,
  cashier_id UUID NOT NULL REFERENCES auth.users(id),
  cashier_name TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'mobile_money')),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view sales" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (auth.uid() = cashier_id);

-- ── Sale Items table ──
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  name TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  line_total NUMERIC(10,2) NOT NULL
);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view sale items" ON public.sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sale items" ON public.sale_items FOR INSERT TO authenticated WITH CHECK (true);

-- ── Business Settings table ──
CREATE TABLE public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL DEFAULT 'My Business',
  receipt_footer TEXT NOT NULL DEFAULT 'Thank you for your purchase!',
  default_tax_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view settings" ON public.business_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update settings" ON public.business_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

-- Insert default business settings
INSERT INTO public.business_settings (business_name, receipt_footer, default_tax_rate)
VALUES ('BeanTrack Coffee', 'Thank you for your purchase!', 15.00);

-- ── Receipt number sequence ──
CREATE SEQUENCE public.receipt_no_seq START 1000;

-- ── Function to deduct stock on sale ──
CREATE OR REPLACE FUNCTION public.deduct_stock_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock_qty = stock_qty - NEW.qty
  WHERE id = NEW.product_id AND stock_qty >= NEW.qty;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER deduct_stock_after_sale_item
  AFTER INSERT ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.deduct_stock_on_sale();