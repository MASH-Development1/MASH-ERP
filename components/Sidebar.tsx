'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FolderOpen,
  DollarSign,
  TrendingDown,
  PhoneCall,
  Megaphone,
  BarChart3,
  LineChart,
  FileText,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Banknote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const MAIN_NAV_ITEMS: NavItem[] = [
  {
    href: '/protected/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    href: '/protected/users',
    label: 'Users',
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
];

const FINANCE_NAV_ITEMS: NavItem[] = [
  {
    href: '/protected/payments',
    label: 'Income',
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    href: '/protected/expenses',
    label: 'Expenses',
    icon: <TrendingDown className="w-4 h-4" />,
  },
  {
    href: '/protected/salaries',
    label: 'Salaries',
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    href: '/protected/forecast',
    label: 'Forecast',
    icon: <LineChart className="w-4 h-4" />,
  },
];

const OTHER_NAV_ITEMS: NavItem[] = [
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
    href: '/protected/canvas',
    label: 'Canvas',
    icon: <FileText className="w-5 h-5" />,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);

  // Automatically expand Finance menu if current path matches a finance item
  useEffect(() => {
    if (FINANCE_NAV_ITEMS.some(item => pathname === item.href)) {
      setIsFinanceOpen(true);
    }
  }, [pathname]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const NavLink = ({ item, isSubItem = false }: { item: NavItem; isSubItem?: boolean }) => (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group relative',
        pathname === item.href
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        isSubItem && 'ml-4 py-1.5'
      )}
    >
      <div className={cn(
        "transition-transform",
        !isCollapsed && "group-hover:scale-110"
      )}>
        {item.icon}
      </div>
      {!isCollapsed && (
        <span className={cn("text-sm font-medium whitespace-nowrap opacity-100 transition-opacity", isSubItem && "text-[13px]")}>
          {item.label}
        </span>
      )}
      {isCollapsed && (
        <div className="absolute left-16 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border shadow-sm">
          {item.label}
        </div>
      )}
    </Link>
  );

  return (
    <aside className={cn(
      "bg-card border-r border-border flex flex-col transition-all duration-300 relative",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className={cn(
        "p-6 flex items-center justify-between border-b border-border h-[72px]",
        isCollapsed && "px-4 justify-center"
      )}>
        {!isCollapsed && (
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Mash ERP
          </h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
        >
          {isCollapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6">
        <ul className="space-y-1">
          {MAIN_NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <NavLink item={item} />
            </li>
          ))}
        </ul>

        <div className="space-y-1">
          <Collapsible
            open={isFinanceOpen && !isCollapsed}
            onOpenChange={setIsFinanceOpen}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <button className={cn(
                "flex items-center justify-between w-full px-4 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-all group relative",
                FINANCE_NAV_ITEMS.some(i => pathname === i.href) && !isCollapsed && "bg-accent/50 text-foreground"
              )}
                onClick={() => isCollapsed && setIsCollapsed(false)}
              >
                <div className="flex items-center gap-3">
                  <Banknote className={cn("w-5 h-5", isCollapsed ? "" : "group-hover:scale-110 transition-transform")} />
                  {!isCollapsed && <span className="text-sm font-medium">Finance</span>}
                </div>
                {!isCollapsed && (
                  isFinanceOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                )}
                {isCollapsed && (
                  <div className="absolute left-16 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border shadow-sm">
                    Finance
                  </div>
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {!isCollapsed && FINANCE_NAV_ITEMS.map((item) => (
                <li key={item.href} className="list-none">
                  <NavLink item={item} isSubItem />
                </li>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <ul className="space-y-1">
          {OTHER_NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <NavLink item={item} />
            </li>
          ))}
        </ul>
      </nav>

      <div className={cn(
        "p-4 border-t border-border bg-accent/10 transition-all",
        isCollapsed ? "px-2 items-center" : "flex flex-col"
      )}>
        {isCollapsed ? (
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
          </>
        )}
      </div>
    </aside>
  );
}
