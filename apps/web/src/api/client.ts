import axios from 'axios';

const getBaseURL = () => {
  // 在浏览器中使用相对路径（通过 Next.js API routes）
  // 在 SSR/Node 环境中使用环境变量
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return process.env.API_BASE_URL || 'http://localhost:3001';
};

export const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 30_000,
  withCredentials: true
});

export async function getHealth(): Promise<unknown> {
  const response = await apiClient.get('/health');
  return response.data;
}

