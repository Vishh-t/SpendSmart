import api from "./api.js";

export async function parseStatement(file, includeCredits) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("includeCredits", includeCredits);

    const response = await api.post("/import/parse", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data; // { jobId }
}

export async function getImportJobStatus(jobId) {
    const response = await api.get(`/import/status/${jobId}`);
    return response.data; // { status: PROCESSING|DONE|FAILED, result, error }
}

/**
 * Polls the job status every `intervalMs` until DONE or FAILED.
 * Resolves with the parsed transaction list on DONE, rejects with an Error on FAILED.
 */
export async function pollImportJob(jobId, { intervalMs = 2000, onTick } = {}) {
    while (true) {
        const status = await getImportJobStatus(jobId);
        if (onTick) onTick(status);
        if (status.status === "DONE") return status.result;
        if (status.status === "FAILED") throw new Error(status.error || "Import failed");
        await new Promise(res => setTimeout(res, intervalMs));
    }
}

export async function saveMapping(keyword, categoryId) {
    const response = await api.post(
        `/import/saveMapping?keyword=${encodeURIComponent(keyword)}&categoryId=${categoryId}`
    );
    return response.data;
}

export async function saveMappingsBulk(mappings) {
    const response = await api.post("/import/saveMappingsBulk", mappings);
    return response.data;
}

export async function bulkAddExpenses(items) {
    const response = await api.post("/expense/bulk", items);
    return response.data;
}
