# Google AI Studio Build Mode — RickshawPro Production Completion Prompt

তুমি একজন senior full-stack engineer ও security-focused architect। এই repository-কে production-ready RickshawPro SaaS-ready web app-এ উন্নত করো। বর্তমান React + TypeScript + Vite + Firebase architecture এবং বাংলা UI বজায় রাখবে।

## বাধ্যতামূলক কাজ
1. বিদ্যমান UI এবং CRUD behaviour ভেঙে না দিয়ে সব screen end-to-end সম্পন্ন করো।
2. Firebase Auth: email/password, password reset, logout, auth persistence, user profile setup।
3. Firestore schema: users/{uid}/drivers, rickshaws, collections, expenses, settings, auditLogs।
4. Security Rules: user isolation, schema validation, immutable owner UID, safe field types; rules emulator tests যোগ করো।
5. Business logic: রিকশা status, driver assignment uniqueness (এক চালক/এক সক্রিয় রিকশা), duplicate daily collection warning, due collection, date range reports, net profit।
6. Settings: default daily rent, business name, timezone, currency; all totals settings-aware।
7. Dashboard charts must use actual database aggregates, not demo chart constants. Clearly label empty state.
8. Search, pagination, sort, form validation, loading/error/empty states, confirmation dialogs, responsive mobile navigation।
9. Backup export/import with format validation, file size guard, duplicate handling, progress feedback.
10. CSV export with Bengali UTF-8 BOM; date range filter and print-friendly report.
11. Add automated unit/integration tests and a manual QA checklist.
12. Add deployment instructions for Firebase Hosting and environment configuration. Never hardcode keys.
13. Add README in Bengali and English. Do not claim deployment is complete until a real deploy succeeds.

## Quality gate
- `npm run typecheck` and `npm run build` must pass.
- No fake production data in real account.
- No exposed secrets, no permissive Firestore rules.
- Check mobile widths 360px, 390px, 768px, desktop 1440px.
- List every changed file and unresolved production requirement.
