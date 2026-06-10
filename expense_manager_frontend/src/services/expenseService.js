import api from "./api.js";

export async function getFinancialSummary() {
    const response = await api.get("/expense/financialSummary");
    return response.data;
}

export async function getBudgetStatus() {
    const response = await api.get("/expense/budgetStatus");
    return response.data;
}

export async function getAnnualSummary(year) {
    const response = await api.get(`/expense/annualSummary?year=${year}`);
    return response.data;
}

export async function getAllExpenses() {
    const response = await api.get("/expense/");
    return response.data;
}

export async function getSortedExpenses(sortBy, order) {
    const response = await api.get(`/expense/sorted?sortBy=${sortBy}&order=${order}`);
    return response.data;
}

export async function getExpensesByCategory(categoryId) {
    const response = await api.get(`/expense/${categoryId}/category`);
    return response.data;
}

export async function getExpensesByDateRange(startDate, endDate) {
    const response = await api.get(`/expense/dateRange?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
}

export async function getMonthlySummary(month, year) {
    const response = await api.get(`/expense/summary?month=${month}&year=${year}`);
    return response.data;
}

export async function addExpense(categoryId, expenseData) {
    const response = await api.post(`/expense/?categoryId=${categoryId}`, expenseData);
    return response.data;
}

export async function updateExpense(expenseId, expenseData) {
    const response = await api.put(`/expense/${expenseId}`, expenseData);
    return response.data;
}

export async function deleteExpense(expenseId) {
    const response = await api.delete(`/expense/${expenseId}`);
    return response.data;
}

export async function getExpenseById(expenseId) {
    const response = await api.get(`/expense/${expenseId}/Id`);
    return response.data;
}

export async function renameKeyword(oldKeyword, newKeyword) {
    const response = await api.patch(`/expense/renameKeyword?oldKeyword=${encodeURIComponent(oldKeyword)}&newKeyword=${encodeURIComponent(newKeyword)}`);
    return response.data;
}