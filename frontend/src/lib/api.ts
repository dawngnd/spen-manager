import { useAppStore } from '@/store';

export interface Transaction {
  id: string;
  gmail_message_id: string;
  date: string;
  amount: number;
  type: string;
  merchant: string;
  reference: string;
  status: string;
  category_parent_id: string;
  category_child_id: string;
}

export interface Budget {
  id: string;
  category_id: string;
  month: string;
  amount: number;
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
  
  if (!initData) {
    return { success: false, error: 'No auth data yet' };
  }
  
  if (!apiUrl) {
    return { success: false, error: 'API URL missing' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout — no infinite pending

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, initData, ...payload }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error (${action}):`, error);
    let message = error instanceof Error ? error.message : 'Unknown error';
    if (error instanceof DOMException && error.name === 'AbortError') {
      message = 'Request timed out (15s). Server may be unreachable.';
    }
    return {
      success: false,
      error: message
    };
  }
}
