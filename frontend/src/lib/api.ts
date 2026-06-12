import axios, { type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ApiTableColumn {
    n: string;
    label: string;
    type: "text" | "number" | "date";
}

export interface ApiTableRelation {
    key: string;
    name: string;
    from_column: string;
    to_column: string;
    direction: "incoming" | "outgoing";
}

export type ReportColumnInput =
    | string
    | { n: string; name: string; key: string; label: string }
    | { table: string; column: string };

export type ReportFilterInput = Record<string, unknown>;

export interface ApiTableDefinition {
    key: string;
    schema: string;
    name: string;
    rows: number;
    cols: number;
    columns: ApiTableColumn[];
    related_tables: ApiTableRelation[];
}

export interface SavedReport {
    id: string;
    owner: number | string;
    name: string;
    description: string;
    base_table: string;
    table: string;
    related_tables: string[];
    columns: Array<string | { table: string; column: string }>;
    filters: ReportFilterInput[];
    is_public: boolean;
    record_count: number;
    created_at: string;
}

export interface ReportPreviewResponse {
    columns: string[];
    rows: Array<Record<string, unknown>>;
    total_preview_rows: number;
}

export interface PreviewReportPayload {
    base_table: string;
    related_tables: string[];
    columns: ReportColumnInput[];
    filters: ReportFilterInput[];
}

export interface CreateReportPayload extends PreviewReportPayload {
    name: string;
    description: string;
    is_public: boolean;
    generate_files: boolean;
}

export interface SchemaColumn {
    name: string;
    type: string;
    nullable: boolean;
}

export interface SchemaRelation {
    from_column: string;
    to_table: string;
    to_column: string;
}

export interface SchemaTable {
    table: string;
    columns: SchemaColumn[];
    relations: SchemaRelation[];
}

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

type ApiErrorPayload = string | {
    error?: unknown;
    detail?: unknown;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
};

const AUTH_REFRESH_EXCLUDED_PATHS = [
    "/api/auth/login/",
    "/api/auth/register/",
    "/api/auth/verify-code/",
    "/api/auth/refresh/",
    "/api/auth/logout/",
    "/api/auth/google/",
];

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function toFiniteNumber(value: unknown, fallback = 0): number {
    const numberValue = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
}

function extractMessageFromPayload(payload: ApiErrorPayload | undefined): string | null {
    if (typeof payload === "string" && payload.trim()) {
        return payload;
    }

    if (!isRecord(payload)) {
        return null;
    }

    if (typeof payload.error === "string" && payload.error.trim()) {
        return payload.error;
    }

    if (typeof payload.detail === "string" && payload.detail.trim()) {
        return payload.detail;
    }

    return null;
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError<ApiErrorPayload>(error)) {
        return extractMessageFromPayload(error.response?.data) || error.message || fallback;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
}

let isRefreshing = false;
let refreshQueue: Array<{ resolve: () => void; reject: (error: unknown) => void }> = [];

function flushRefreshQueue(error?: unknown) {
    refreshQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
            return;
        }
        resolve();
    });
    refreshQueue = [];
}

api.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
        if (!axios.isAxiosError(error)) {
            return Promise.reject(error);
        }

        const originalRequest = error.config as RetryableRequestConfig | undefined;
        const status = error.response?.status;
        const requestUrl = originalRequest?.url ?? "";

        if (status !== 401 || !originalRequest || originalRequest._retry) {
            return Promise.reject(error);
        }

        if (AUTH_REFRESH_EXCLUDED_PATHS.some((path) => requestUrl.includes(path))) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
            await new Promise<void>((resolve, reject) => {
                refreshQueue.push({ resolve, reject });
            });
            return api(originalRequest);
        }

        try {
            isRefreshing = true;
            await api.post("/api/auth/refresh/", {});
            flushRefreshQueue();
            return api(originalRequest);
        } catch (refreshError) {
            flushRefreshQueue(refreshError);
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

const normalizeTableDefinition = (rawTableDefinition: Partial<ApiTableDefinition> & {
    key: string;
    name: string;
    columns: ApiTableColumn[];
    related_tables: ApiTableRelation[];
}): ApiTableDefinition => ({
    key: rawTableDefinition.key,
    schema: rawTableDefinition.schema || "public",
    name: rawTableDefinition.name,
    rows: toFiniteNumber(rawTableDefinition.rows),
    cols: toFiniteNumber(rawTableDefinition.cols, rawTableDefinition.columns.length || 0),
    columns: Array.isArray(rawTableDefinition.columns) ? rawTableDefinition.columns : [],
    related_tables: Array.isArray(rawTableDefinition.related_tables) ? rawTableDefinition.related_tables : [],
});

export async function fetchTableDefinitions(searchParams: { q?: string; schema?: string } = {}) {
    const response = await api.get<ApiTableDefinition[]>("/api/entities/", {
        params: {
            q: searchParams.q || undefined,
            schema: searchParams.schema || undefined,
        },
    });

    const tableDefinitions = Array.isArray(response.data) ? response.data : [];
    return tableDefinitions.map(normalizeTableDefinition);
}

export async function fetchSchemaExplorer(): Promise<SchemaTable[]> {
    const response = await api.get<{ tables: SchemaTable[] }>("/api/schema/");
    const tables = response.data.tables;
    return Array.isArray(tables) ? tables : [];
}

export async function getReports(): Promise<SavedReport[]> {
    const resp = await api.get<SavedReport[]>("/api/reports/");
    return Array.isArray(resp.data) ? resp.data : [];
}

export async function deleteReport(reportId: string): Promise<void> {
    await api.delete(`/api/reports/${reportId}/`);
}

export async function downloadReport(reportId: string, exportFormat: "json" | "csv" | "pdf"): Promise<void> {
    const resp = await api.get(`/api/reports/${reportId}/download/`, {
        params: {
            export_format: exportFormat,
        },
        responseType: "blob",
    });

    const disposition = resp.headers["content-disposition"] || "";
    let filename = `${reportId}.${exportFormat}`;
    const match = disposition.match(/filename="([^"]+)"/i);
    if (match?.[1]) filename = match[1];

    const blob = new Blob([resp.data], { type: String(resp.headers["content-type"] || "application/octet-stream") });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
}

export async function createReport(reportPayload: CreateReportPayload): Promise<SavedReport> {
    try {
        const response = await api.post<SavedReport>("/api/reports/", reportPayload);
        return response.data;
    } catch (error) {
        throw new Error(extractApiErrorMessage(error, "Erro ao criar relatorio."));
    }
}

export async function previewReport(reportPayload: PreviewReportPayload): Promise<ReportPreviewResponse> {
    try {
        const response = await api.post<ReportPreviewResponse>("/api/reports/preview/", reportPayload);
        return {
            columns: Array.isArray(response.data.columns) ? response.data.columns : [],
            rows: Array.isArray(response.data.rows) ? response.data.rows : [],
            total_preview_rows: Number.isFinite(response.data.total_preview_rows as number)
                ? Number(response.data.total_preview_rows)
                : 0,
        };
    } catch (error) {
        throw new Error(extractApiErrorMessage(error, "Nao foi possivel carregar a pre-visualizacao."));
    }
}
