import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
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
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
      setFilteredProducts(data || []);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("product_id", productId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      fetchProducts();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .in("product_id", Array.from(selectedProducts));

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete products",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `${selectedProducts.size} product(s) deleted`,
      });
      setSelectedProducts(new Set());
      fetchProducts();
    }
  };

  const toggleSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="sticky top-0 z-10 bg-background pb-4 flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Stock Management</h1>
        <Button onClick={() => setIsAddDialogOpen(true)} size="lg" className="shadow-lg">
          <Plus className="mr-2 h-5 w-5" />
          Add New Item
        </Button>
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 text-base"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-52 h-11">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Men">Men</SelectItem>
              <SelectItem value="Women">Women</SelectItem>
              <SelectItem value="Kids">Kids</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {selectedProducts.size > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} size="lg">
              Delete Selected ({selectedProducts.size})
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Buying Price</TableHead>
              <TableHead>Selling Price</TableHead>
              <TableHead>Profit/Unit</TableHead>
              <TableHead>Stock Qty</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.product_id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.product_id)}
                    onChange={() => toggleSelection(product.product_id)}
                    className="rounded border-gray-300"
                  />
                </TableCell>
                <TableCell className="font-semibold text-base">{product.name}</TableCell>
                <TableCell className="text-muted-foreground">{product.category}</TableCell>
                <TableCell className="text-muted-foreground">{product.size || "-"}</TableCell>
                <TableCell className="font-medium">${product.buying_price.toFixed(2)}</TableCell>
                <TableCell className="font-medium">${product.selling_price.toFixed(2)}</TableCell>
                <TableCell className="text-primary font-semibold text-base">
                  ${product.profit_per_unit.toFixed(2)}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                    product.stock_quantity > 10 ? 'bg-primary/10 text-primary' : 
                    product.stock_quantity > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 
                    'bg-destructive/10 text-destructive'
                  }`}>
                    {product.stock_quantity}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setSellingProduct(product)}
                      disabled={product.stock_quantity === 0}
                      className="shadow-sm"
                    >
                      Sell
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingProduct(product)}
                      className="shadow-sm"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(product.product_id)}
                      className="shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
