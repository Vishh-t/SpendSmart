import {Navigate, Route, Routes} from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import ExpensesPage from "./pages/ExpensesPage.jsx";
import DashBoard from "./pages/DashBoard.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import CategoriesPage from "./pages/CategoriesPage.jsx";
import Layout from "./components/layout/Layout.jsx";


function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to={"login"}/>}/>
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/dashboard" element={<Layout><DashBoard /></Layout>} />
            <Route path="/expenses" element={<Layout><ExpensesPage /></Layout>} />
            <Route path="/categories" element={<Layout><CategoriesPage /></Layout>} />
            <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
        </Routes>
    )
}

export default App
