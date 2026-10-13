// Helpers de persistência em localStorage com SSR-safety e validação de dados.
// Centraliza a leitura/escrita para evitar falhas silenciosas (JSON corrompido,
// formatos inesperados) e crashes durante renderização no servidor.

export function isStorageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

/** Lê e valida um item do localStorage. Retorna o fallback em qualquer falha. */
export function loadJson<T>(
  key: string,
  fallback: T,
  validate?: (value: unknown) => value is T,
): T {
  if (!isStorageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (validate) return validate(parsed) ? parsed : fallback;
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/** Escreve um item no localStorage sem lançar exceções (quota/QoS/SSR). */
export function saveJson(key: string, value: unknown): boolean {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // QuotaExceededError ou storage bloqueado — degradação graciosa.
    console.warn(`[storage] Falha ao salvar "${key}" no localStorage.`);
    return false;
  }
}

// ---------- Validadores de domínio ----------

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;
const bool = (v: unknown, fallback = false): boolean => (typeof v === "boolean" ? v : fallback);

/** Lê uma propriedade de um registro validado sem violar `noPropertyAccessFromIndexSignature`. */
const prop = (v: Record<string, unknown>, key: string): unknown => v[key];

/** Retorna a propriedade como string quando validada, ou o fallback. */
const strProp = (v: Record<string, unknown>, key: string, fallback = ""): string => {
  const value = prop(v, key);
  return typeof value === "string" ? value : fallback;
};

/** Normaliza adicionais de produto vindos do storage. */
function normalizeAddOns(raw: unknown): import("./types").ProductAddOn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isRecord)
    .filter((a) => typeof prop(a, "id") === "string" && typeof prop(a, "name") === "string")
    .map((a) => ({
      id: prop(a, "id") as string,
      name: prop(a, "name") as string,
      price: num(prop(a, "price"), 0),
    }));
}

/** Normaliza um produto vindo do storage; retorna null se for irrecuperável. */
export function normalizeProduct(v: unknown): import("./types").Product | null {
  if (!isRecord(v)) return null;
  const id = strProp(v, "id");
  const name = strProp(v, "name");
  if (!id || !name) return null;
  const product: import("./types").Product = {
    id,
    name,
    description: str(prop(v, "description")),
    price: num(prop(v, "price"), 0),
    image: str(prop(v, "image")),
    categoryId: str(prop(v, "categoryId")),
    popular: bool(prop(v, "popular")),
    available: bool(prop(v, "available"), true),
  };
  // exactOptionalPropertyTypes: só define a chave quando houver dados válidos.
  const addOns = normalizeAddOns(prop(v, "addOns"));
  if (addOns.length > 0) product.addOns = addOns;
  return product;
}

export function isProductArray(v: unknown): v is import("./types").Product[] {
  if (!Array.isArray(v)) return false;
  return v.every((item) => normalizeProduct(item) !== null);
}

/** Normaliza uma categoria vinda do storage; retorna null se irrecuperável. */
export function normalizeCategory(v: unknown): import("./types").Category | null {
  if (!isRecord(v)) return null;
  const id = strProp(v, "id");
  const name = strProp(v, "name");
  if (!id || !name) return null;
  return { id, name, icon: str(prop(v, "icon"), "🍔"), order: num(prop(v, "order"), 0) };
}

export function isCategoryArray(v: unknown): v is import("./types").Category[] {
  if (!Array.isArray(v)) return false;
  return v.every((item) => normalizeCategory(item) !== null);
}

