import type { AppData } from "./types";
export const emptyData: AppData = { drivers: [], rickshaws: [], collections: [], expenses: [] };
export const demoData: AppData = {
  drivers: [
    { id: "d1", name: "রহিম মিয়া", phone: "01700000001", address: "রংপুর", status: "active" },
    { id: "d2", name: "করিম উদ্দিন", phone: "01700000002", address: "রংপুর", status: "active" },
    { id: "d3", name: "জসিম", phone: "01700000003", address: "রংপুর", status: "inactive" }
  ],
  rickshaws: Array.from({length: 10}, (_, i) => ({
    id: `r${i+1}`, code: `রিকশা #${String(i+1).padStart(2,"0")}`, model: "প্যাডেল রিকশা",
    status: i === 2 ? "মেরামত" : i === 4 ? "বন্ধ" : "চলছে",
    driverId: i < 3 ? `d${i+1}` : "", dailyRate: 300
  })),
  collections: [], expenses: []
};