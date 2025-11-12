import { Users, Search, Plus, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Employees = () => {
  const employees = [
    { id: 1, name: "Juan Pérez", role: "Operario", area: "Producción", equipment: 3, lastInspection: "2024-01-10", status: "active" },
    { id: 2, name: "María González", role: "Supervisor", area: "Producción", equipment: 4, lastInspection: "2024-01-12", status: "active" },
    { id: 3, name: "Carlos Ruiz", role: "Operario", area: "Almacén", equipment: 2, lastInspection: "2024-01-08", status: "training" },
    { id: 4, name: "Ana López", role: "Inspector", area: "RRHH", equipment: 2, lastInspection: "2024-01-14", status: "active" },
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: "default" as const, text: "Activo" },
      training: { variant: "secondary" as const, text: "Capacitación" },
    };
    const config = variants[status as keyof typeof variants];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Gestión de Empleados</h1>
              <p className="text-muted-foreground">Control de personal y asignaciones</p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Empleado
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Empleados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">156</div>
              <p className="text-xs text-success mt-1">+8 este mes</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">148</div>
              <p className="text-xs text-primary mt-1">95% del total</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Capacitación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">8</div>
              <p className="text-xs text-muted-foreground mt-1">2 áreas</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Equipos Asignados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">312</div>
              <p className="text-xs text-success mt-1">98% entregado</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <Card className="shadow-card mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar empleados..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar Lista
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Employees Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee) => (
            <Card key={employee.id} className="shadow-card hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(employee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{employee.name}</h3>
                    <p className="text-sm text-muted-foreground">{employee.role}</p>
                  </div>
                  {getStatusBadge(employee.status)}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Área:</span>
                    <span className="font-medium text-foreground">{employee.area}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Equipos asignados:</span>
                    <span className="font-medium text-foreground">{employee.equipment}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Última inspección:</span>
                    <span className="font-medium text-foreground">{employee.lastInspection}</span>
                  </div>
                </div>

                <Button className="w-full" variant="outline">Ver Perfil</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Employees;
