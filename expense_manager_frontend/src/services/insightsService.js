import api from "./api.js";

export async function getAnomalies(month, year) {
    const params = {};
    if (month != null) params.month = month;
    if (year  != null) params.year  = year;
    const response = await api.get("/insights/anomalyDetector", { params });
    return response.data;
}

export async function getMerchantLeaderboard() {
    const response = await api.get("/insights/merchantLeaderboard");
    return response.data;
}

export async function getSubscriptionTracker() {
    const response = await api.get("/insights/subscriptionTracker");
    return response.data;
}

export async function getWeeklyDNA(months) {
    const params = {};
    if (months != null) params.months = months;
    const response = await api.get("/insights/weeklyDNA", { params });
    return response.data;
}

export async function getDailyBurnRate() {
    const response = await api.get("/insights/dailyBurnRate");
    return response.data;
}

export async function getMonthlyDelta(month1, year1, month2, year2) {
    const params = {};
    if (month1 != null) params.month1 = month1;
    if (year1  != null) params.year1  = year1;
    if (month2 != null) params.month2 = month2;
    if (year2  != null) params.year2  = year2;
    const response = await api.get("/insights/monthlyDelta", { params });
    return response.data;
}
