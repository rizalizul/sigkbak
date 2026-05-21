import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { PublicMapPage } from "../pages/PublicMapPage";
import { LoginPage }     from "../pages/LoginPage";
import { RegisterPage }  from "../pages/RegisterPage";
import { Map, Loader2 }  from "lucide-react";

// Lazy load semua halaman admin agar tidak ikut bundle halaman publik
const AdminLayout       = lazy(() => import("../pages/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const DashboardPage     = lazy(() => import("../pages/admin/DashboardPage").then(m => ({ default: m.DashboardPage })));
const UploadPage        = lazy(() => import("../pages/admin/UploadPage").then(m => ({ default: m.UploadPage })));
const DataPage          = lazy(() => import("../pages/admin/DataPage").then(m => ({ default: m.DataPage })));
const JenisPage         = lazy(() => import("../pages/admin/JenisPage").then(m => ({ default: m.JenisPage })));
const ExportPage        = lazy(() => import("../pages/admin/ExportPage").then(m => ({ default: m.ExportPage })));
const AuditPage         = lazy(() => import("../pages/admin/AuditPage").then(m => ({ default: m.AuditPage })));
const UsersPage         = lazy(() => import("../pages/admin/UsersPage").then(m => ({ default: m.UsersPage })));
const ChangePasswordPage = lazy(() => import("../pages/admin/ChangePasswordPage").then(m => ({ default: m.ChangePasswordPage })));

const AdminFallback = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center gap-3">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center animate-pulse">
            <Map size={18} className="text-white" />
        </div>
        <p className="text-slate-600 font-medium flex items-center gap-2">
            <Loader2 size={15} className="animate-spin" /> Memuat panel admin...
        </p>
    </div>
);

export const router = createBrowserRouter([
    { path: "/",         element: <PublicMapPage /> },
    { path: "/login",    element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },
    {
        path: "/admin",
        element: <Suspense fallback={<AdminFallback />}><AdminLayout /></Suspense>,
        children: [
            { index: true,             element: <Navigate to="/admin/dashboard" replace /> },
            { path: "dashboard",       element: <Suspense fallback={<AdminFallback />}><DashboardPage /></Suspense> },
            { path: "upload",          element: <Suspense fallback={<AdminFallback />}><UploadPage /></Suspense> },
            { path: "data",            element: <Suspense fallback={<AdminFallback />}><DataPage /></Suspense> },
            { path: "jenis",           element: <Suspense fallback={<AdminFallback />}><JenisPage /></Suspense> },
            { path: "export",          element: <Suspense fallback={<AdminFallback />}><ExportPage /></Suspense> },
            { path: "audit",           element: <Suspense fallback={<AdminFallback />}><AuditPage /></Suspense> },
            { path: "users",           element: <Suspense fallback={<AdminFallback />}><UsersPage /></Suspense> },
            { path: "change-password", element: <Suspense fallback={<AdminFallback />}><ChangePasswordPage /></Suspense> },
        ],
    },
]);