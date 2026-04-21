import { createBrowserRouter, Navigate } from "react-router-dom";
import { PublicMapPage }  from "../pages/PublicMapPage";
import { LoginPage }      from "../pages/LoginPage";
import { RegisterPage }   from "../pages/RegisterPage";
import { AdminLayout }    from "../pages/admin/AdminLayout";
import { DashboardPage }  from "../pages/admin/DashboardPage";
import { UploadPage }     from "../pages/admin/UploadPage";
import { DataPage }       from "../pages/admin/DataPage";
import { JenisPage }      from "../pages/admin/JenisPage";
import { ExportPage }     from "../pages/admin/ExportPage";
import { AuditPage }      from "../pages/admin/AuditPage";
import { UsersPage }      from "../pages/admin/UsersPage";
import { ChangePasswordPage } from "../pages/admin/ChangePasswordPage"; 

export const router = createBrowserRouter([
    { path: "/",         element: <PublicMapPage /> },
    { path: "/login",    element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },
    {
        path: "/admin",
        element: <AdminLayout />,
        children: [
            { index: true,       element: <Navigate to="/admin/dashboard" replace /> },
            { path: "dashboard", element: <DashboardPage /> },
            { path: "upload",    element: <UploadPage /> },
            { path: "data",      element: <DataPage /> },
            { path: "jenis",     element: <JenisPage /> },
            { path: "export",    element: <ExportPage /> },
            { path: "audit",     element: <AuditPage /> },
            { path: "users",     element: <UsersPage /> },
            { path: "change-password", element: <ChangePasswordPage /> }, 
        ],
    },
]);