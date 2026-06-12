-- Create products table for inventory management
CREATE TABLE public.products (
  product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Men', 'Women', 'Kids', 'Other')),
  size VARCHAR(20),
  buying_price DECIMAL(10, 2) NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  profit_per_unit DECIMAL(10, 2) GENERATED ALWAYS AS (selling_price - buying_price) STORED,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales table for transaction tracking
CREATE TABLE public.sales (
  sale_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
  quantity_sold INTEGER NOT NULL DEFAULT 1,
  unit_selling_price DECIMAL(10, 2) NOT NULL,
  unit_buying_price DECIMAL(10, 2) NOT NULL,
  total_profit DECIMAL(10, 2) GENERATED ALWAYS AS (quantity_sold * (unit_selling_price - unit_buying_price)) STORED,
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admin access)
CREATE POLICY "Authenticated users can view all products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view all sales"
  ON public.sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sales"
  ON public.sales FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sales"
  ON public.sales FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_sales_date ON public.sales(sale_date);
CREATE INDEX idx_sales_product_id ON public.sales(product_id);