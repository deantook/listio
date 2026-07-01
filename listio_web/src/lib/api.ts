class ApiClient {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: "请求失败" } }))
      throw new Error(error.error?.message || `HTTP ${res.status}`)
    }

    return res.json()
  }

  get<T>(url: string) {
    return this.request<T>(url)
  }

  post<T>(url: string, body?: unknown) {
    return this.request<T>(url, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  patch<T>(url: string, body?: unknown) {
    return this.request<T>(url, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  put<T>(url: string, body?: unknown) {
    return this.request<T>(url, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  delete<T>(url: string) {
    return this.request<T>(url, { method: "DELETE" })
  }
}

export const api = new ApiClient()