/** Normaliza um pedido vindo do storage; retorna null se irrecuperável. */
export function normalizeOrder(v: unknown): import("./types").Order | null {
  if (!isRecord(v)) return null;
  const orderId = strProp(v, "id");
  if (!orderId) return null;
  const items: import("./types").CartItem[] = Array.isArray(prop(v, "items"))
    ? (prop(v, "items") as unknown[])
        .map((rawItem) => {
          if (!isRecord(rawItem)) return null;
          const product = normalizeProduct(rawItem["product"]);
          if (!product) return null;
          const item: import("./types").CartItem = {
            product,
            quantity: Math.max(1, Math.round(num(rawItem["quantity"], 1))),
          };
          // exactOptionalPropertyTypes: só define chaves opcionais quando válidas.
          if (typeof rawItem["observation"] === "string") item.observation = rawItem["observation"];
          const addOns = normalizeAddOns(rawItem["selectedAddOns"]);
          if (addOns.length > 0) item.selectedAddOns = addOns;
          return item;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
    : [];
  const statuses = ["pending", "preparing", "delivering", "completed", "cancelled"] as const;
  const status = statuses.includes(v["status"] as (typeof statuses)[number])
    ? (v["status"] as import("./types").Order["status"])
    : "pending";
  const order: import("./types").Order = {
    id: orderId,
    items,
    total: num(v["total"], 0),
    deliveryFee: num(v["deliveryFee"], 0),
    status,
    customerName: str(v["customerName"]),
    customerPhone: str(v["customerPhone"]),
    customerAddress: str(v["customerAddress"]),
    createdAt: str(v["createdAt"], new Date().toISOString()),
    updatedAt: str(v["updatedAt"], new Date().toISOString()),
  };
  if (v["deliveryType"] === "pickup" || v["deliveryType"] === "delivery") {
    order.deliveryType = v["deliveryType"];
  }
  if (
    v["paymentMethod"] === "card" ||
    v["paymentMethod"] === "pix" ||
    v["paymentMethod"] === "cash"
  ) {
    order.paymentMethod = v["paymentMethod"];
  }
  if (typeof v["changeFor"] === "number" && Number.isFinite(v["changeFor"])) {
    order.changeFor = v["changeFor"];
  }
  return order;
}

export function isOrderArray(v: unknown): v is import("./types").Order[] {
  if (!Array.isArray(v)) return false;
  return v.every((item) => normalizeOrder(item) !== null);
}

/** Normaliza a configuração da loja, preenchendo campos ausentes com defaults. */
export function normalizeConfig(
  v: unknown,
  defaults: import("./types").StoreConfig,
): import("./types").StoreConfig {
  if (!isRecord(v)) return defaults;
  const config: import("./types").StoreConfig = {
    ...defaults,
    name: str(v["name"], defaults.name),
    subtitle: str(v["subtitle"], defaults.subtitle),
    phone: str(v["phone"], defaults.phone),
    address: str(v["address"], defaults.address),
    deliveryFee: num(v["deliveryFee"], defaults.deliveryFee),
    minOrder: num(v["minOrder"], defaults.minOrder),
    openTime: str(v["openTime"], defaults.openTime),
    closeTime: str(v["closeTime"], defaults.closeTime),
    isOpen: bool(v["isOpen"], defaults.isOpen),
  };
  // exactOptionalPropertyTypes: só define logoUrl quando for string não vazia.
  if (typeof v["logoUrl"] === "string" && v["logoUrl"]) config.logoUrl = v["logoUrl"];
  return config;
}

/** Normaliza zonas de entrega; descarta entradas inválidas. */
export function normalizeDeliveryZones(v: unknown): import("./types").DeliveryZone[] | null {
  if (!Array.isArray(v)) return null;
  const zones = (v as unknown[])
    .filter(isRecord)
    .filter((z) => typeof prop(z, "id") === "string" && typeof prop(z, "name") === "string")
    .map((z) => ({
      id: prop(z, "id") as string,
      name: prop(z, "name") as string,
      price: num(prop(z, "price"), 0),
      estimatedTime: str(prop(z, "estimatedTime")),
      coordinates: Array.isArray(prop(z, "coordinates"))
        ? (prop(z, "coordinates") as unknown[])
            .filter(isRecord)
            .filter((c) => typeof prop(c, "lat") === "number" && typeof prop(c, "lng") === "number")
            .map((c) => ({ lat: prop(c, "lat") as number, lng: prop(c, "lng") as number }))
        : [],
    }));
  return zones.length > 0 || v.length === 0 ? zones : null;
}
