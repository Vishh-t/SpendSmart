import React, {useState} from 'react';
import {useAuth} from "../context/AuthContext.jsx";
import {loginUser, signUpUser} from "../services/authService.js";

function LoginPage() {

    const [activeTab, setActiveTab] = useState("login");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [loginForm, setLoginForm] = useState({username: "", password: ""});
    const [signupForm, setSignUpForm] = useState({name: "", username: "", password: "", email: "", monthlyBudget: ""});

    const {login} = useAuth();

    function handleLoginChange(e) {
        setLoginForm({...loginForm, [e.target.name]: e.target.value});
    }

    function handleSignupChange(e) {
        setSignUpForm({...signupForm, [e.target.name]: e.target.value});
    }

    async function handleLoginSubmit(e) {
        e.preventDefault();
        setIsLoading(true);
        setError(null)

        try {
            const data = await loginUser(loginForm.username, loginForm.password);
            login(data);
        } catch (err) {
            console.error("Login error:", err.response?.status, err.response?.data);
            setError(err.response?.data || "Invalid credentials. Please try again.");

        } finally {
            setIsLoading(false);
        }
    }

    async function handleSignupSubmit(e) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const data = await signUpUser(signupForm.name,
                signupForm.username,
                signupForm.password,
                signupForm.email,
                signupForm.monthlyBudget || null);
            login(data);

        } catch (err) {
            console.error("Signup error:", err.response?.status, err.response?.data);
            setError(err.response?.data || "Signup failed. Please try again.");

        } finally {
            setIsLoading(false);
        }
    }

    function handleTabSwitch(tab) {
        setActiveTab(tab);
        setError(null);
    }


    return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center">

            {/* Logo */}
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-primary">⬡ SpendSmart</h1>
                <p className="text-xs tracking-widest text-text-secondary mt-1">PRECISION LEDGER</p>
            </div>

            {/* Card */}
            <div className="bg-surface-high rounded-xl p-8 w-full max-w-md">

                {/* Tab Switcher */}
                <div className="flex bg-surface-low rounded-lg p-1 mb-8">
                    <button
                        onClick={() => handleTabSwitch("login")}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                            activeTab === "login"
                                ? "bg-primary text-surface"
                                : "text-text-secondary hover:text-text-primary"
                        }`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => handleTabSwitch("signup")}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                            activeTab === "signup"
                                ? "bg-primary text-surface"
                                : "text-text-secondary hover:text-text-primary"
                        }`}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-error/10 border border-error/20 text-error text-sm rounded-lg px-4 py-3 mb-6">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                {activeTab === "login" && (
                    <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
                        <div>
                            <label className="text-xs font-semibold text-primary tracking-widest">USERNAME</label>
                            <input
                                type="text"
                                name="username"
                                value={loginForm.username}
                                onChange={handleLoginChange}
                                placeholder="alex_pro"
                                required
                                className="mt-2 w-full bg-surface-low text-text-primary placeholder-text-secondary rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-primary tracking-widest">PASSWORD</label>
                                <span className="text-xs text-primary cursor-pointer">FORGOT?</span>
                            </div>
                            <input
                                type="password"
                                name="password"
                                value={loginForm.password}
                                onChange={handleLoginChange}
                                placeholder="••••••••"
                                required
                                className="mt-2 w-full bg-surface-low text-text-primary placeholder-text-secondary rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-surface font-semibold py-3 rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50"
                        >
                            {isLoading ? "Logging in..." : "Login to Dashboard →"}
                        </button>
                    </form>
                )}

                {/* Signup Form */}
                {activeTab === "signup" && (
                    <form onSubmit={handleSignupSubmit} className="flex flex-col gap-5">
                        <div>
                            <label className="text-xs font-semibold text-primary tracking-widest">FULL NAME</label>
                            <input
                                type="text"
                                name="name"
                                value={signupForm.name}
                                onChange={handleSignupChange}
                                placeholder="Alex Rivera"
                                required
                                className="mt-2 w-full bg-surface-low text-text-primary placeholder-text-secondary rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-primary tracking-widest">USERNAME</label>
                            <input
                                type="text"
                                name="username"
                                value={signupForm.username}
                                onChange={handleSignupChange}
                                placeholder="alex_pro"
                                required
                                className="mt-2 w-full bg-surface-low text-text-primary placeholder-text-secondary rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-primary tracking-widest">PASSWORD</label>
                            <input
                                type="password"
                                name="password"
                                value={signupForm.password}
                                onChange={handleSignupChange}
                                placeholder="••••••••"
                                required
                                className="mt-2 w-full bg-surface-low text-text-primary placeholder-text-secondary rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-primary tracking-widest">EMAIL</label>
                            <input
                                type="email"
                                name="email"
                                value={signupForm.email}
                                onChange={handleSignupChange}
                                placeholder="alex@precision.tech"
                                required
                                className="mt-2 w-full bg-surface-low text-text-primary placeholder-text-secondary rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-primary tracking-widest">MONTHLY BUDGET
                                (OPTIONAL)</label>
                            <input
                                type="number"
                                name="monthlyBudget"
                                value={signupForm.monthlyBudget}
                                onChange={handleSignupChange}
                                placeholder="5000"
                                className="mt-2 w-full bg-surface-low text-text-primary placeholder-text-secondary rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-surface font-semibold py-3 rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50"
                        >
                            {isLoading ? "Creating account..." : "Create Account →"}
                        </button>
                    </form>
                )}

                {/* Social Login */}
                <div className="mt-6">
                    <p className="text-center text-xs text-text-secondary mb-4">OR CONTINUE WITH</p>
                    <div className="flex gap-3">
                        <button
                            className="flex-1 flex items-center justify-center gap-2 bg-surface-low text-text-primary py-3 rounded-lg text-sm hover:bg-surface-bright transition-all">
                            Google
                        </button>
                        <button
                            className="flex-1 flex items-center justify-center gap-2 bg-surface-low text-text-primary py-3 rounded-lg text-sm hover:bg-surface-bright transition-all">
                            Apple
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex gap-6 text-xs text-text-secondary">
                <span className="cursor-pointer hover:text-text-primary">PRIVACY POLICY</span>
                <span className="cursor-pointer hover:text-text-primary">TERMS OF SERVICE</span>
                <span className="cursor-pointer hover:text-text-primary">SUPPORT</span>
            </div>
        </div>
    );
}

export default LoginPage;