import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Notification } from '@/lib/supabase-types';
import { RealtimeChannel } from '@supabase/supabase-js';

const CACHE_KEY = 'safetyhub_notifications_cache';
const MAX_CACHE_SIZE = 50;

interface NotificationsCache {
  notifications: Notification[];
  timestamp: number;
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Load from cache
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { notifications: cachedNotifications, timestamp }: NotificationsCache = JSON.parse(cached);
        // Use cache if less than 5 minutes old
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setNotifications(cachedNotifications.slice(0, MAX_CACHE_SIZE));
          return true;
        }
      }
    } catch (error) {
      console.error('Error loading notifications from cache:', error);
    }
    return false;
  }, []);

  // Save to cache
  const saveToCache = useCallback((notifs: Notification[]) => {
    try {
      const cache: NotificationsCache = {
        notifications: notifs.slice(0, MAX_CACHE_SIZE),
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving notifications to cache:', error);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async (limit = 50) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const notifs = data as Notification[];
      setNotifications(notifs);
      saveToCache(notifs);

      const unread = notifs.filter(n => !n.read_at).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, saveToCache]);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) throw error;

      // Update local state
      const now = new Date().toISOString();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || now })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [userId]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  // Set up realtime subscription
  useEffect(() => {
    if (!userId) return;

    // Load from cache first
    const hasCache = loadFromCache();
    if (hasCache) {
      setLoading(false);
    }

    // Fetch fresh data
    fetchNotifications();

    // Subscribe to realtime updates
    const newChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Notification change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as Notification;
            setNotifications(prev => [newNotif, ...prev].slice(0, MAX_CACHE_SIZE));
            if (!newNotif.read_at) {
              setUnreadCount(prev => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Notification;
            setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n));
            
            // Recalculate unread count
            setNotifications(prev => {
              const unread = prev.filter(n => !n.read_at).length;
              setUnreadCount(unread);
              return prev;
            });
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as Notification;
            setNotifications(prev => prev.filter(n => n.id !== deleted.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Notifications subscription status:', status);
      });

    setChannel(newChannel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, fetchNotifications, loadFromCache]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
