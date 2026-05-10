import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import ExpensesPage from "./pages/ExpensesPage.jsx";
import DashBoard from "./pages/DashBoard.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import CategoriesPage from "./pages/CategoriesPage.jsx";
import Layout from "./components/layout/Layout.jsx";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Layout><DashBoard /></Layout></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><Layout><ExpensesPage /></Layout></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute><Layout><CategoriesPage /></Layout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
        </Routes>
    );
}

export default App;
