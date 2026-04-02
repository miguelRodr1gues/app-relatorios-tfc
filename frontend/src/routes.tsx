import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Relatorios from "./pages/Relatorios";
import Tabelas from "./pages/Tabelas";
import Analises from "./pages/Analises";
import Settings from "./pages/Settings";
import Estrutura from "./pages/Estrutura";

export const router = createBrowserRouter([
    {
        path: "/",
        Component: Layout,
        children: [
            { index: true, Component: Dashboard },
            { path: "relatorios", Component: Relatorios },
            { path: "tabelas", Component: Tabelas },
            { path: "estrutura", Component: Estrutura },
            { path: "analises", Component: Analises },
            { path: "settings", Component: Settings },
        ],
    },
]);