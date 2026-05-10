import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { DataProvider } from "./context/DataContext.jsx";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <DataProvider>
                        <App />
                    </DataProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    </StrictMode>,
)
