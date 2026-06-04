import api from "./api.js";

export async function parseStatement(file, includeCredits) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("includeCredits", includeCredits);

    const response = await api.post("/import/parse", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
}

export async function saveMapping(keyword, categoryId) {
    const response = await api.post(
        `/import/saveMapping?keyword=${encodeURIComponent(keyword)}&categoryId=${categoryId}`
    );
    return response.data;
}

export async function bulkAddExpenses(items) {
    const response = await api.post("/expense/bulk", items);
    return response.data;
}
