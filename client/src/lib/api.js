// client/src/lib/api.js

/**
 * Fetch wrapper that:
 * 1. Always sends credentials (cookies)
 * 2. On 401, attempts one token refresh then retries
 * 3. Returns parsed JSON or throws
 */
async function refreshToken() {
  await fetch("/auth/refresh", { method: "POST", credentials: "include" });
}

export async function api(path, options = {}) {
  const opts = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (options.body instanceof FormData) {
    delete opts.headers["Content-Type"];
  }

  let res = await fetch(path, opts);

  // Auto-refresh on 401 and retry once
  if (res.status === 401) {
    await refreshToken();
    res = await fetch(path, opts);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const apiGet    = (path)         => api(path, { method: "GET" });
export const apiPost   = (path, body)   => api(path, { method: "POST",   body: body instanceof FormData ? body : JSON.stringify(body) });
export const apiPatch  = (path, body)   => api(path, { method: "PATCH",  body: JSON.stringify(body) });
export const apiDelete = (path)         => api(path, { method: "DELETE" });
