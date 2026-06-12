import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/analytics/MetricCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { TrendingUp, DollarSign, ShoppingCart } from "lucide-react";

type Sale = {
  sale_date: string;
  total_profit: number;
  quantity_sold: number;
  unit_selling_price: number;
  unit_buying_price: number;
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

    if (!error && data) {
      setSales(data);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    if (sales.length === 0) return;

    const now = new Date();
    let intervals: Date[] = [];
    let format_string = "";

    switch (timeRange) {
      case "day":
        intervals = eachDayOfInterval({
          start: subDays(now, 6),
          end: now,
        });
        format_string = "MMM dd";
        break;
      case "week":
        intervals = eachWeekOfInterval({
          start: subDays(now, 28),
          end: now,
        });
        format_string = "MMM dd";
        break;
      case "month":
        intervals = eachMonthOfInterval({
          start: subDays(now, 180),
          end: now,
        });
        format_string = "MMM yyyy";
        break;
    }

    const aggregated = intervals.map((date) => {
      const relevantSales = sales.filter((sale) => {
        const saleDate = new Date(sale.sale_date);
        if (timeRange === "day") {
          return format(saleDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
        } else if (timeRange === "week") {
          return format(saleDate, "yyyy-ww") === format(date, "yyyy-ww");
        } else {
          return format(saleDate, "yyyy-MM") === format(date, "yyyy-MM");
        }
      });

      const profit = relevantSales.reduce((sum, s) => sum + s.total_profit, 0);
      const revenue = relevantSales.reduce((sum, s) => sum + (s.unit_selling_price * s.quantity_sold), 0);
      const cost = relevantSales.reduce((sum, s) => sum + (s.unit_buying_price * s.quantity_sold), 0);
      const itemsSold = relevantSales.reduce((sum, s) => sum + s.quantity_sold, 0);

      return {
        date: format(date, format_string),
        profit: Number(profit.toFixed(2)),
        revenue: Number(revenue.toFixed(2)),
        cost: Number(cost.toFixed(2)),
        itemsSold,
      };
    });

    setChartData(aggregated);
  }, [sales, timeRange]);

  const totalProfit = sales.reduce((sum, s) => sum + s.total_profit, 0);
  const totalRevenue = sales.reduce((sum, s) => sum + (s.unit_selling_price * s.quantity_sold), 0);
  const totalItems = sales.reduce((sum, s) => sum + s.quantity_sold, 0);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="sticky top-0 z-10 bg-background pb-4 flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Analytics Dashboard</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-52 h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Daily</SelectItem>
            <SelectItem value="week">Weekly</SelectItem>
            <SelectItem value="month">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="sticky top-20 z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Total Profit" icon={TrendingUp} sales={sales} metricType="profit" />
        <MetricCard title="Total Revenue" icon={DollarSign} sales={sales} metricType="revenue" />
        <MetricCard title="Items Sold" icon={ShoppingCart} sales={sales} metricType="items" />
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Profit Trend</CardTitle>
          <p className="text-sm text-muted-foreground">Track your profit performance over time</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Revenue vs Cost</CardTitle>
          <p className="text-sm text-muted-foreground">Compare your revenue and costs analysis</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              <Bar dataKey="cost" fill="hsl(var(--muted-foreground))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
