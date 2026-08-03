import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
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
    WebApp.ready();
    WebApp.expand();
    WebApp.disableVerticalSwipes();
    
    if (WebApp.initData) {
      setInitData(WebApp.initData);
    }
    
    const updateTheme = () => {
      const isDark = WebApp.colorScheme === 'dark';
      setTheme(isDark ? 'dark' : 'light');
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    updateTheme();
    WebApp.onEvent('themeChanged', updateTheme);
    
    return () => {
      WebApp.offEvent('themeChanged', updateTheme);
    };
  }, [setInitData, setTheme]);

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
