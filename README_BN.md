# RickshawPro Full-Stack v2.0

RickshawPro হলো বাংলা ভাষার রিকশা ব্যবসা ব্যবস্থাপনা ওয়েব অ্যাপ। এই সংস্করণে React + TypeScript + Vite frontend, Firebase Authentication, Cloud Firestore, CSV export এবং JSON backup/restore scaffold দেওয়া হয়েছে।

## ফিচার
- ড্যাশবোর্ড, রিকশা বহর, চালক, দৈনিক জমা, খরচ/মেরামত, রিপোর্ট
- Firebase Email/Password login এবং registration
- Firestore realtime subscription; প্রতি ব্যবহারকারীর ডেটা `users/{uid}/...` পাথে
- JSON backup/restore এবং CSV export
- Responsive mobile UI
- Demo mode: Firebase configure না থাকলেও UI sample data দিয়ে দেখা যাবে

## চালু করার নিয়ম
1. Node.js 18 বা নতুন সংস্করণ ইনস্টল করুন।
2. টার্মিনালে project folder খুলে `npm install` চালান।
3. `.env.example` কপি করে `.env` বানান।
4. Firebase Console-এ একটি project তৈরি করুন; Authentication থেকে Email/Password enable করুন; Firestore Database তৈরি করুন।
5. Firebase Web App config-এর মান `.env`-এ বসান। কোনো secret বা API key GitHub-এ commit করবেন না।
6. Firebase Console-এর Firestore Rules-এ `firestore.rules` প্রকাশ করুন।
7. `npm run dev` চালিয়ে local preview দেখুন।
8. Production build: `npm run build`; Firebase Hosting deploy: `firebase deploy`.

## Firebase data structure
`users/{uid}/drivers/{driverId}`
`users/{uid}/rickshaws/{rickshawId}`
`users/{uid}/collections/{collectionId}`
`users/{uid}/expenses/{expenseId}`

প্রতিটি user কেবল নিজের UID-এর অধীনে থাকা ডেটা পড়তে/লিখতে পারবে—এটি Firestore Rules দ্বারা enforce করা হয়।

## গুরুত্বপূর্ণ সীমাবদ্ধতা / production checklist
- Firebase project, Auth provider, Firestore database, environment variables এবং Hosting deploy ব্যবহারকারীকে নিজের Google account-এ configure করতে হবে।
- এই starter-এ client-side validation আছে; production-এ আরও শক্ত schema validation, audit logs, role-based staff access, rate limiting, automated tests, monitoring এবং scheduled backups যোগ করা উচিত।
- Demo mode-এর sample data cloud-এ সংরক্ষিত হয় না। Firebase সংযুক্ত করে login করলে cloud data ব্যবহার হবে।
- Dashboard chart-এ আপাতত illustrative sample monthly series আছে; Reports summary প্রকৃত সংরক্ষিত collection/expense data থেকে হিসাব করে।
- Currency/default daily rent ৳300 হলো আগের প্রজেক্টের default; Settings থেকে configurable rent policy এই সংস্করণে এখনও যোগ করা হয়নি।
- Backup import বর্তমান ডেটা overwrite করে না; একই ID-তে merge/update করে।
- Authentication account তৈরি করলে user profile document স্বয়ংক্রিয়ভাবে তৈরি হয় না; data collections প্রথম insert-এর সময় তৈরি হবে।

## ফোল্ডার
- `src/App.tsx` — screens, auth UI, forms and dashboard
- `src/store.ts` — Firestore CRUD, realtime listeners, backup
- `src/firebase.ts` — Firebase initialization
- `firestore.rules` — per-user isolation
- `firebase.json` — Hosting + Firestore rules config
