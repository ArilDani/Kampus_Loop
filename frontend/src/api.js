import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = String(error.config?.url || '')
    const isAuthEndpoint =
      url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/me')
    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('kampusloop_session')
      window.dispatchEvent(new CustomEvent('kampusloop:unauthorized'))
    }
    return Promise.reject(error)
  }
)

export default api
