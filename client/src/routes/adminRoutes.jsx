import { lazy } from "react";

// import AuthGuard from "../utils/route-guard/AuthGuard";
import MainLayout from "../admin/layout/mainLayout";
// import Loadable from "../ui-component/Loadable";
import Dashboard from "../admin/pages/dashboard"
import UserManagement from "../admin/pages/users"

const AdminRoutes = {
  path: "/admin",
  element: (
    <MainLayout />
  ),
  children: [
    {
      path: "dashboard",
      element: <Dashboard />,
    },
    {
      path: "users",
      element: <UserManagement />,
    },
  ],
};

export default AdminRoutes;
