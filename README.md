# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

```
sigkbak
├─ eslint.config.js
├─ index.html
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ public
│  ├─ data
│  │  └─ kbak.geojson
│  ├─ favicon.svg
│  └─ icons.svg
├─ README.md
├─ src
│  ├─ App.jsx
│  ├─ assets
│  │  ├─ hero.png
│  │  ├─ react.svg
│  │  └─ vite.svg
│  ├─ components
│  │  ├─ Map
│  │  │  ├─ DynamicLayer.jsx
│  │  │  ├─ GeoSearch.jsx
│  │  │  ├─ KBAKLayer.jsx
│  │  │  ├─ MapControls.jsx
│  │  │  ├─ MapView.jsx
│  │  │  └─ PermalinkSync.jsx
│  │  ├─ Sidebar
│  │  │  ├─ FilterPanel.jsx
│  │  │  ├─ LayerControl.jsx
│  │  │  └─ PublicSidebar.jsx
│  │  ├─ UI
│  │  │  ├─ AtributEditor.jsx
│  │  │  └─ MapPickerModal.jsx
│  │  └─ Upload
│  │     ├─ ColumnSelector.jsx
│  │     ├─ JenisCombobox.jsx
│  │     └─ ReviewPanel.jsx
│  ├─ constants
│  │  └─ mapConfig.js
│  ├─ hooks
│  │  ├─ useAuth.js
│  │  ├─ useJenisObjek.js
│  │  ├─ useObjekSpasial.js
│  │  └─ usePreview.js
│  ├─ index.css
│  ├─ lib
│  │  └─ supabase.js
│  ├─ main.jsx
│  ├─ pages
│  │  ├─ admin
│  │  │  ├─ AdminLayout.jsx
│  │  │  ├─ AuditPage.jsx
│  │  │  ├─ ChangePasswordPage.jsx
│  │  │  ├─ DashboardPage.jsx
│  │  │  ├─ DataPage.jsx
│  │  │  ├─ ExportPage.jsx
│  │  │  ├─ JenisPage.jsx
│  │  │  ├─ UploadPage.jsx
│  │  │  └─ UsersPage.jsx
│  │  ├─ LoginPage.jsx
│  │  ├─ PublicMapPage.jsx
│  │  └─ RegisterPage.jsx
│  ├─ router
│  │  └─ index.jsx
│  └─ utils
│     ├─ markerUtils.js
│     └─ parseFile.js
├─ tailwind.config.js
├─ vercel.json
└─ vite.config.js

```