
import React from "react";
import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(true);

  const toggle = React.useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ children, className }) => {
  const { isOpen } = useSidebar();
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background transition-transform",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}
    >
      {children}
    </aside>
  );
};

export const SidebarContent: React.FC<SidebarProps> = ({ children, className }) => {
  return <div className={cn("h-full px-3 py-4", className)}>{children}</div>;
};

export const SidebarGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="space-y-3">{children}</div>;
};

export const SidebarGroupLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <h2 className="px-4 text-lg font-semibold tracking-tight">{children}</h2>;
};

export const SidebarGroupContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="space-y-1">{children}</div>;
};

export const SidebarMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <nav className="space-y-1">{children}</nav>;
};

export const SidebarMenuItem: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="px-3 py-1">{children}</div>;
};

interface SidebarMenuButtonProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export const SidebarMenuButton: React.FC<SidebarMenuButtonProps> = ({
  children,
  className,
  asChild = false,
}) => {
  const Comp = asChild ? "div" : "button";
  return (
    <Comp
      className={cn(
        "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      {children}
    </Comp>
  );
};
