// @ts-nocheck -- código original migrado sem alterações de lógica
import { formatOrderNumber } from '../../orderNumber'
import { useStore } from "../../context/StoreContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useMemo } from "react";
import { Wallet, CheckCircle2, Clock3, TrendingUp } from "lucide-react";
import { money } from '../../format'

function Dashboard() {
  const { orders, products, categories } = useStore();

  const stats = useMemo(() => {
    const completedOrders = orders.filter((o) => o.status === "completed");
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    // Daily sales for last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayOrders = completedOrders.filter((o) => o.createdAt.startsWith(dateStr));
      last7Days.push({
        date: date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }),
        vendas: parseFloat(dayOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)),
        pedidos: dayOrders.length,
      });
    }

    // Sales by category
    const categorySales = categories
      .map((cat) => {
        const catProducts = products.filter((p) => p.categoryId === cat.id);
        const catRevenue = completedOrders.reduce((sum, order) => {
          return (
            sum +
            order.items.reduce((itemSum, item) => {
              if (catProducts.find((p) => p.id === item.product.id)) {
                return itemSum + item.product.price * item.quantity;
              }
              return itemSum;
            }, 0)
          );
        }, 0);
        return { name: cat.name, value: parseFloat(catRevenue.toFixed(2)) };
      })
      .filter((c) => c.value > 0);

    // Top products
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productSales[item.product.id]) {
          productSales[item.product.id] = { name: item.product.name, quantity: 0, revenue: 0 };
        }
        productSales[item.product.id].quantity += item.quantity;
        productSales[item.product.id].revenue += item.product.price * item.quantity;
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      completedOrders: completedOrders.length,
      pendingOrders,
      avgTicket,
      last7Days,
      categorySales,
      topProducts,
    };
  }, [orders, products, categories]);

  const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];

  return (
    <div className="admin-dashboard space-y-6">
      <div className="admin-page-heading">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm">Visão geral do seu restaurante</p>
      </div>

      {/* Stats Cards */}
      <div className="admin-stat-grid grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Faturamento Total"
          value={`${money(stats.totalRevenue)}`}
          icon={Wallet}
          color="green"
        />
        <StatCard
          title="Pedidos Completos"
          value={stats.completedOrders.toString()}
          icon={CheckCircle2}
          color="blue"
        />
        <StatCard
          title="Pedidos Pendentes"
          value={stats.pendingOrders.toString()}
          icon={Clock3}
          color="orange"
        />
        <StatCard
          title="Ticket Médio"
          value={`${money(stats.avgTicket)}`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="admin-chart-card bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">Vendas - Últimos 7 dias</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [
                  `${money(value)}`,
                  "Vendas",
                ]}
              />
              <Bar dataKey="vendas" fill="#d9273f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Chart */}
        <div className="admin-chart-card bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">Pedidos - Últimos 7 dias</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="pedidos"
                stroke="#d9273f"
                strokeWidth={3}
                dot={{ fill: "#d9273f", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Sales Pie */}
        <div className="admin-chart-card bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">Vendas por Categoria</h3>
          {stats.categorySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.categorySales}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name }) => name}
                >
                  {stats.categorySales.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    `${money(value)}`,
                    "Vendas",
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              Sem dados de vendas
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="admin-chart-card bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">Top 5 Produtos</h3>
          <div className="space-y-3">
            {stats.topProducts.length > 0 ? (
              stats.topProducts.map((product, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      index === 0
                        ? "bg-yellow-500"
                        : index === 1
                          ? "bg-gray-400"
                          : index === 2
                            ? "bg-orange-600"
                            : "bg-gray-300"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.quantity} vendidos</p>
                  </div>
                  <span className="text-green-700 font-bold text-sm">
                    {money(product.revenue)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhum produto vendido ainda</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="admin-table-card bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-4">Pedidos Recentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-gray-500 font-medium">Pedido</th>
                <th className="text-left py-2 text-gray-500 font-medium">Cliente</th>
                <th className="text-left py-2 text-gray-500 font-medium">Total</th>
                <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                <th className="text-left py-2 text-gray-500 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{formatOrderNumber(order)}</td>
                  <td className="py-3">{order.customerName}</td>
                  <td className="py-3 text-green-700 font-medium">
                    {money(order.total)}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-3 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
}) {
  const colorClasses: { [key: string]: string } = {
    green: "bg-white border-[#eee4da]",
    blue: "bg-white border-[#eee4da]",
    orange: "bg-white border-[#eee4da]",
    purple: "bg-white border-[#eee4da]",
  };
  return (
    <div
      className={`admin-stat-card rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${colorClasses[color] || "bg-white border-[#eee4da]"}`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0f2] text-[#d9273f]">
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <p className="text-xl md:text-2xl font-bold tracking-tight text-[#30231e] mt-4">{value}</p>
      <p className="text-xs text-[#89796f] mt-1">{title}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: { [key: string]: string } = {
    pending: "bg-yellow-100 text-yellow-700",
    preparing: "bg-blue-100 text-blue-700",
    delivering: "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const labels: { [key: string]: string } = {
    pending: "Pendente",
    preparing: "Preparando",
    delivering: "Entregando",
    completed: "Concluído",
    cancelled: "Cancelado",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}
    >
      {labels[status] || status}
    </span>
  );
}

export default Dashboard;
