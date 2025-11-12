import { Bell, Package, AlertTriangle, ClipboardCheck, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Notifications = () => {
  const notifications = [
    {
      id: 1,
      type: "delivery",
      title: "Nueva entrega programada",
      message: "Entrega de cascos de seguridad para el área de Producción",
      time: "Hace 5 min",
      read: false,
      icon: Package,
      color: "primary",
    },
    {
      id: 2,
      type: "alert",
      title: "Stock crítico",
      message: "Gafas protectoras por debajo del stock mínimo (8/15)",
      time: "Hace 30 min",
      read: false,
      icon: AlertTriangle,
      color: "destructive",
    },
    {
      id: 3,
      type: "inspection",
      title: "Inspección completada",
      message: "Área de Mantenimiento - Cumplimiento: 92%",
      time: "Hace 2 horas",
      read: false,
      icon: ClipboardCheck,
      color: "success",
    },
    {
      id: 4,
      type: "delivery",
      title: "Equipo devuelto",
      message: "Juan Pérez ha devuelto guantes dieléctricos",
      time: "Hace 3 horas",
      read: true,
      icon: Package,
      color: "primary",
    },
    {
      id: 5,
      type: "alert",
      title: "Stock bajo",
      message: "Protectores auditivos requieren reposición (12/15)",
      time: "Hace 5 horas",
      read: true,
      icon: AlertTriangle,
      color: "warning",
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Notificaciones</h1>
              <p className="text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : "Todas las notificaciones leídas"}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <CheckCheck className="w-4 h-4 mr-2" />
                Marcar todas como leídas
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <Card 
                key={notification.id} 
                className={`shadow-card hover:shadow-md transition-all cursor-pointer ${
                  !notification.read ? 'border-l-4 border-l-primary bg-primary/5' : ''
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      notification.color === 'primary' ? 'bg-primary/10' :
                      notification.color === 'destructive' ? 'bg-destructive/10' :
                      notification.color === 'success' ? 'bg-success/10' :
                      'bg-warning/10'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        notification.color === 'primary' ? 'text-primary' :
                        notification.color === 'destructive' ? 'text-destructive' :
                        notification.color === 'success' ? 'text-success' :
                        'text-warning'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-foreground">{notification.title}</h3>
                        {!notification.read && (
                          <Badge variant="default" className="ml-2">Nuevo</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">{notification.time}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
