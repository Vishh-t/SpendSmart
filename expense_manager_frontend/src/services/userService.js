import api from "./api.js";

// GET /users/ — fetch logged in user's info (name, username, email, budget)
export async function getUserInfo() {
    const response = await api.get("/users/");
    return response.data;
}

// PUT /users/budget?newBudget= — update monthly budget
export async function updateBudget(newBudget) {
    const response = await api.put(`/users/budget?newBudget=${newBudget}`);
    return response.data;
}

// DELETE /users/ — delete account permanently
export async function deleteAccount() {
    const response = await api.delete("/users/");
    return response.data;
}
