import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import type { AppData } from "./types";

type Bucket = keyof AppData;
export function subscribeBucket<T>(uid: string, bucket: Bucket, cb: (rows: T[]) => void, fail: (e: Error) => void) {
  if (!db) return () => {};
  return onSnapshot(collection(db, "users", uid, bucket), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() }) as T));
  }, e => fail(e));
}
export async function createRow(uid: string, bucket: Bucket, row: Record<string, unknown>) {
  if (!db) throw new Error("Firebase সেটআপ করা হয়নি। .env ফাইল পূরণ করুন।");
  const ref = await addDoc(collection(db, "users", uid, bucket), { ...row, createdAt: Date.now() });
  return ref.id;
}
export async function editRow(uid: string, bucket: Bucket, id: string, row: Record<string, unknown>) {
  if (!db) throw new Error("Firebase সেটআপ করা হয়নি।");
  await updateDoc(doc(db, "users", uid, bucket, id), row);
}
export async function removeRow(uid: string, bucket: Bucket, id: string) {
  if (!db) throw new Error("Firebase সেটআপ করা হয়নি।");
  await deleteDoc(doc(db, "users", uid, bucket, id));
}
export async function exportAll(uid: string) {
  if (!db) throw new Error("Firebase সেটআপ করা হয়নি।");
  const buckets: Bucket[] = ["drivers","rickshaws","collections","expenses"];
  const result: Record<string, unknown[]> = {};
  for (const b of buckets) {
    const snap = await getDocs(collection(db, "users", uid, b));
    result[b] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return { version: 2, exportedAt: new Date().toISOString(), data: result };
}
export async function importAll(uid: string, payload: any) {
  if (!db) throw new Error("Firebase সেটআপ করা হয়নি।");
  if (!payload?.data || !["drivers","rickshaws","collections","expenses"].every(k => Array.isArray(payload.data[k]))) {
    throw new Error("ব্যাকআপ ফাইলের ফরম্যাট সঠিক নয়।");
  }
  const batch = writeBatch(db);
  for (const bucket of ["drivers","rickshaws","collections","expenses"] as Bucket[]) {
    for (const item of payload.data[bucket]) {
      const { id, ...rest } = item;
      if (typeof id !== "string" || !id) continue;
      batch.set(doc(db, "users", uid, bucket, id), rest);
    }
  }
  await batch.commit();
}