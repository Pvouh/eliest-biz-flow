import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  format,
  subDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import { TrendingUp, DollarSign, ShoppingCart, Activity } from "lucide-react";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

type Sale = {
  sale_date: string;
  total_profit: number;
  quantity_sold: number;
  unit_selling_price: number;
  unit_buying_price: number;
};

/* Custom tooltip for recharts */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/60 rounded-xl p-3 shadow-[var(--shadow-md)] text-sm min-w-[140px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground capitalize">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-semibold tabular-nums">
            {entry.name === "itemsSold" ? entry.value : `KSh ${entry.value.toFixed(2)}`}
          </span>
        </div>
      ))}
    </div>
  );
};

const Analytics = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [timeRange, setTimeRange] = useState<string>("week");
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchSales = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("sale_date", { ascending: true });
    if (!error && data) setSales(data);
  };

  useEffect(() => { fetchSales(); }, []);

  useEffect(() => {
    if (sales.length === 0) return;
    const now = new Date();
    let intervals: Date[] = [];
    let fmt = "";

    switch (timeRange) {
      case "day":
        intervals = eachDayOfInterval({ start: subDays(now, 6), end: now });
        fmt = "MMM dd";
        break;
      case "week":
        intervals = eachWeekOfInterval({ start: subDays(now, 28), end: now });
        fmt = "MMM dd";
        break;
      case "month":
        intervals = eachMonthOfInterval({ start: subDays(now, 180), end: now });
        fmt = "MMM yyyy";
        break;
    }

    const aggregated = intervals.map((date) => {
      const rel = sales.filter((s) => {
        const d = new Date(s.sale_date);
        if (timeRange === "day")   return format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
        if (timeRange === "week")  return format(d, "yyyy-ww")    === format(date, "yyyy-ww");
        return format(d, "yyyy-MM") === format(date, "yyyy-MM");
      });
      return {
        date:      format(date, fmt),
        profit:    +rel.reduce((s, r) => s + r.total_profit, 0).toFixed(2),
        revenue:   +rel.reduce((s, r) => s + r.unit_selling_price * r.quantity_sold, 0).toFixed(2),
        cost:      +rel.reduce((s, r) => s + r.unit_buying_price  * r.quantity_sold, 0).toFixed(2),
        itemsSold: rel.reduce((s, r) => s + r.quantity_sold, 0),
      };
    });

    setChartData(aggregated);
  }, [sales, timeRange]);

  /* Metric helpers */
  const metricFor = (
    filter: string,
    type: "profit" | "revenue" | "items"
  ) => {
    const now = new Date();
    let filtered = sales;
    switch (filter) {
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
    }
    if (type === "profit")  return filtered.reduce((s, r) => s + r.total_profit, 0);
    if (type === "revenue") return filtered.reduce((s, r) => s + r.unit_selling_price * r.quantity_sold, 0);
    return filtered.reduce((s, r) => s + r.quantity_sold, 0);
  };

  const totalProfit  = sales.reduce((s, r) => s + r.total_profit, 0);
  const totalRevenue = sales.reduce((s, r) => s + r.unit_selling_price * r.quantity_sold, 0);
  const totalItems   = sales.reduce((s, r) => s + r.quantity_sold, 0);
  const avgOrder     = sales.length ? totalRevenue / sales.length : 0;

  const statCards = [
    { label: "Total Profit",  value: `KSh ${totalProfit.toFixed(2)}`,  icon: TrendingUp, color: "text-primary",      bg: "bg-primary/8",       border: "border-primary/20" },
    { label: "Total Revenue", value: `KSh ${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-emerald-500",  bg: "bg-emerald-500/8",   border: "border-emerald-500/20" },
    { label: "Items Sold",    value: totalItems.toString(),          icon: ShoppingCart, color: "text-blue-500",  bg: "bg-blue-500/8",      border: "border-blue-500/20" },
    { label: "Avg Order",     value: `KSh ${avgOrder.toFixed(2)}`,     icon: Activity,   color: "text-violet-500",  bg: "bg-violet-500/8",    border: "border-violet-500/20" },
  ];

  const axisStyle = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };
  const gridStyle = { stroke: "hsl(var(--border))", strokeDasharray: "4 4" };

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Performance overview — all time
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Daily (7d)</SelectItem>
            <SelectItem value="week">Weekly (4w)</SelectItem>
            <SelectItem value="month">Monthly (6m)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div
            key={label}
            className={`bg-card border ${border} rounded-xl p-4 shadow-[var(--shadow-xs)] flex flex-col gap-3`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {label}
              </p>
              <div className={`p-1.5 rounded-lg ${bg}`}>
                <Icon className={`h-3.5 w-3.5 ${color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60 shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Profit Trend
            </CardTitle>
            <p className="text-xs text-muted-foreground">Net profit over time</p>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ fill: "hsl(var(--primary))", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Revenue vs Cost
            </CardTitle>
            <p className="text-xs text-muted-foreground">Gross margin comparison</p>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barCategoryGap="35%">
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))"          radius={[4,4,0,0]} name="revenue" />
                <Bar dataKey="cost"    fill="hsl(var(--muted-foreground))"  radius={[4,4,0,0]} name="cost" opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Items sold chart ── */}
      <Card className="border-border/60 shadow-[var(--shadow-sm)]">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-blue-500" />
            Items Sold
          </CardTitle>
          <p className="text-xs text-muted-foreground">Sales volume over time</p>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barCategoryGap="40%">
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="itemsSold" fill="hsl(196 80% 50%)" radius={[4,4,0,0]} name="itemsSold" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
