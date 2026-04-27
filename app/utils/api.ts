// API client for https://services.axoria.digital/api/
// Supports JWT (Bearer token from login)

export const API_BASE_URL = "https://services.axoria.digital/api";
// export const API_BASE_URL = "http://localhost:3000/api";

const TOKEN_KEY = "axoria.auth.token";
const USER_KEY = "axoria.auth.user";

export interface StoredUser {
	id?: string;
	name?: string;
	email?: string;
	role?: string;
	tenantId?: string;
}

export const authStorage = {
	getToken(): string | null {
		if (typeof window === "undefined") return null;
		return localStorage.getItem(TOKEN_KEY);
	},
	getUser(): StoredUser | null {
		if (typeof window === "undefined") return null;
		const raw = localStorage.getItem(USER_KEY);
		if (!raw) return null;
		try {
			return JSON.parse(raw) as StoredUser;
		} catch {
			return null;
		}
	},
	set(token: string, type: "jwt", user?: StoredUser | null) {
		localStorage.setItem(TOKEN_KEY, token);
		if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
	},
	clear() {
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(USER_KEY);
	},
};

export class ApiError extends Error {
	status: number;
	body: unknown;
	constructor(message: string, status: number, body: unknown) {
		super(message);
		this.status = status;
		this.body = body;
	}
}

interface ApiOptions {
	method?: string;
	body?: unknown;
	query?: Record<string, string | undefined>;
	headers?: Record<string, string>;
	auth?: boolean; // default true
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
	const { method = "GET", body, query, headers = {}, auth = true } = opts;

	const url = new URL(API_BASE_URL + (path.startsWith("/") ? path : `/${path}`));
	if (query) {
		for (const [k, v] of Object.entries(query)) {
			if (v !== undefined && v !== "") url.searchParams.set(k, v);
		}
	}

	const finalHeaders: Record<string, string> = {
		Accept: "application/json",
		...headers,
	};

	if (body !== undefined && !(body instanceof FormData)) {
		finalHeaders["Content-Type"] = "application/json";
	}

	if (auth) {
		const token = authStorage.getToken();
		if (token) {
			finalHeaders["Authorization"] = `Bearer ${token}`;
		}
	}

	const res = await fetch(url.toString(), {
		method,
		headers: finalHeaders,
		body:
			body === undefined
				? undefined
				: body instanceof FormData
					? body
					: JSON.stringify(body),
	});

	if (res.status === 204) return undefined as T;

	const text = await res.text();
	let data: unknown = null;
	if (text) {
		try {
			data = JSON.parse(text);
		} catch {
			data = text;
		}
	}

	if (!res.ok) {
		const msg =
			(data && typeof data === "object" && "message" in data && typeof (data as { message: unknown }).message === "string"
				? (data as { message: string }).message
				: null) || `Request failed (${res.status})`;
		throw new ApiError(msg, res.status, data);
	}

	return data as T;
}
