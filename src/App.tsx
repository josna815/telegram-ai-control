import { useEffect, useMemo, useState } from "react";
import {
  Activity, Bell, Bike, BriefcaseBusiness, CalendarDays, ChartNoAxesCombined,
  ChevronDown, CircleHelp, Database, Download, Gauge, LayoutDashboard, LogOut,
  Menu, Plus, Search, Settings, ShieldCheck, Trash2, UserRound, Users, Wallet,
  Wrench, X, FileDown, RefreshCw
} from "lucide-react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { auth, firebaseReady } from "./firebase";
import { createRow, editRow, exportAll, importAll, removeRow, subscribeBucket } from "./store";
import { demoData, emptyData } from "./data";
import type { AppData, Page } from "./types";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const nav: {id:Page; label:string; icon:any}[] = [
  {id:"dashboard",label:"ড্যাশবোর্ড",icon:LayoutDashboard},
  {id:"collections",label:"দৈনিক জমা",icon:Wallet},
  {id:"drivers",label:"চালক ব্যবস্থাপনা",icon:Users},
  {id:"fleet",label:"রিকশা ব্যবস্থাপনা",icon:Bike},
  {id:"expenses",label:"খরচ ও মেরামত",icon:Wrench},
  {id:"reports",label:"রিপোর্ট",icon:ChartNoAxesCombined},
  {id:"settings",label:"সেটিংস ও ব্যাকআপ",icon:Settings}
];
const money = (n:number) => `৳${(n||0).toLocaleString("bn-BD")}`;
const today = () => new Date().toISOString().slice(0,10);

