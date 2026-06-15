import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import ExpensesPage from "./pages/ExpensesPage.jsx";
import DashBoard from "./pages/DashBoard.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import CategoriesPage from "./pages/CategoriesPage.jsx";
import InsightsPage from "./pages/InsightsPage.jsx";
import Layout from "./components/layout/Layout.jsx";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";

function NotFound() {
    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <p style={{ fontSize: "4rem", fontWeight: 900, color: "var(--color-primary)", fontFamily: "'Berkeley Mono','Courier New',monospace", lineHeight: 1 }}>404</p>
            <p style={{ color: "var(--color-text-primary)", fontWeight: 700, fontSize: "1.1rem" }}>Page not found</p>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>This route doesn't exist in the ledger.</p>
            <a href="/dashboard" style={{ marginTop: "8px", color: "var(--color-primary)", fontSize: "0.85rem", textDecoration: "underline" }}>Go to Dashboard</a>
        </div>
    );
}

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard"  element={<ProtectedRoute><Layout><DashBoard /></Layout></ProtectedRoute>} />
            <Route path="/expenses"   element={<ProtectedRoute><Layout><ExpensesPage /></Layout></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute><Layout><CategoriesPage /></Layout></ProtectedRoute>} />
            <Route path="/insights"   element={<ProtectedRoute><Layout><InsightsPage /></Layout></ProtectedRoute>} />
            <Route path="/profile"    element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default App;
