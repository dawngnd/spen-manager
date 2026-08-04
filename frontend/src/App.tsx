import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAppStore } from '@/store';
import Layout from '@/components/Layout';
import Inbox from '@/pages/Inbox';
import { Categories } from '@/pages/Categories';
import Dashboard from '@/pages/Dashboard';
import Budget from '@/pages/Budget';

function App() {
  const { setInitData, setTheme } = useAppStore();

  useEffect(() => {
    try {
      const WebApp = (window as any).Telegram?.WebApp;
      if (!WebApp) {
        console.warn('Telegram WebApp is missing. Are you running inside Telegram?');
        return;
      }
      
      WebApp.ready();
      WebApp.expand();
      
      if (typeof WebApp.disableVerticalSwipes === 'function') {
        WebApp.disableVerticalSwipes();
      }
      
      if (WebApp.initData) {
        setInitData(WebApp.initData);
      } else {
        console.warn('WebApp.initData is empty! Are you opening via inline keyboard/bot menu?');
        // For local development, set a dummy string if you want to bypass this check locally.
      }
      
      const updateTheme = () => {
        try {
          const isDark = WebApp.colorScheme === 'dark';
          setTheme(isDark ? 'dark' : 'light');
          
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } catch {
          // Fallback: use system preference
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setTheme(isDark ? 'dark' : 'light');
          if (isDark) document.documentElement.classList.add('dark');
        }
      };
      
      updateTheme();
      WebApp.onEvent('themeChanged', updateTheme);
      
      return () => {
        WebApp.offEvent('themeChanged', updateTheme);
      };
    } catch (err) {
      console.warn('Telegram WebApp SDK init failed:', err);
    }
  }, [setInitData, setTheme]);

  // If we are strictly in Telegram, we might want to wait for initData. 
  // However, local dev needs to work too. 
  // For now, let's render unconditionally but we will also patch React Query `enabled` in hooks.
  
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Layout>
        <Routes>
          <Route path="/" element={<Inbox />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
