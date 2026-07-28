import api from "./api.js";

export async function loginUser(username, password) {
    const response = await api.post("/users/login", {username, password});
    console.log("login success "  )
    return response.data;
}

export async function signUpUser(name, username, password, email, monthlyBudget,) {
    const response = await api.post("/users/signUp", {name, username, password, email, monthlyBudget});
    console.log("signup success");
    return response.data;
}

export async function googleAuth(code, redirectUri) {
    const response = await api.post(
        `/users/auth/google?code=${encodeURIComponent(code)}&redirectUri=${encodeURIComponent(redirectUri)}`
    );
    return response.data;
}


