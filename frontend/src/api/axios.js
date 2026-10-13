import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true
})

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('rapido_user') || 'null')
  if (user?.id) config.headers['X-User-Id'] = user.id
  return config
})