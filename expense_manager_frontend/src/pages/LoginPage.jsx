import React, {useState} from 'react';
import {useAuth} from "../context/AuthContext.jsx";
import {loginUser, signUpUser, googleAuth} from "../services/authService.js";
import { useGoogleLogin } from '@react-oauth/google';

function LoginPage() {

    const [activeTab, setActiveTab] = useState("login");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [loginForm, setLoginForm] = useState({username: "", password: ""});
    const [signupForm, setSignUpForm] = useState({name: "", username: "", password: "", email: "", monthlyBudget: ""});

    const {login} = useAuth();

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (response) => {
            setIsLoading(true);
            setError(null);
            try {
                const redirectUri = window.location.origin;
                const data = await googleAuth(response.code, redirectUri);
                login(data);
            } catch (err) {
                console.error("Google auth error:", err.response?.status, err.response?.data);
                setError("Google sign in failed. Please try again.");
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => setError("Google sign in was cancelled or failed."),
        flow: 'auth-code',
    });

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
                <h1 className="text-3xl font-bold text-primary">⬡ Expenzo</h1>
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
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-surface-low" />
                        <span className="text-xs text-text-secondary">OR</span>
                        <div className="flex-1 h-px bg-surface-low" />
                    </div>
                    <button
                        onClick={() => handleGoogleLogin()}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                        style={{
                            backgroundColor: "var(--color-surface-low)",
                            color: "var(--color-text-primary)",
                            border: "1px solid rgba(78,222,163,0.15)"
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(78,222,163,0.4)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(78,222,163,0.15)"}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"/>
                        </svg>
                        Continue with Google
                    </button>
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