import { useState } from "react";
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

type Product = {
  product_id: string;
  name: string;
  buying_price: number;
  selling_price: number;
  stock_quantity: number;
};

type SellProductDialogProps = {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export const SellProductDialog = ({
  product,
  open,
  onOpenChange,
  onSuccess,
}: SellProductDialogProps) => {
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantitySold = parseInt(quantity);

    if (quantitySold > product.stock_quantity) {
      toast({
        title: "Error",
        description: "Insufficient stock",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Insert sale record
    const { error: saleError } = await supabase.from("sales").insert({
      product_id: product.product_id,
      quantity_sold: quantitySold,
      unit_selling_price: product.selling_price,
      unit_buying_price: product.buying_price,
    });

    if (saleError) {
      toast({
        title: "Error",
        description: saleError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Update stock quantity
    const { error: updateError } = await supabase
      .from("products")
      .update({
        stock_quantity: product.stock_quantity - quantitySold,
      })
      .eq("product_id", product.product_id);

    setLoading(false);

    if (updateError) {
      toast({
        title: "Error",
        description: updateError.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Sold ${quantitySold} unit(s) of ${product.name}`,
      });
      onSuccess();
      onOpenChange(false);
      setQuantity("1");
    }
  };

  const totalProfit = (product.selling_price - product.buying_price) * parseInt(quantity || "0");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sell Product</DialogTitle>
          <DialogDescription>Record a sale for {product.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={product.stock_quantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              Available: {product.stock_quantity} units
            </p>
          </div>

          <div className="space-y-2">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Unit Price:</span>
                <span className="font-medium">KSh {product.selling_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Quantity:</span>
                <span className="font-medium">{quantity}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium">Total Profit:</span>
                <span className="font-bold text-primary">
                  KSh {totalProfit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Processing..." : "Confirm Sale"}
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
