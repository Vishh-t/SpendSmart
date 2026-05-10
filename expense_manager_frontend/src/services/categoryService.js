import api from "./api.js";

export async function getAllCategories() {
    const response = await api.get("/category/");
    return response.data;
}

export async function addCategory(categoryName) {
    const response = await api.post("/category/add", { categoryName });
    return response.data;
}

export async function deleteCategory(categoryId) {
    const response = await api.delete(`/category/${categoryId}`);
    return response.data;
}