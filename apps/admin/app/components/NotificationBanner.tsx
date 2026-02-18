"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";

interface Notification {
  id: string;
  type: "warning" | "info" | "error";
  message: string;
  count?: number;
}

export function NotificationBanner() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // Refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data: restaurants } = await supabase
        .from("restaurants")
        .select("id, name, plan, is_active, created_at");

      if (!restaurants) {
        setLoading(false);
        return;
      }

      const newNotifications: Notification[] = [];

      // Check for inactive restaurants
      const inactiveRestaurants = restaurants.filter((r) => r.is_active === false);
      if (inactiveRestaurants.length > 0) {
        newNotifications.push({
          id: "inactive",
          type: "warning",
          message: `${inactiveRestaurants.length} pasif restoran bulunmaktadır`,
          count: inactiveRestaurants.length,
        });
      }

      // Check for restaurants that haven't been active recently (example: created more than 30 days ago but still starter plan)
      const oldStarterPlans = restaurants.filter((r) => {
        const createdAt = new Date(r.created_at);
        const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return r.plan === "starter" && daysSinceCreation > 30;
      });

      if (oldStarterPlans.length > 0) {
        newNotifications.push({
          id: "old-starter",
          type: "info",
          message: `${oldStarterPlans.length} restoran 30 günden fazla süredir Başlangıç planında`,
          count: oldStarterPlans.length,
        });
      }

      // Check for restaurants created today (could indicate payment pending)
      const todayRestaurants = restaurants.filter((r) => {
        const createdAt = new Date(r.created_at);
        const today = new Date();
        return (
          createdAt.getDate() === today.getDate() &&
          createdAt.getMonth() === today.getMonth() &&
          createdAt.getFullYear() === today.getFullYear()
        );
      });

      if (todayRestaurants.length > 0) {
        newNotifications.push({
          id: "today-created",
          type: "info",
          message: `Bugün ${todayRestaurants.length} yeni restoran kaydı yapıldı`,
          count: todayRestaurants.length,
        });
      }

      setNotifications(newNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || notifications.length === 0) {
    return null;
  }

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "info":
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  return (
    <div className="mb-6 space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`border-l-4 rounded-r-lg p-4 ${getNotificationStyles(
            notification.type
          )}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {notification.type === "warning" && (
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {notification.type === "info" && (
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <p className="font-medium">{notification.message}</p>
              {notification.count && (
                <span className="ml-2 px-2 py-1 bg-white/50 rounded text-sm font-semibold">
                  {notification.count}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
