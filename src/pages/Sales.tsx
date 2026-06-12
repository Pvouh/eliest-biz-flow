import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Calendar, ShoppingCart, TrendingUp, DollarSign } from "lucide-react";
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
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

type Sale = {
  sale_id: string;
  product_id: string;
  quantity_sold: number;
  unit_selling_price: number;
  unit_buying_price: number;
  total_profit: number;
  sale_date: string;
  products: { name: string };
};

const TIME_LABELS: Record<string, string> = {
  all:   "All Time",
  today: "Today",
  week:  "This Week",
  month: "This Month",
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
      .select(`*, products(name)`)
      .order("sale_date", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch sales", variant: "destructive" });
    } else {
      setSales(data || []);
      setFilteredSales(data || []);
    }
  };

  useEffect(() => { fetchSales(); }, []);

  useEffect(() => {
    const now = new Date();
    let filtered = sales;

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
          (s) =>
            new Date(s.sale_date) >= startOfMonth(now) &&
            new Date(s.sale_date) <= endOfMonth(now)
        );
        break;
    }

    setFilteredSales(filtered);
  }, [timeFilter, sales]);

  const handleRemoveSale = async (sale: Sale) => {
    const { error } = await supabase.from("sales").delete().eq("sale_id", sale.sale_id);
    if (error) {
      toast({ title: "Error", description: "Failed to remove sale", variant: "destructive" });
    } else {
      toast({ title: "Removed", description: "Sale record deleted" });
      fetchSales();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSales.size === 0) return;
    const { error } = await supabase
      .from("sales").delete().in("sale_id", Array.from(selectedSales));
    if (error) {
      toast({ title: "Error", description: "Failed to delete sales", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: `${selectedSales.size} sale(s) removed` });
      setSelectedSales(new Set());
      fetchSales();
    }
  };

  const toggleSelection = (saleId: string) => {
    const next = new Set(selectedSales);
    next.has(saleId) ? next.delete(saleId) : next.add(saleId);
    setSelectedSales(next);
  };

  const toggleSelectAll = () => {
    if (selectedSales.size === filteredSales.length) {
      setSelectedSales(new Set());
    } else {
      setSelectedSales(new Set(filteredSales.map((s) => s.sale_id)));
    }
  };

  const totalProfit  = filteredSales.reduce((s, sale) => s + sale.total_profit, 0);
  const totalRevenue = filteredSales.reduce((s, sale) => s + sale.unit_selling_price * sale.quantity_sold, 0);
  const totalQty     = filteredSales.reduce((s, sale) => s + sale.quantity_sold, 0);

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Tracking</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {sales.length} total transactions recorded
        </p>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total Profit",
            value: `KSh ${totalProfit.toFixed(2)}`,
            icon: TrendingUp,
            color: "text-primary",
            bg:    "bg-primary/8",
          },
          {
            label: "Total Revenue",
            value: `KSh ${totalRevenue.toFixed(2)}`,
            icon: DollarSign,
            color: "text-emerald-500",
            bg:    "bg-emerald-500/8",
          },
          {
            label: "Items Sold",
            value: totalQty.toString(),
            icon: ShoppingCart,
            color: "text-blue-500",
            bg:    "bg-blue-500/8",
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
              <p className="text-xl font-bold leading-none mt-0.5 tabular-nums">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-card border border-border/60 rounded-xl px-4 py-3 flex items-center gap-3 shadow-[var(--shadow-xs)]">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TIME_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedSales.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            className="gap-1.5 h-8 text-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete {selectedSales.size}
          </Button>
        )}
        <p className="ml-auto text-xs text-muted-foreground pr-1 shrink-0">
          {filteredSales.length} result{filteredSales.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Table ── */}
      <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-[var(--shadow-sm)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
              <TableHead className="w-9 pl-4 py-2.5">
                <Checkbox
                  checked={filteredSales.length > 0 && selectedSales.size === filteredSales.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2.5">Product</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2.5 text-right">Qty</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2.5 text-right">Unit Price</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2.5 text-right">Revenue</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2.5 text-right">Profit</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2.5">Date</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2.5 text-right pr-4">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No sales in this period</p>
                  <p className="text-xs mt-1">Change the time filter or record a new sale</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => {
                const revenue = sale.unit_selling_price * sale.quantity_sold;
                return (
                  <TableRow
                    key={sale.sale_id}
                    className={[
                      "table-row-hover border-b border-border/40 last:border-0",
                      selectedSales.has(sale.sale_id) ? "bg-primary/4" : "",
                    ].join(" ")}
                  >
                    <TableCell className="pl-4 py-2.5">
                      <Checkbox
                        checked={selectedSales.has(sale.sale_id)}
                        onCheckedChange={() => toggleSelection(sale.sale_id)}
                      />
                    </TableCell>
                    <TableCell className="py-2.5 font-semibold text-sm">{sale.products?.name}</TableCell>
                    <TableCell className="py-2.5 text-right">
                      <span className="badge-compact bg-muted text-muted-foreground tabular-nums">
                        ×{sale.quantity_sold}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-sm text-right tabular-nums text-muted-foreground">
                      KSh {sale.unit_selling_price.toFixed(2)}
                    </TableCell>
                    <TableCell className="py-2.5 text-sm text-right tabular-nums font-medium">
                      KSh {revenue.toFixed(2)}
                    </TableCell>
                    <TableCell className="py-2.5 text-right tabular-nums">
                      <span className="text-sm font-semibold text-primary">
                        +KSh {sale.total_profit.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(sale.sale_date), "MMM dd, yyyy")}
                      <span className="ml-1 text-[11px] opacity-50">
                        {format(new Date(sale.sale_date), "HH:mm")}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 pr-4">
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveSale(sale)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Sales;