export default function App() {
  const [user,setUser] = useState<User|null>(null);
  const [authLoading,setAuthLoading] = useState(true);
  const [demo,setDemo] = useState(!firebaseReady);
  const [data,setData] = useState<AppData>(emptyData);
  const [page,setPage] = useState<Page>("dashboard");
  const [mobileNav,setMobileNav] = useState(false);
  const [search,setSearch] = useState("");
  const [modal,setModal] = useState<null|"driver"|"rickshaw"|"collection"|"expense">(null);
  const [editing,setEditing] = useState<any>(null);
  const [notice,setNotice] = useState("");
  const [busy,setBusy] = useState(false);

  useEffect(() => {
    if (!auth) { setAuthLoading(false); setDemo(true); setData(demoData); return; }
    return onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); if (u) setDemo(false); });
  },[]);
  useEffect(() => {
    if (!user) return;
    const unsubscribers = (["drivers","rickshaws","collections","expenses"] as const).map(bucket =>
      subscribeBucket<any>(user.uid,bucket,rows => setData(old => ({...old,[bucket]:rows})),e => setNotice(e.message))
    );
    return () => unsubscribers.forEach(fn => fn());
  },[user]);
  useEffect(() => { if (notice) { const t=setTimeout(()=>setNotice(""),4000); return ()=>clearTimeout(t); } },[notice]);

  const totals = useMemo(() => {
    const collected = data.collections.filter(x=>x.date===today()).reduce((s,x)=>s+Number(x.amount||0),0);
    const expenses = data.expenses.filter(x=>x.date===today()).reduce((s,x)=>s+Number(x.amount||0),0);
    const month = new Date().toISOString().slice(0,7);
    const incomeMonth = data.collections.filter(x=>x.date?.startsWith(month)).reduce((s,x)=>s+Number(x.amount||0),0);
    const expenseMonth = data.expenses.filter(x=>x.date?.startsWith(month)).reduce((s,x)=>s+Number(x.amount||0),0);
    return {collected,expenses,incomeMonth,expenseMonth,profit:incomeMonth-expenseMonth};
  },[data]);

  async function save(bucket:"drivers"|"rickshaws"|"collections"|"expenses", row:any) {
    if (!row || !user) {
      if (demo) {
        const id = editing?.id || `${bucket}_${Date.now()}`;
        setData(old=>({...old,[bucket]: editing ? old[bucket].map((x:any)=>x.id===id?{...row,id}:x) : [...old[bucket],{...row,id}]}));
        setModal(null); setEditing(null); setNotice("ডেমো পরিবর্তন এই ব্রাউজারে অস্থায়ীভাবে দেখানো হচ্ছে।"); return;
      }
      setNotice("লগইন করুন অথবা ডেমো মোড ব্যবহার করুন।"); return;
    }
    setBusy(true);
    try {
      if (editing) await editRow(user.uid,bucket,editing.id,row);
      else await createRow(user.uid,bucket,row);
      setModal(null); setEditing(null); setNotice("সফলভাবে সংরক্ষণ হয়েছে।");
    } catch(e:any) { setNotice(e.message || "সংরক্ষণ করা যায়নি।"); }
    finally { setBusy(false); }
  }
  async function erase(bucket:"drivers"|"rickshaws"|"collections"|"expenses",id:string) {
    if (!confirm("আপনি কি নিশ্চিতভাবে মুছে ফেলতে চান?")) return;
    if (demo || !user) { setData(old=>({...old,[bucket]:old[bucket].filter((x:any)=>x.id!==id)})); return; }
    try { await removeRow(user.uid,bucket,id); setNotice("মুছে ফেলা হয়েছে।"); } catch(e:any) { setNotice(e.message); }
  }
  async function backup() {
    try {
      const payload = user ? await exportAll(user.uid) : {version:2,exportedAt:new Date().toISOString(),data};
      const blob = new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
      const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`rickshawpro-backup-${today()}.json`; a.click(); URL.revokeObjectURL(a.href);
    } catch(e:any) { setNotice(e.message); }
  }
  async function restore(file?:File) {
    if (!file) return;
    try {
      const payload=JSON.parse(await file.text());
      if (user) await importAll(user.uid,payload);
      else if (payload.data) setData(payload.data);
      setNotice("ব্যাকআপ ইমপোর্ট সম্পন্ন হয়েছে।");
    } catch(e:any) { setNotice(e.message || "ব্যাকআপ ইমপোর্ট ব্যর্থ।"); }
  }
  function csvExport() {
    const rows = [["তারিখ","খাত","পরিমাণ","বিবরণ"],...data.collections.map(x=>[x.date,"জমা",x.amount,x.note]),...data.expenses.map(x=>[x.date,x.category,x.amount,x.description])];
    const csv = "\uFEFF"+rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})); a.download="rickshawpro-report.csv"; a.click(); URL.revokeObjectURL(a.href);
  }

  if (authLoading) return <div className="center-screen">RickshawPro লোড হচ্ছে…</div>;
  if (firebaseReady && !user && !demo) return <AuthScreen onDemo={()=>{setDemo(true);setData(demoData)}} />;
  if (firebaseReady && !user && !demo) return <AuthScreen onDemo={()=>{setDemo(true);setData(demoData)}} />;

  const currentTitle=nav.find(x=>x.id===page)?.label || "ড্যাশবোর্ড";
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?"show":""}`}>
      <div className="brand"><div className="brand-mark">🛺</div><div><b>RickshawPro</b><small>স্মার্ট ব্যবস্থাপনা সিস্টেম</small></div><button className="close-nav" onClick={()=>setMobileNav(false)}><X/></button></div>
      <div className="profile"><div className="avatar">👨‍💼</div><div><b>{user?.email?.split("@")[0] || "ম্যানেজার"}</b><small><i/> {demo?"ডেমো মোড":"অনলাইন"}</small></div><ChevronDown size={17}/></div>
      <nav>{nav.map(item=>{const Icon=item.icon;return <button key={item.id} className={page===item.id?"active":""} onClick={()=>{setPage(item.id);setMobileNav(false)}}><Icon size={19}/>{item.label}</button>})}</nav>
      <div className="sidebar-bottom"><div className="version"><span>👑</span><b>RickshawPro v2.0</b><small>স্মার্ট ব্যবসার স্মার্ট সমাধান</small></div>{user&&<button className="logout" onClick={()=>signOut(auth!)}><LogOut size={17}/> লগ আউট</button>}</div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="menu-btn" onClick={()=>setMobileNav(true)}><Menu/></button><div className="searchbox"><Search size={18}/><input placeholder="খুঁজুন… (রিকশা, চালক, বা রিপোর্ট)" value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="top-date"><CalendarDays size={17}/>{new Date().toLocaleDateString("bn-BD",{day:"numeric",month:"long",year:"numeric"})}</div><button className="icon-btn" onClick={()=>setNotice("এখন কোনো নতুন নোটিফিকেশন নেই।")}><Bell/><span/></button></header>
      {demo && <div className="demo-banner"><ShieldCheck size={16}/> আপনি ডেমো মোডে আছেন। স্থায়ী ক্লাউড ডেটার জন্য Firebase কনফিগার করে অ্যাকাউন্টে লগইন করুন।</div>}
      <div className="content">
        {page==="dashboard" && <Dashboard data={data} totals={totals} open={(m:any)=>{setEditing(null);setModal(m)}}/>}
        {page==="drivers" && <DataPage title="চালক ব্যবস্থাপনা" subtitle="চালকদের তথ্য যোগ, সম্পাদনা ও পরিচালনা করুন" action={()=>{setEditing(null);setModal("driver")}} actionLabel="নতুন চালক" icon={<Users/>}><Table headers={["নাম","মোবাইল","ঠিকানা","অবস্থা",""]} rows={data.drivers.filter(x=>`${x.name} ${x.phone}`.includes(search)).map(x=>[x.name,x.phone,x.address,x.status==="active"?"সক্রিয়":"নিষ্ক্রিয়",<RowActions edit={()=>{setEditing(x);setModal("driver")}} del={()=>erase("drivers",x.id)}/>])}/></DataPage>}
        {page==="fleet" && <DataPage title="রিকশা ব্যবস্থাপনা" subtitle="আপনার বহরের সব রিকশার অবস্থা ও চালক দেখুন" action={()=>{setEditing(null);setModal("rickshaw")}} actionLabel="নতুন রিকশা" icon={<Bike/>}><Table headers={["রিকশা","মডেল","চালক","দৈনিক ভাড়া","অবস্থা",""]} rows={data.rickshaws.filter(x=>x.code.toLowerCase().includes(search.toLowerCase())).map(x=>[x.code,x.model,data.drivers.find(d=>d.id===x.driverId)?.name||"নির্ধারিত নয়",money(x.dailyRate),<Status value={x.status}/>,<RowActions edit={()=>{setEditing(x);setModal("rickshaw")}} del={()=>erase("rickshaws",x.id)}/>])}/></DataPage>}
        {page==="collections" && <DataPage title="দৈনিক জমা" subtitle="প্রতিদিনের ভাড়া ও জমার হিসাব রাখুন" action={()=>{setEditing(null);setModal("collection")}} actionLabel="জমা যোগ করুন" icon={<Wallet/>}><Table headers={["তারিখ","রিকশা","চালক","জমার পরিমাণ","নোট",""]} rows={data.collections.filter(x=>`${x.date} ${x.note}`.includes(search)).sort((a,b)=>b.date.localeCompare(a.date)).map(x=>[x.date,data.rickshaws.find(r=>r.id===x.rickshawId)?.code||"—",data.drivers.find(d=>d.id===x.driverId)?.name||"—",money(x.amount),x.note,<RowActions edit={()=>{setEditing(x);setModal("collection")}} del={()=>erase("collections",x.id)}/>])}/></DataPage>}
        {page==="expenses" && <DataPage title="খরচ ও মেরামত" subtitle="ব্যবসার খরচ এবং মেরামতের হিসাব রাখুন" action={()=>{setEditing(null);setModal("expense")}} actionLabel="খরচ যোগ করুন" icon={<Wrench/>}><Table headers={["তারিখ","খরচের খাত","পরিমাণ","বিবরণ",""]} rows={data.expenses.filter(x=>`${x.category} ${x.description}`.includes(search)).sort((a,b)=>b.date.localeCompare(a.date)).map(x=>[x.date,x.category,money(x.amount),x.description,<RowActions edit={()=>{setEditing(x);setModal("expense")}} del={()=>erase("expenses",x.id)}/>])}/></DataPage>}
        {page==="reports" && <><PageHeading title="রিপোর্ট ও বিশ্লেষণ" subtitle="আয়, ব্যয় ও লাভের সারসংক্ষেপ"/><div className="stats-grid"><Stat title="মোট জমা" value={money(totals.incomeMonth)} icon={<Wallet/>} color="blue"/><Stat title="মোট খরচ" value={money(totals.expenseMonth)} icon={<Wrench/>} color="orange"/><Stat title="নিট লাভ" value={money(totals.profit)} icon={<ChartNoAxesCombined/>} color="green"/></div><div className="panel report-actions"><h3>রিপোর্ট ডাউনলোড</h3><p>আপনার হিসাব CSV ফাইলে এক্সপোর্ট করুন।</p><button className="primary" onClick={csvExport}><FileDown size={17}/> CSV এক্সপোর্ট</button><button className="secondary" onClick={backup}><Download size={17}/> সম্পূর্ণ JSON ব্যাকআপ</button></div></>}
        {page==="settings" && <><PageHeading title="সেটিংস ও ব্যাকআপ" subtitle="আপনার তথ্য নিরাপদে সংরক্ষণ ও পুনরুদ্ধার করুন"/><div className="settings-grid"><section className="panel"><h3><Database/> ডেটা ব্যাকআপ</h3><p>চালক, রিকশা, জমা ও খরচের সম্পূর্ণ JSON ব্যাকআপ নিন।</p><button className="primary" onClick={backup}><Download size={17}/> ব্যাকআপ ডাউনলোড</button><label className="secondary file-label"><RefreshCw size={17}/> ব্যাকআপ ইমপোর্ট<input type="file" accept=".json,application/json" onChange={e=>restore(e.target.files?.[0])}/></label></section><section className="panel"><h3><ShieldCheck/> নিরাপত্তা</h3><p>Firebase Authentication এবং Firestore Security Rules ব্যবহার করা হয়েছে। প্রতিটি ব্যবহারকারীর ডেটা আলাদা পাথে রাখা হয়।</p><div className="setting-line"><span>সংযোগ</span><b className={firebaseReady&&user?"good":"warn"}>{firebaseReady&&user?"Firebase সংযুক্ত": "ডেমো / কনফিগারেশন বাকি"}</b></div></section></div></>}
      </div>
      <footer>© {new Date().getFullYear()} RickshawPro · আপনার ব্যবসা, আপনার নিয়ন্ত্রণে</footer>
    </main>
    {modal && <RecordModal type={modal} initial={editing} data={data} close={()=>{setModal(null);setEditing(null)}} save={save} busy={busy}/>}
    {notice&&<div className="toast">{notice}<button onClick={()=>setNotice("")}><X size={15}/></button></div>}
  </div>;
}

function AuthScreen({onDemo}:{onDemo:()=>void}) {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [mode,setMode]=useState<"login"|"register">("login"); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent) { e.preventDefault(); setError(""); if(!auth)return; setBusy(true); try { if(mode==="login") await signInWithEmailAndPassword(auth,email,password); else await createUserWithEmailAndPassword(auth,email,password); } catch(err:any){setError(err.message||"অ্যাকাউন্টে প্রবেশ করা যায়নি।");} finally{setBusy(false);} }
  return <div className="auth-wrap"><form className="auth-card" onSubmit={submit}><div className="auth-logo">🛺</div><h1>RickshawPro</h1><p>আপনার রিকশা ব্যবসার স্মার্ট নিয়ন্ত্রণ কেন্দ্র</p><div className="auth-tabs"><button type="button" className={mode==="login"?"selected":""} onClick={()=>setMode("login")}>লগইন</button><button type="button" className={mode==="register"?"selected":""} onClick={()=>setMode("register")}>নতুন অ্যাকাউন্ট</button></div><label>ইমেইল<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com"/></label><label>পাসওয়ার্ড<input type="password" minLength={6} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="কমপক্ষে ৬ অক্ষর"/></label>{error&&<div className="error">{error}</div>}<button className="primary full" disabled={busy}>{busy?"অপেক্ষা করুন…":mode==="login"?"লগইন করুন":"অ্যাকাউন্ট তৈরি করুন"}</button><button type="button" className="secondary full" onClick={onDemo}>ডেমো হিসেবে দেখুন</button><small>আপনার Firebase API key শুধু .env ফাইলে দিন, এখানে নয়।</small></form></div>;
}
function PageHeading({title,subtitle}:{title:string;subtitle:string}) {return <div className="page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div></div>}
function Stat({title,value,icon,color}:{title:string;value:string;icon:any;color:string}) {return <div className="stat-card"><div className={`stat-icon ${color}`}>{icon}</div><div><span>{title}</span><b>{value}</b></div></div>}
function Dashboard({data,totals,open}:{data:AppData;totals:any;open:(m:string)=>void}) {
  const chart=[{month:"জানু",income:12000,expense:7000},{month:"ফেব্রু",income:14500,expense:8500},{month:"মার্চ",income:15800,expense:9200},{month:"এপ্রিল",income:17500,expense:9500},{month:"মে",income:13500,expense:7200},{month:"জুন",income:19500,expense:8800}];
  return <><section className="hero"><div><span className="eyebrow">স্মার্ট রিকশা ম্যানেজমেন্ট</span><h1>স্বাগতম, ম্যানেজার</h1><h2>আপনার ব্যবসা, এখন আরও নিয়ন্ত্রণে</h2><p>RickshawPro — দৈনিক হিসাব, চালক ও বহর ব্যবস্থাপনার আধুনিক সমাধান</p></div><div className="hero-art">🛺<span>🌳</span></div></section>
    <div className="stats-grid"><Stat title="মোট রিকশা" value={data.rickshaws.length.toLocaleString("bn-BD")} icon={<Bike/>} color="blue"/><Stat title="সক্রিয় চালক" value={data.drivers.filter(x=>x.status==="active").length.toLocaleString("bn-BD")} icon={<Users/>} color="green"/><Stat title="আজকের জমা" value={money(totals.collected)} icon={<Wallet/>} color="purple"/><Stat title="দৈনিক ভাড়া (ডিফল্ট)" value={money(300)} icon={<CalendarDays/>} color="orange"/></div>
    <div className="dashboard-grid"><section className="panel fleet-panel"><div className="panel-head"><h3><Bike/> রিকশা সমূহের বর্তমান অবস্থা</h3><span>{data.rickshaws.length}টি</span></div><div className="fleet-cards">{data.rickshaws.slice(0,5).map(r=><div className="fleet-card" key={r.id}><div className="rickshaw-emoji">🛺</div><b>{r.code}</b><Status value={r.status}/></div>)}</div></section><section className="panel activity-panel"><div className="panel-head"><h3><Activity/> সাম্প্রতিক কার্যকলাপ</h3></div>{[...data.collections.slice(-3).reverse().map(x=>({text:`${x.rickshawId} এর জমা: ${money(x.amount)}`,date:x.date,icon:"৳"})),...data.expenses.slice(-2).reverse().map(x=>({text:`${x.category}: ${money(x.amount)}`,date:x.date,icon:"🔧"}))].slice(0,5).map((x,i)=><div className="activity-row" key={i}><span>{x.icon}</span><div><b>{x.text}</b><small>{x.date}</small></div></div>)}{!data.collections.length&&!data.expenses.length&&<div className="empty">এখনো কোনো কার্যকলাপ নেই।</div>}</section></div>
    <div className="dashboard-grid bottom-grid"><section className="panel chart-panel"><div className="panel-head"><h3><ChartNoAxesCombined/> মাসিক জমা ও ব্যয়ের সারাংশ</h3><small>নমুনা চার্ট</small></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month"/><YAxis/><Tooltip formatter={(v:any)=>money(Number(v))}/><Bar dataKey="income" name="জমা" fill="#10a66a" radius={[5,5,0,0]}/><Bar dataKey="expense" name="ব্যয়" fill="#ff9b32" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></section><section className="panel summary-panel"><h3>সারসংক্ষেপ</h3><div><span>এই মাসের মোট জমা</span><b className="green-text">{money(totals.incomeMonth)}</b></div><div><span>এই মাসের মোট ব্যয়</span><b>{money(totals.expenseMonth)}</b></div><div><span>নিট লাভ</span><b className="green-text">{money(totals.profit)}</b></div><button className="text-btn" onClick={()=>open("collection")}>+ নতুন জমা যোগ করুন</button></section></div>
  </>;
}
function DataPage({title,subtitle,action,actionLabel,icon,children}:{title:string;subtitle:string;action:()=>void;actionLabel:string;icon:any;children:any}) {return <><PageHeading title={title} subtitle={subtitle}/><section className="panel table-panel"><div className="table-toolbar"><h3>{icon} {title}</h3><button className="primary" onClick={action}><Plus size={17}/>{actionLabel}</button></div>{children}</section></>}
function Table({headers,rows}:{headers:string[];rows:any[][]}) {return <div className="table-wrap"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.length?rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>):<tr><td colSpan={headers.length} className="empty">কোনো তথ্য পাওয়া যায়নি। নতুন তথ্য যোগ করুন।</td></tr>}</tbody></table></div>}
function Status({value}:{value:string}) {return <span className={`status ${value==="চলছে"||value==="সক্রিয়"?"ok":value==="মেরামত"?"repair":"off"}`}>{value}</span>}
function RowActions({edit,del}:{edit:()=>void;del:()=>void}) {return <div className="row-actions"><button onClick={edit}>সম্পাদনা</button><button className="delete" onClick={del}><Trash2 size={15}/></button></div>}
function RecordModal({type,initial,data,close,save,busy}:{type:string;initial:any;data:AppData;close:()=>void;save:(bucket:any,row:any)=>void;busy:boolean}) {
  const [form,setForm]=useState<any>(initial||({date:today(),status:"active",dailyRate:300,amount:"",note:"",description:""}));
  const update=(k:string,v:any)=>setForm((old:any)=>({...old,[k]:v}));
  const config:any={driver:{title:"চালকের তথ্য",bucket:"drivers",fields:[["name","চালকের নাম","text"],["phone","মোবাইল নম্বর","tel"],["address","ঠিকানা","text"]]},rickshaw:{title:"রিকশার তথ্য",bucket:"rickshaws",fields:[["code","রিকশার নম্বর","text"],["model","মডেল","text"],["driverId","চালক নির্বাচন","driver"],["dailyRate","দৈনিক ভাড়া","number"],["status","অবস্থা","status"]]},collection:{title:"দৈনিক জমা",bucket:"collections",fields:[["date","তারিখ","date"],["rickshawId","রিকশা নির্বাচন","rickshaw"],["driverId","চালক নির্বাচন","driver"],["amount","জমার পরিমাণ","number"],["note","নোট","text"]]},expense:{title:"খরচের তথ্য",bucket:"expenses",fields:[["date","তারিখ","date"],["category","খরচের খাত","text"],["amount","পরিমাণ","number"],["description","বিবরণ","text"]]}}[type];
  function submit(e:React.FormEvent){e.preventDefault();const row={...form}; if(type==="driver")row.status=form.status||"active"; if(type==="rickshaw"){row.dailyRate=Number(row.dailyRate);row.driverId=row.driverId||"";} if(type==="collection"||type==="expense")row.amount=Number(row.amount); save(config.bucket,row);}
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><form className="modal" onSubmit={submit}><div className="modal-head"><h2>{initial?"তথ্য সম্পাদনা":config.title}</h2><button type="button" onClick={close}><X/></button></div>{config.fields.map(([key,label,kind]:string[])=><label key={key}>{label}{kind==="driver"||kind==="rickshaw"?<select required={key==="rickshawId"} value={form[key]||""} onChange={e=>update(key,e.target.value)}><option value="">নির্বাচন করুন</option>{(kind==="driver"?data.drivers:data.rickshaws).map((x:any)=><option value={x.id} key={x.id}>{kind==="driver"?x.name:x.code}</option>)}</select>:kind==="status"?<select value={form.status||"চলছে"} onChange={e=>update("status",e.target.value)}><option>চলছে</option><option>মেরামত</option><option>বন্ধ</option></select>:<input required={["name","code","date","amount","category"].includes(key)} type={kind} min={kind==="number"?0:undefined} value={form[key]??""} onChange={e=>update(key,e.target.value)}/>}</label>)}<div className="modal-actions"><button type="button" className="secondary" onClick={close}>বাতিল</button><button className="primary" disabled={busy}>{busy?"সংরক্ষণ হচ্ছে…":"সংরক্ষণ করুন"}</button></div></form></div>;
}
