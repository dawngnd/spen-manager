import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAppStore } from '@/store';
import Layout from '@/components/Layout';
import Inbox from '@/pages/Inbox';

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
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Inbox />} />
          <Route path="/categories" element={<div>Categories</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
