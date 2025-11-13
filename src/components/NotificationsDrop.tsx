import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const PRIORITY_COLORS = {
  urgent: 'bg-destructive text-destructive-foreground',
  high: 'bg-warning text-warning-foreground',
  normal: 'bg-primary text-primary-foreground',
  low: 'bg-secondary text-secondary-foreground',
};

export function NotificationsDrop() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications(user?.id);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  const handleToggleRead = async (e: React.MouseEvent, notification: typeof notifications[0]) => {
    e.stopPropagation();
    await markAsRead(notification.id);
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="outline"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notificaciones. ${unreadCount} sin leer`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-background border border-border rounded-lg shadow-lg z-50"
          role="dialog"
          aria-label="Panel de notificaciones"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Notificaciones</h2>
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} nuevas</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar notificaciones"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Cargando notificaciones...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-accent cursor-pointer transition-colors",
                      !notification.read_at && "bg-primary/5"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleNotificationClick(notification);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Priority indicator */}
                      <div
                        className={cn(
                          "w-1 h-full rounded-full",
                          !notification.read_at && PRIORITY_COLORS[notification.priority]
                        )}
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={cn(
                            "text-sm font-semibold",
                            !notification.read_at ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {notification.title}
                          </h3>
                          {!notification.read_at && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {notification.body}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: es
                            })}
                          </span>
                          <div className="flex gap-1">
                            {!notification.read_at && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleToggleRead(e, notification)}
                                title="Marcar como leída"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDelete(e, notification.id)}
                              title="Eliminar"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
              >
                Ver todas las notificaciones
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
