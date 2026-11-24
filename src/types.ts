export type Driver = { id: string; name: string; phone: string; address: string; status: "active" | "inactive"; createdAt?: number };
export type Rickshaw = { id: string; code: string; model: string; status: "চলছে" | "মেরামত" | "বন্ধ"; driverId: string; dailyRate: number };
export type Collection = { id: string; rickshawId: string; driverId: string; date: string; amount: number; note: string };
export type Expense = { id: string; category: string; amount: number; date: string; description: string };
export type Page = "dashboard" | "collections" | "drivers" | "fleet" | "expenses" | "reports" | "settings";
export type AppData = { drivers: Driver[]; rickshaws: Rickshaw[]; collections: Collection[]; expenses: Expense[] };
