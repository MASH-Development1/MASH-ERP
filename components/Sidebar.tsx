'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FolderOpen,
  DollarSign,
  TrendingUp,
  PhoneCall,
  Megaphone,
  BarChart3,
  LineChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/protected/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    href: '/protected/users',
    label: 'User Management',
    icon: <Users className="w-5 h-5" />,
  },
  {
    href: '/protected/tasks',
    label: 'Tasks',
    icon: <CheckSquare className="w-5 h-5" />,
  },
  {
    href: '/protected/projects',
    label: 'Projects',
    icon: <FolderOpen className="w-5 h-5" />,
  },
  {
    href: '/protected/payments',
    label: 'Income',
    icon: <DollarSign className="w-5 h-5" />,
  },
  {
    href: '/protected/expenses',
    label: 'Expenses',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    href: '/protected/salaries',
    label: 'Salaries',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    href: '/protected/leads',
    label: 'Leads',
    icon: <PhoneCall className="w-5 h-5" />,
  },
  {
    href: '/protected/campaigns',
    label: 'Campaigns',
    icon: <Megaphone className="w-5 h-5" />,
  },
  {
    href: '/protected/forecast',
    label: 'Financial Forecast',
    icon: <LineChart className="w-5 h-5" />,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">Mash ERP</h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <p className="text-sm text-muted-foreground truncate">
          {profile?.first_name} {profile?.last_name}
        </p>
        <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
      </div>
    </aside>
  );
}
