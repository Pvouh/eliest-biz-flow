import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Calendar, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

type Sale = {
  sale_id: string;
  product_id: string;
  quantity_sold: number;
  unit_selling_price: number;
  unit_buying_price: number;
  total_profit: number;
  sale_date: string;
  products: {
    name: string;
  };
};

const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [selectedSales, setSelectedSales] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchSales = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        products (
          name
        )
      `)
      .order("sale_date", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sales",
        variant: "destructive",
      });
    } else {
      setSales(data || []);
      setFilteredSales(data || []);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    let filtered = sales;
    const now = new Date();

    switch (timeFilter) {
      case "today":
        filtered = sales.filter(
          (s) => new Date(s.sale_date) >= startOfDay(now) && new Date(s.sale_date) <= endOfDay(now)
        );
        break;
      case "week":
        filtered = sales.filter(
          (s) => new Date(s.sale_date) >= startOfWeek(now) && new Date(s.sale_date) <= endOfWeek(now)
        );
        break;
      case "month":
        filtered = sales.filter(
          (s) => new Date(s.sale_date) >= startOfMonth(now) && new Date(s.sale_date) <= endOfMonth(now)
        );
        break;
      default:
        filtered = sales;
    }

    setFilteredSales(filtered);
  }, [timeFilter, sales]);

  const handleRemoveSale = async (sale: Sale) => {
    // Delete sale without restoring stock
    const { error: deleteError } = await supabase
      .from("sales")
      .delete()
      .eq("sale_id", sale.sale_id);

    if (deleteError) {
      toast({
        title: "Error",
        description: "Failed to remove sale",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Sale removed successfully",
      });
      fetchSales();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSales.size === 0) return;

    const { error } = await supabase
      .from("sales")
      .delete()
      .in("sale_id", Array.from(selectedSales));

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete sales",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `${selectedSales.size} sale(s) deleted`,
      });
      setSelectedSales(new Set());
      fetchSales();
    }
  };

  const toggleSelection = (saleId: string) => {
    const newSelection = new Set(selectedSales);
    if (newSelection.has(saleId)) {
      newSelection.delete(saleId);
    } else {
      newSelection.add(saleId);
    }
    setSelectedSales(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedSales.size === filteredSales.length) {
      setSelectedSales(new Set());
    } else {
      setSelectedSales(new Set(filteredSales.map(s => s.sale_id)));
    }
  };

  const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.total_profit, 0);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="sticky top-0 z-10 bg-background pb-4">
        <h1 className="text-4xl font-bold tracking-tight">Sales Tracking</h1>
      </div>

      <div className="sticky top-20 z-10 bg-card rounded-xl border shadow-sm p-6">
        <div className="flex gap-4 items-center">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-52 h-11">
              <SelectValue placeholder="Filter by time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          {selectedSales.size > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} size="lg">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected ({selectedSales.size})
            </Button>
          )}
          <div className="ml-auto p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Profit ({timeFilter})</p>
            <p className="text-3xl font-bold text-primary">${totalProfit.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedSales.size === filteredSales.length && filteredSales.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Quantity Sold</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Total Profit</TableHead>
              <TableHead>Sale Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.map((sale) => (
              <TableRow key={sale.sale_id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedSales.has(sale.sale_id)}
                    onCheckedChange={() => toggleSelection(sale.sale_id)}
                  />
                </TableCell>
                <TableCell className="font-semibold text-base">{sale.products?.name}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-muted">
                    {sale.quantity_sold}
                  </span>
                </TableCell>
                <TableCell className="font-medium">${sale.unit_selling_price.toFixed(2)}</TableCell>
                <TableCell className="text-primary font-semibold text-base">
                  ${sale.total_profit.toFixed(2)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(sale.sale_date), "MMM dd, yyyy HH:mm")}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveSale(sale)}
                    className="shadow-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Sales;
