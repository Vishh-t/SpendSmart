import {createContext, useContext, useState} from "react";
import {useNavigate} from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({children}) {

    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);

    const navigate = useNavigate();

    function login(data) {
        const userData = {userId: data.userId, username: data.username};
        setToken(data.token);
        setUser(userData);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(userData));
        navigate("/dashboard");
    }

    function logout() {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    }

    const value = {
        token,
        user,
        login,
        logout,
        isAuthenticated: !!token
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext);
}


