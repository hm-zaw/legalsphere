"use client";
import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  className?: string;
  homeLabel?: string;
}

export function Breadcrumbs({ className, homeLabel = "Dashboard" }: BreadcrumbsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(segment => segment);
    
    const breadcrumbs: BreadcrumbItem[] = [
      { label: homeLabel, href: "/dashboard" }
    ];

    // Define route mappings
    const routeMap: Record<string, string> = {
      'dashboard': 'Home',
      'my-cases': 'My Cases',
      'lawyers': 'Lawyers',
      'services': 'Services',
      'profile': 'Profile',
      'settings': 'Settings',
      'apply-new': 'New Case',
      'case-details': 'Case Details',
      'lawyer-profile': 'Lawyer Profile',
      'notifications': 'Notifications'
    };

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = routeMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      
      // Only add if it's not the dashboard home page or duplicate
      if (segment !== 'dashboard' && (!breadcrumbs.find(b => b.label === label) || index === pathSegments.length - 1)) {
        breadcrumbs.push({ label, href: currentPath });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const handleBreadcrumbClick = (href: string) => {
    router.push(href);
  };

  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)}>
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          {index === 0 && (
            <Home className="w-4 h-4 text-gray-500 mr-1" />
          )}
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
          )}
          <button
            onClick={() => item.href && handleBreadcrumbClick(item.href)}
            className={cn(
              "transition-colors hover:text-yellow-600",
              index === breadcrumbs.length - 1
                ? "text-gray-900 font-medium"
                : "text-gray-600"
            )}
            disabled={!item.href}
          >
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}
