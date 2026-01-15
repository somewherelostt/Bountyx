"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

type NotificationType = "success" | "error" | "info";

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface BrutalNotificationContextType {
  notify: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

const BrutalNotificationContext = createContext<BrutalNotificationContextType | undefined>(undefined);

export function useBrutalNotification() {
  const context = useContext(BrutalNotificationContext);
  if (!context) {
    throw new Error("useBrutalNotification must be used within a BrutalNotificationProvider");
  }
  return context;
}

export function BrutalNotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: NotificationType) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const notify = {
    success: (message: string) => addNotification(message, "success"),
    error: (message: string) => addNotification(message, "error"),
    info: (message: string) => addNotification(message, "info"),
  };

  return (
    <BrutalNotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <BrutalToast key={n.id} notification={n} onClose={() => removeNotification(n.id)} />
          ))}
        </AnimatePresence>
      </div>
    </BrutalNotificationContext.Provider>
  );
}

function BrutalToast({ notification, onClose }: { notification: Notification; onClose: () => void }) {
  const flavor = {
    success: { bg: "bg-brutal-green", border: "border-black", icon: "✅" },
    error: { bg: "bg-brutal-pink", border: "border-black", icon: "🚨" },
    info: { bg: "bg-white", border: "border-black", icon: "ℹ️" },
  }[notification.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      layout
      className={`pointer-events-auto min-w-[300px] max-w-[400px] p-4 border-4 ${flavor.border} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${flavor.bg} flex items-start gap-4`}
    >
      <div className="text-2xl">{flavor.icon}</div>
      <div className="flex-1 pt-1">
        <p className="font-bold font-mono text-sm uppercase leading-tight">{notification.message}</p>
      </div>
      <button
        onClick={onClose}
        className="font-black text-xl hover:scale-110 active:scale-95 transition-transform"
      >
        ×
      </button>
    </motion.div>
  );
}
