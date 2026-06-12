import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Package, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AddProductDialog } from "@/components/stock/AddProductDialog";
import { EditProductDialog } from "@/components/stock/EditProductDialog";
import { SellProductDialog } from "@/components/stock/SellProductDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Product = {
  product_id: string;
  name: string;
  category: string;
  size: string | null;
  buying_price: number;
  selling_price: number;
  profit_per_unit: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
};

const CATEGORIES = ["Men", "Women", "Kids", "Other"];

const categoryColors: Record<string, string> = {
  Men:   "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Women: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  Kids:  "bg-purple-500/10 text-purple-500 dark:text-purple-400",
  Other: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

const Stock = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch products", variant: "destructive" });
    } else {
      setProducts(data || []);
      setFilteredProducts(data || []);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    let filtered = products;
    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }
    setFilteredProducts(filtered);
  }, [searchQuery, categoryFilter, products]);

  const handleDelete = async (productId: string) => {
    const { error } = await supabase.from("products").delete().eq("product_id", productId);
    if (error) {
      toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Product removed successfully" });
      fetchProducts();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    const { error } = await supabase
      .from("products").delete().in("product_id", Array.from(selectedProducts));
    if (error) {
      toast({ title: "Error", description: "Failed to delete products", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: `${selectedProducts.size} product(s) removed` });
      setSelectedProducts(new Set());
      fetchProducts();
    }
  };

  const toggleSelection = (productId: string) => {
    const next = new Set(selectedProducts);
    next.has(productId) ? next.delete(productId) : next.add(productId);
    setSelectedProducts(next);
  };

  const toggleAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p) => p.product_id)));
    }
  };

  /* ── Summary stats ── */
  const totalItems  = products.reduce((s, p) => s + p.stock_quantity, 0);
  const lowStock    = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 10).length;
  const outOfStock  = products.filter((p) => p.stock_quantity === 0).length;

  const StockBadge = ({ qty }: { qty: number }) => {
    if (qty === 0) {
      return (
        <span className="badge-compact bg-destructive/10 text-destructive gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" />
          Out
        </span>
      );
    }
    if (qty <= 10) {
      return (
        <span className="badge-compact bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          {qty} Low
        </span>
      );
    }
    return (
      <span className="badge-compact bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        {qty}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {products.length} products in inventory
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="gap-2 shadow-[var(--shadow-sm)] font-semibold"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* ── Stat pills ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total Items",
            value: totalItems,
            icon: Package,
            color: "text-primary",
            bg: "bg-primary/8",
          },
          {
            label: "Low Stock",
            value: lowStock,
            icon: AlertTriangle,
            color: "text-amber-500",
            bg: "bg-amber-500/8",
          },
          {
            label: "In Stock",
            value: products.length - outOfStock,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-500/8",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-card border border-border/60 rounded-xl px-4 py-3 flex items-center gap-3 shadow-[var(--shadow-xs)]"
          >
            <div className={`p-2 rounded-lg ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              <p className="text-xl font-bold leading-none mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters bar ── */}
      <div className="bg-card border border-border/60 rounded-xl px-4 py-3 flex items-center gap-3 shadow-[var(--shadow-xs)]">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search products…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm bg-background"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        {selectedProducts.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            className="ml-auto gap-1.5 h-8 text-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete {selectedProducts.size}
          </Button>
        )}
        <p className="ml-auto text-xs text-muted-foreground pr-1 shrink-0">
          {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Table ── */}
      <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-[var(--shadow-sm)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
              <TableHead className="w-9 pl-4">
                <input
                  type="checkbox"
                  className="rounded border-border accent-primary cursor-pointer"
                  checked={
                    filteredProducts.length > 0 &&
                    selectedProducts.size === filteredProducts.length
                  }
                  onChange={toggleAll}
                />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2.5">Product</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2.5">Category</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2.5">Size</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2.5 text-right">Buy</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2.5 text-right">Sell</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2.5 text-right">Profit</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2.5">Stock</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2.5 text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No products found</p>
                  <p className="text-xs mt-1">Try adjusting your filters</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow
                  key={product.product_id}
                  className={[
                    "table-row-hover border-b border-border/40 last:border-0",
                    selectedProducts.has(product.product_id) ? "bg-primary/4" : "",
                  ].join(" ")}
                >
                  <TableCell className="pl-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.product_id)}
                      onChange={() => toggleSelection(product.product_id)}
                      className="rounded border-border accent-primary cursor-pointer"
                    />
                  </TableCell>
                  <TableCell className="py-2.5 font-semibold text-sm">{product.name}</TableCell>
                  <TableCell className="py-2.5">
                    <span className={`badge-compact ${categoryColors[product.category] ?? categoryColors.Other}`}>
                      {product.category}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5 text-sm text-muted-foreground">{product.size || "—"}</TableCell>
                  <TableCell className="py-2.5 text-sm text-right tabular-nums text-muted-foreground">
                    KSh {product.buying_price.toFixed(2)}
                  </TableCell>
                  <TableCell className="py-2.5 text-sm text-right tabular-nums font-medium">
                    KSh {product.selling_price.toFixed(2)}
                  </TableCell>
                  <TableCell className="py-2.5 text-right tabular-nums">
                    <span className="text-sm font-semibold text-primary">
                      +KSh {product.profit_per_unit.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <StockBadge qty={product.stock_quantity} />
                  </TableCell>
                  <TableCell className="py-2.5 pr-4">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Button
                        size="sm"
                        onClick={() => setSellingProduct(product)}
                        disabled={product.stock_quantity === 0}
                        className="h-7 px-3 text-xs font-semibold"
                      >
                        Sell
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingProduct(product)}
                        className="h-7 w-7 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(product.product_id)}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddProductDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchProducts}
      />
      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          onSuccess={fetchProducts}
        />
      )}
      {sellingProduct && (
        <SellProductDialog
          product={sellingProduct}
          open={!!sellingProduct}
          onOpenChange={(open) => !open && setSellingProduct(null)}
          onSuccess={fetchProducts}
        />
      )}
    </div>
  );
};

export default Stock;
