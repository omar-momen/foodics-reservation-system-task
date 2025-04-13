import axios, { type AxiosInstance } from 'axios'

export default () => {
  const api: AxiosInstance = axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_FOODICS_API_TOKEN}`,
    },
  })

  return api
}
