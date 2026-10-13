// @ts-nocheck -- código original migrado sem alterações de lógica
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  FolderOpen,
  MapPinned,
  TicketPercent,
  Megaphone,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { useStore } from "../../context/StoreContext";
import Dashboard from "./Dashboard";
import ProductsManager from "./ProductsManager";
import CategoriesManager from "./CategoriesManager";
import OrdersManager from "./OrdersManager";
import SettingsPanel from "./SettingsPanel";
import DeliveryPanel from "./DeliveryPanel";
import MarketingPanel from "./MarketingPanel";
import CouponsManager from "./CouponsManager";
import ManualOrder from "./ManualOrder";
import TeamManager from "./TeamManager";
import { supabase } from "@/integrations/supabase/client";
import { money } from '../../format'

type AdminTab =
  | "dashboard"
  | "orders"
  | "products"
  | "categories"
  | "delivery"
  | "marketing"
  | "coupons"
  | "settings"
  | "manual"
  | "team";

const tabs = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "orders" as const, label: "Pedidos", icon: ClipboardList },
  { id: "manual" as const, label: "Pedido manual", icon: ShoppingCart },
  { id: "products" as const, label: "Produtos", icon: UtensilsCrossed },
  { id: "categories" as const, label: "Categorias", icon: FolderOpen },
  { id: "delivery" as const, label: "Entrega", icon: MapPinned },
  { id: "coupons" as const, label: "Cupons", icon: TicketPercent },
  { id: "marketing" as const, label: "Marketing", icon: Megaphone },
  { id: "team" as const, label: "Equipe", icon: Users },
  { id: "settings" as const, label: "Configurações", icon: Settings },
];

