import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Inbox as InboxIcon, Tags as TagsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { name: 'Inbox', path: '/', icon: InboxIcon },
    { name: 'Categories', path: '/categories', icon: TagsIcon },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      
      <nav className="fixed bottom-0 w-full bg-background border-t border-border pb-safe">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={24} />
                <span className="text-xs font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
