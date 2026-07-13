import { createBrowserRouter } from "react-router";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Subscriptions from "./pages/Subscriptions";
import Budgets from "./pages/Budgets";
import Analytics from "./pages/Analytics";
import Calendar from "./pages/Calendar";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import MainLayout from "./components/MainLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/dashboard",
    Component: MainLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "expenses", Component: Expenses },
      { path: "subscriptions", Component: Subscriptions },
      { path: "budgets", Component: Budgets },
      { path: "analytics", Component: Analytics },
      { path: "calendar", Component: Calendar },
      { path: "notifications", Component: Notifications },
      { path: "settings", Component: Settings },
    ],
  },
]);