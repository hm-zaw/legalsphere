"use client";

import React, { useState, useEffect } from "react";
import { Bell, X, Check, Clock, AlertCircle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  caseId?: string;
  lawyerId?: string;
  lawyerName?: string;
  denialReason?: string;
  read: boolean;
  createdAt: string;
}

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/notifications?limit=10");
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, action: "mark_read" }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, read: true } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    }
  };

  const handleDeleteNotification = async (
    notificationId: string,
    e?: React.MouseEvent,
  ) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      const res = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.filter((n) => n._id !== notificationId),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "lawyer_denied_case":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "lawyer_accepted_case":
        return <Check className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-500 hover:text-[#1a2238] transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-zinc-200 z-50"
          >
            <div className="p-4 border-b border-zinc-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#1a2238]">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-zinc-100 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-zinc-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1a2238] mx-auto"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-zinc-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-[#1a2238]">
                              {notification.title}
                            </p>
                            <p className="text-xs text-zinc-600 mt-1">
                              {notification.type === "lawyer_denied_case"
                                ? notification.lawyerName
                                  ? `${notification.lawyerName} has declined the case: ${notification.title}`
                                  : notification.lawyerId
                                    ? `Lawyer ${notification.lawyerId} has declined the case: ${notification.title}`
                                    : notification.message
                                : notification.type === "lawyer_accepted_case"
                                  ? notification.lawyerName
                                    ? `${notification.lawyerName} has accepted the case: ${notification.title}`
                                    : notification.lawyerId
                                      ? `Lawyer ${notification.lawyerId} has accepted the case: ${notification.title}`
                                      : notification.message
                                  : notification.message}
                            </p>
                            {notification.denialReason && (
                              <p className="text-xs text-zinc-500 mt-1 italic">
                                Reason: {notification.denialReason}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="h-3 w-3 text-zinc-400" />
                              <span className="text-xs text-zinc-400">
                                {new Date(
                                  notification.createdAt,
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification._id)}
                                className="p-1 hover:bg-zinc-200 rounded"
                                title="Mark as read"
                              >
                                <Check className="h-3 w-3 text-zinc-500" />
                              </button>
                            )}
                            <button
                              onClick={(e) =>
                                handleDeleteNotification(notification._id, e)
                              }
                              className="p-1 hover:bg-zinc-200 rounded text-red-500 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
