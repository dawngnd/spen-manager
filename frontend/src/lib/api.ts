import { useAppStore } from '@/store';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: string;
  description: string;
  merchant: string;
  category_id: string | null;
  gmail_message_id: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  parent_id: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function apiClient<T>(action: string, payload?: Record<string, unknown>): Promise<ApiResponse<T>> {
  const initData = useAppStore.getState().initData;
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (!apiUrl) {
    console.error('VITE_API_URL is not defined');
    return { success: false, error: 'API URL missing' };
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        ...(initData ? { 'x-telegram-init-data': initData } : {}),
      },
      body: JSON.stringify({ action, ...payload }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error (${action}):`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
