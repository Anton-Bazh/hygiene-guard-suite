import { Bell, Package, AlertTriangle, ClipboardCheck, CheckCheck, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const NOTIFICATION_ICONS = {
  delivery_alert: Package,
  inspection_assigned: ClipboardCheck,
  inspection_overdue: AlertTriangle,
  inventory_low: AlertTriangle,
  corrective_action: ClipboardCheck,
};

const NOTIFICATION_COLORS = {
  urgent: "destructive",
  high: "warning",
  normal: "primary",
  low: "secondary",
} as const;

const Notifications = () => {
  const { user } = useAuth();
  const { notifications, loading, markAllAsRead } = useNotifications(user?.id);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Notificaciones</h1>
              <p className="text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : "Todas las notificaciones leídas"}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCheck className="w-4 h-4 mr-2" />
                Marcar todas como leídas
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {notifications.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="pt-6 text-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tienes notificaciones</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => {
              const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
              const colorVariant = NOTIFICATION_COLORS[notification.priority || 'normal'];
              
              return (
                <Card 
                  key={notification.id} 
                  className={`shadow-card hover:shadow-md transition-all cursor-pointer ${
                    !notification.read_at ? 'border-l-4 border-l-primary bg-primary/5' : ''
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        colorVariant === 'destructive' ? 'bg-destructive/10' :
                        colorVariant === 'warning' ? 'bg-warning/10' :
                        colorVariant === 'primary' ? 'bg-primary/10' :
                        'bg-secondary/10'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          colorVariant === 'destructive' ? 'text-destructive' :
                          colorVariant === 'warning' ? 'text-warning' :
                          colorVariant === 'primary' ? 'text-primary' :
                          'text-secondary'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-foreground">{notification.title}</h3>
                          {!notification.read_at && (
                            <Badge variant="default" className="ml-2">Nuevo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.body}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at!), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
