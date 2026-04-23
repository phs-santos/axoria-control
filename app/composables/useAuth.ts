import { ref, computed } from 'vue'
import { api, authStorage, type StoredUser } from '~/utils/api'

interface LoginResponse {
  token?: string;
  accessToken?: string;
  access_token?: string;
  user?: StoredUser;
}

export const useAuth = () => {
  const user = useState<StoredUser | null>('auth-user', () => null)
  const hydrated = useState('auth-hydrated', () => false)

  const isAuthenticated = computed(() => hydrated.value && !!user.value)

  const init = () => {
    if (process.client) {
      const storedUser = authStorage.getUser()
      const token = authStorage.getToken()
      
      if (token && storedUser) {
        user.value = storedUser
      } else {
        user.value = null
        authStorage.clear()
      }
      hydrated.value = true
    }
  }

  const loginWithPassword = async (email: string, password: string) => {
    const res = await api<LoginResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    
    const token = res.token || res.accessToken || res.access_token;
    if (!token) throw new Error("Token não retornado pela API");
    
    authStorage.set(token, "jwt", res.user ?? null);
    user.value = res.user ?? null;
  }

  const logout = () => {
    authStorage.clear();
    user.value = null;
  }

  const refreshUser = async () => {
    try {
      const me = await api<StoredUser>("/users/profile").catch(() => null);
      if (me) {
        user.value = me;
        const t = authStorage.getToken();
        if (t) authStorage.set(t, "jwt", me);
      }
    } catch {
      // ignore
    }
  }

  return {
    user,
    isAuthenticated,
    hydrated,
    loginWithPassword,
    logout,
    refreshUser,
    init
  }
}
