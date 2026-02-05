"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useAceternitySidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useAceternitySidebar must be used within a SidebarProvider");
  }
  return context;
};

export const AceternitySidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const AceternitySidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <AceternitySidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </AceternitySidebarProvider>
  );
};

export const AceternitySidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <AceternityDesktopSidebar {...props} />
      <AceternityMobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const AceternityDesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useAceternitySidebar();
  return (
    <>
      <motion.div
        className={cn(
          // UPDATED: White background, subtle border, no heavy navy
          "h-full px-4 py-4 hidden md:flex md:flex-col bg-white border-r border-neutral-200 w-[300px] shrink-0",
          className
        )}
        animate={{
          width: animate ? (open ? "300px" : "70px") : "300px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const AceternityMobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useAceternitySidebar();
  return (
    <>
      <div
        className={cn(
          // UPDATED: White background for mobile header too
          "h-14 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-white border-b border-neutral-200 w-full"
        )}
        {...props}
      >
        <div className="flex justify-start z-20 w-full">
           <span className="text-[#1a2238] font-serif text-lg tracking-wide font-bold">LegalSphere</span>
        </div>
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-neutral-800"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                // UPDATED: Mobile Menu White Background
                "fixed h-full w-full inset-0 bg-white p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-neutral-800"
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const AceternitySidebarLink = ({
  link,
  className,
  onClick,
  ...props
}: {
  link: Links;
  className?: string;
  onClick?: () => void;
}) => {
  const { open, animate } = useAceternitySidebar();
  return (
    <a
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2.5 px-2 rounded-md hover:bg-neutral-100 transition-all",
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      {...props}
    >
      {link.icon}

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        // UPDATED: Text color is now dark (#1a2238 or neutral-700) for white bg
        className="text-neutral-600 text-sm font-medium group-hover/sidebar:text-[#1a2238] group-hover/sidebar:translate-x-1 transition-all duration-200 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </a>
  );
};