function AdminPanel() {
  const { orders, config, lastIncomingOrder, storeId } = useStore();
  // perfil de quem está logado: colaborador só vê pedidos; administrador/dono veem tudo
  const [myRole, setMyRole] = useState<string | null>(null);
  useEffect(() => {
    if (!storeId) return;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id;
      if (!uid) return;
      supabase.from("store_members").select("role").eq("store_id", storeId).eq("user_id", uid).maybeSingle()
        .then(({ data: r }) => setMyRole((r as any)?.role ?? null));
    });
  }, [storeId]);
  const isStaff = myRole === "staff";
  const visibleTabs = isStaff ? tabs.filter((t) => t.id === "orders" || t.id === "manual") : tabs;
  const [autoPrintOrder, setAutoPrintOrder] = useState<any>(null);
  const lastPrintedOrderId = useRef<string>("");
  const pendingOrdersCount = orders.filter((order) => order.status === "pending").length;
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  useEffect(() => { if (isStaff && activeTab !== "orders" && activeTab !== "manual") setActiveTab("orders"); }, [isStaff, activeTab]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (
      !config.autoPrintNewOrders ||
      !lastIncomingOrder ||
      lastPrintedOrderId.current === lastIncomingOrder.id
    )
      return;
    lastPrintedOrderId.current = lastIncomingOrder.id;
    setAutoPrintOrder(lastIncomingOrder);
  }, [config.autoPrintNewOrders, lastIncomingOrder]);

  useEffect(() => {
    if (!autoPrintOrder) return;
    const timer = window.setTimeout(() => window.print(), 400);
    const afterPrint = () => setAutoPrintOrder(null);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, [autoPrintOrder]);

  return (
    <div className="admin-shell flex min-h-[calc(100vh-3rem)]">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-4 right-4 z-40 md:hidden w-12 h-12 bg-[#d9273f] text-white rounded-full shadow-lg flex items-center justify-center"
        aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
      >
        <span className="text-xs font-semibold tracking-wide">
          {sidebarOpen ? "FECHAR" : "MENU"}
        </span>
      </button>

      {/* Sidebar */}
      <aside
        className={`admin-sidebar
        fixed md:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-[#f4d6db] shadow-lg md:shadow-none
        transform transition-transform duration-200 md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        pt-14 md:pt-0
      `}
      >
        <div className="admin-sidebar-inner p-4">
          <div className="admin-sidebar-heading">
            <span className="admin-sidebar-kicker">Central de gestão</span>
            <h2>Painel Admin</h2>
            <p>Gerencie seu restaurante</p>
          </div>
          <nav className="admin-nav space-y-1" aria-label="Navegação do painel">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                data-active={activeTab === tab.id ? "true" : "false"}
                className={`admin-nav-button group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[#fff0f2] text-[#d9273f] border border-[#ffc6cf] shadow-sm"
                    : "text-[#51444a] hover:bg-[#fff0f2] hover:text-[#d9273f]"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${activeTab === tab.id ? "bg-[#d9273f] text-white" : "text-[#6b6265] group-hover:bg-[#fff0f2] group-hover:text-[#d9273f]"}`}
                >
                  <tab.icon size={19} strokeWidth={1.8} />
                </span>
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.id === "orders" && pendingOrdersCount > 0 && (
                  <span
                    aria-label={
                      pendingOrdersCount +
                      (pendingOrdersCount === 1 ? " pedido novo" : " pedidos novos")
                    }
                    className="ml-auto inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-[#d9273f] px-1.5 text-[11px] font-bold leading-none text-white shadow-sm"
                  >
                    {pendingOrdersCount > 99 ? "99+" : pendingOrdersCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {autoPrintOrder && (
        <div id="auto-order-receipt" className="hidden">
          <style>{`
            @page { size: 80mm auto; margin: 4mm; }
            @media print {
              body * { visibility: hidden !important; }
              #auto-order-receipt, #auto-order-receipt * { visibility: visible !important; }
              #auto-order-receipt { display: block !important; position: absolute; left: 0; top: 0; width: 72mm; color: #000; background: #fff; font: 11px/1.4 Arial, sans-serif; }
              .auto-receipt-center { text-align: center; }
              .auto-receipt-line { border-top: 1px dashed #555; margin: 7px 0; }
              .auto-receipt-row { display: flex; justify-content: space-between; gap: 8px; }
            }
          `}</style>
          <div className="auto-receipt-center">
            {config.logoUrl && (
              <img
                src={config.logoUrl}
                alt="Logo"
                style={{ maxWidth: "42mm", maxHeight: "20mm", objectFit: "contain" }}
              />
            )}
            <strong style={{ fontSize: 15 }}>{config.name || "Minha Loja"}</strong>
            {config.address && <div>{config.address}</div>}
            {config.phone && <div>Telefone: {config.phone}</div>}
            <div className="auto-receipt-line" />
            <strong>COMPROVANTE DE VENDA</strong>
            <div>Pedido: {autoPrintOrder.id}</div>
            <div>{new Date(autoPrintOrder.createdAt || Date.now()).toLocaleString("pt-BR")}</div>
          </div>
          <div className="auto-receipt-line" />
          <div>
            <strong>Cliente:</strong> {autoPrintOrder.customerName || "Não informado"}
          </div>
          <div>
            <strong>Telefone:</strong> {autoPrintOrder.customerPhone || "Não informado"}
          </div>
          <div>
            <strong>Endereço:</strong>{" "}
            {autoPrintOrder.deliveryType === "pickup"
              ? "Retirada no local"
              : autoPrintOrder.customerAddress || "Não informado"}
          </div>
          <div>
            <strong>Pagamento:</strong>{" "}
            {autoPrintOrder.paymentMethod === "pix"
              ? "Pix"
              : autoPrintOrder.paymentMethod === "cash"
                ? "Dinheiro"
                : autoPrintOrder.paymentMethod === "card"
                  ? "Cartão"
                  : "Não informado"}
          </div>
          <div className="auto-receipt-line" />
          {((autoPrintOrder.items || []) as any[]).map((item, index) => (
            <div key={index} style={{ marginBottom: 5 }}>
              <div>
                {item.quantity}x {item.product?.name || "Produto"}
              </div>
              {(item.selectedAddOns || []).map((addon: any) => (
                <div key={addon.id}> + {addon.name}</div>
              ))}
              {item.observation && <div>Obs.: {item.observation}</div>}
              <div className="auto-receipt-row">
                <span>Item</span>
                <span>
                  R${" "}
                  {(
                    (Number(item.product?.price || 0) +
                      (item.selectedAddOns || []).reduce(
                        (sum: number, addon: any) => sum + Number(addon.price || 0),
                        0,
                      )) *
                    Number(item.quantity || 1)
                  )
                    .toFixed(2)
                    .replace(".", ",")}
                </span>
              </div>
            </div>
          ))}
          <div className="auto-receipt-line" />
          <div className="auto-receipt-row">
            <span>Subtotal</span>
            <span>
              R${" "}
              {Number(autoPrintOrder.total || 0)
                .toFixed(2)
                .replace(".", ",")}
            </span>
          </div>
          <div className="auto-receipt-row">
            <span>Entrega</span>
            <span>
              R${" "}
              {Number(autoPrintOrder.deliveryFee || 0)
                .toFixed(2)
                .replace(".", ",")}
            </span>
          </div>
          {Number(autoPrintOrder.discount || 0) > 0 && (
            <div className="auto-receipt-row">
              <span>Desconto</span>
              <span>- {money(Number(autoPrintOrder.discount))}</span>
            </div>
          )}
          <div className="auto-receipt-line" />
          <div className="auto-receipt-row" style={{ fontSize: 14, fontWeight: 700 }}>
            <span>TOTAL</span>
            <span>
              R${" "}
              {(
                Number(autoPrintOrder.total || 0) +
                Number(autoPrintOrder.deliveryFee || 0) -
                Number(autoPrintOrder.discount || 0)
              )
                .toFixed(2)
                .replace(".", ",")}
            </span>
          </div>
          <div className="auto-receipt-line" />
          <div className="auto-receipt-center">Obrigado pela preferência!</div>
          <div className="auto-receipt-center" style={{ fontSize: 9 }}>
            Comprovante não fiscal
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="admin-main flex-1 p-4 md:p-6 overflow-auto">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "orders" && <OrdersManager />}
        {activeTab === "manual" && <ManualOrder />}
        {activeTab === "products" && <ProductsManager />}
        {activeTab === "categories" && <CategoriesManager />}
        {activeTab === "delivery" && <DeliveryPanel />}
        {activeTab === "coupons" && <CouponsManager />}
        {activeTab === "marketing" && <MarketingPanel />}
        {activeTab === "settings" && <SettingsPanel />}
        {activeTab === "team" && !isStaff && <TeamManager />}
      </main>
    </div>
  );
}

export default AdminPanel;
