import Cookies from "js-cookie"

type PreferencesPayload = {
  theme?: "light" | "dark" | "system"
  language?: string
  timezone?: string
}

type NotificationSettingsPayload = {
  email_enabled?: boolean
  push_enabled?: boolean
  topics?: string[]
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

async function authFetch(path: string, options: RequestInit = {}) {
  const token = Cookies.get("access_token")
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  })
  if (!res.ok) {
    let detail = "Request failed"
    try {
      const data = await res.json()
      detail = data?.message || data?.detail || JSON.stringify(data)
    } catch {}
    throw new Error(detail)
  }
  try {
    return await res.json()
  } catch {
    return null
  }
}

export const settingsApi = {
  // Preferences
  async getPreferences() {
    const data = await authFetch("/auth/users/preferences/")
    return data?.data || data || {}
  },
  async updatePreferences(payload: PreferencesPayload) {
    const data = await authFetch("/auth/users/preferences/", {
      method: "PUT",
      body: JSON.stringify(payload)
    })
    return data?.data || data || {}
  },

  // Notifications
  async getNotificationSettings() {
    const data = await authFetch("/notifications/settings/")
    return data?.data || data || {}
  },
  async updateNotificationSettings(payload: NotificationSettingsPayload) {
    const data = await authFetch("/notifications/settings/", {
      method: "PUT",
      body: JSON.stringify(payload)
    })
    return data?.data || data || {}
  },

  // Security: Change Password
  async changePassword(payload: { current_password: string; new_password: string }) {
    return await authFetch("/auth/users/change_password/", {
      method: "POST",
      body: JSON.stringify(payload)
    })
  },

  // Security: 2FA (placeholders; wire when backend ready)
  async get2FAStatus() {
    const data = await authFetch("/auth/2fa/status/")
    return data?.data || data || {}
  },
  async enable2FA(payload: any) {
    return await authFetch("/auth/2fa/enable/", { method: "POST", body: JSON.stringify(payload) })
  },
  async verify2FA(payload: any) {
    return await authFetch("/auth/2fa/verify/", { method: "POST", body: JSON.stringify(payload) })
  },
  async disable2FA(payload: any) {
    return await authFetch("/auth/2fa/disable/", { method: "POST", body: JSON.stringify(payload) })
  },

  // Sessions
  async getSessions() {
    const data = await authFetch("/auth/sessions/")
    return data?.data || data || []
  },
  async revokeSession(id: string) {
    return await authFetch(`/auth/sessions/${id}/`, { method: "DELETE" })
  }
}

export type { PreferencesPayload, NotificationSettingsPayload }


