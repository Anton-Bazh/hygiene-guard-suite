import { Shield, Users, ClipboardCheck, AlertTriangle, Package, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const stats = [
    {
      title: "Equipos Activos",
      value: "156",
      change: "+12%",
      icon: Package,
      trend: "up",
    },
    {
      title: "Inspecciones Hoy",
      value: "8",
      change: "3 pendientes",
      icon: ClipboardCheck,
      trend: "neutral",
    },
    {
      title: "Alertas Activas",
      value: "4",
      change: "2 críticas",
      icon: AlertTriangle,
      trend: "down",
    },
    {
      title: "Cumplimiento",
      value: "94%",
      change: "+2%",
      icon: TrendingUp,
      trend: "up",
    },
  ];

  const recentDeliveries = [
    { id: 1, employee: "Juan Pérez", equipment: "Casco de Seguridad", date: "2024-01-15", status: "delivered" },
    { id: 2, employee: "María González", equipment: "Botas de Seguridad", date: "2024-01-15", status: "delivered" },
    { id: 3, employee: "Carlos Ruiz", equipment: "Guantes Dieléctricos", date: "2024-01-14", status: "pending" },
  ];

  const areaStatus = [
    { area: "Producción", status: "ok", inspections: 24, compliance: 98 },
    { area: "Almacén", status: "warning", inspections: 18, compliance: 85 },
    { area: "Oficinas", status: "ok", inspections: 12, compliance: 100 },
    { area: "Mantenimiento", status: "critical", inspections: 20, compliance: 72 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Panel de Seguridad e Higiene</h1>
              <p className="text-muted-foreground">Monitoreo y gestión integral de seguridad</p>
            </div>
            <Shield className="w-16 h-16 text-primary opacity-50" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="shadow-card hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className={`text-xs mt-1 ${
                    stat.trend === 'up' ? 'text-success' : 
                    stat.trend === 'down' ? 'text-destructive' : 
                    'text-warning'
                  }`}>
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Recent Deliveries */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Entregas Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDeliveries.map((delivery) => (
                  <div key={delivery.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{delivery.employee}</p>
                      <p className="text-sm text-muted-foreground">{delivery.equipment}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={delivery.status === 'delivered' ? 'default' : 'secondary'}>
                        {delivery.status === 'delivered' ? 'Entregado' : 'Pendiente'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{delivery.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">
                Ver Todas las Entregas
              </Button>
            </CardContent>
          </Card>

          {/* Area Status */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-primary" />
                Estado de Áreas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {areaStatus.map((area) => (
                  <div key={area.area} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-3 h-3 rounded-full ${
                        area.status === 'ok' ? 'bg-success' :
                        area.status === 'warning' ? 'bg-warning' :
                        'bg-destructive'
                      }`} />
                      <div>
                        <p className="font-medium text-foreground">{area.area}</p>
                        <p className="text-sm text-muted-foreground">{area.inspections} inspecciones</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{area.compliance}%</p>
                      <p className="text-xs text-muted-foreground">cumplimiento</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">
                Ver Todas las Áreas
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Button className="h-24 flex flex-col gap-2" variant="outline">
                <Package className="w-6 h-6" />
                <span>Nueva Entrega</span>
              </Button>
              <Button className="h-24 flex flex-col gap-2" variant="outline">
                <ClipboardCheck className="w-6 h-6" />
                <span>Nueva Inspección</span>
              </Button>
              <Button className="h-24 flex flex-col gap-2" variant="outline">
                <Users className="w-6 h-6" />
                <span>Gestionar Empleados</span>
              </Button>
              <Button className="h-24 flex flex-col gap-2" variant="outline">
                <AlertTriangle className="w-6 h-6" />
                <span>Reportar Incidente</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
