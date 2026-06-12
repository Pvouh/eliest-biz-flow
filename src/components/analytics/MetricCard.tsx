import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LucideIcon } from "lucide-react";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

type Sale = {
  sale_date: string;
  total_profit: number;
  quantity_sold: number;
  unit_selling_price: number;
  unit_buying_price: number;
};

type MetricCardProps = {
  title: string;
  icon: LucideIcon;
  sales: Sale[];
  metricType: "profit" | "revenue" | "items";
};

export function MetricCard({ title, icon: Icon, sales, metricType }: MetricCardProps) {
  const [timeFilter, setTimeFilter] = useState<string>("all");

  const calculateMetric = () => {
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
          (s) => new Date(s.sale_date) >= startOfMonth(now) && new Date(s.sale_date) <= endOfMonth(now)
        );
        break;
    }

    if (metricType === "profit") {
      return filtered.reduce((sum, s) => sum + s.total_profit, 0).toFixed(2);
    } else if (metricType === "revenue") {
      return filtered.reduce((sum, s) => sum + (s.unit_selling_price * s.quantity_sold), 0).toFixed(2);
    } else {
      return filtered.reduce((sum, s) => sum + s.quantity_sold, 0).toString();
    }
  };

  const getLabel = () => {
    switch (timeFilter) {
      case "today":
        return "Today";
      case "week":
        return "This week";
      case "month":
        return "This month";
      default:
        return "All time";
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-bold">
          {metricType === "items" ? calculateMetric() : `$${calculateMetric()}`}
        </div>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{getLabel()}</p>
      </CardContent>
    </Card>
  );
}
