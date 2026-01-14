/**
 * API Client for client-side data fetching
 * CRITICAL: Always use this instead of raw fetch() in client components
 */

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>
}

class ApiClient {
  private baseUrl = ''

  private buildUrl(url: string, params?: Record<string, string | number | boolean | undefined>): string {
    const fullUrl = `${this.baseUrl}${url}`

    if (!params) return fullUrl

    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    })

    const queryString = searchParams.toString()
    return queryString ? `${fullUrl}?${queryString}` : fullUrl
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      const message = error.details
        ? `${error.error}: ${JSON.stringify(error.details)}`
        : error.message || error.error || `API Error: ${response.status}`
      throw new Error(message)
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    const { params, ...fetchOptions } = options ?? {}
    const response = await fetch(this.buildUrl(url, params), {
      ...fetchOptions,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions?.headers,
      },
    })
    return this.handleResponse<T>(response)
  }

  async post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const { params, ...fetchOptions } = options ?? {}
    const response = await fetch(this.buildUrl(url, params), {
      ...fetchOptions,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const { params, ...fetchOptions } = options ?? {}
    const response = await fetch(this.buildUrl(url, params), {
      ...fetchOptions,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async put<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const { params, ...fetchOptions } = options ?? {}
    const response = await fetch(this.buildUrl(url, params), {
      ...fetchOptions,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    const { params, ...fetchOptions } = options ?? {}
    const response = await fetch(this.buildUrl(url, params), {
      ...fetchOptions,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions?.headers,
      },
    })
    return this.handleResponse<T>(response)
  }

  // File upload helper
  async upload<T>(url: string, formData: FormData, options?: Omit<RequestOptions, 'params'>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      method: 'POST',
      // Don't set Content-Type header - browser will set it with boundary for FormData
      body: formData,
    })
    return this.handleResponse<T>(response)
  }
}

const api = new ApiClient()
export default api
