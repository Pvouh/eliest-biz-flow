import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  stock_quantity: number;
};

type EditProductDialogProps = {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export const EditProductDialog = ({
  product,
  open,
  onOpenChange,
  onSuccess,
}: EditProductDialogProps) => {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [size, setSize] = useState(product.size || "");
  const [buyingPrice, setBuyingPrice] = useState(product.buying_price.toString());
  const [sellingPrice, setSellingPrice] = useState(product.selling_price.toString());
  const [stockQuantity, setStockQuantity] = useState(product.stock_quantity.toString());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setName(product.name);
    setCategory(product.category);
    setSize(product.size || "");
    setBuyingPrice(product.buying_price.toString());
    setSellingPrice(product.selling_price.toString());
    setStockQuantity(product.stock_quantity.toString());
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("products")
      .update({
        name,
        category,
        size: size || null,
        buying_price: parseFloat(buyingPrice),
        selling_price: parseFloat(sellingPrice),
        stock_quantity: parseInt(stockQuantity),
      })
      .eq("product_id", product.product_id);

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update the product details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Product Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Men">Men</SelectItem>
                <SelectItem value="Women">Women</SelectItem>
                <SelectItem value="Kids">Kids</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-size">Size (Optional)</Label>
            <Input
              id="edit-size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-buyingPrice">Buying Price</Label>
              <Input
                id="edit-buyingPrice"
                type="number"
                step="0.01"
                value={buyingPrice}
                onChange={(e) => setBuyingPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-sellingPrice">Selling Price</Label>
              <Input
                id="edit-sellingPrice"
                type="number"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-stockQuantity">Stock Quantity</Label>
            <Input
              id="edit-stockQuantity"
              type="number"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Updating..." : "Update Product"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
