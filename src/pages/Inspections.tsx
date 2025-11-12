import { useState } from "react";
import { ClipboardCheck, Plus, Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Inspections = () => {
  const inspections = {
    pending: [
      { id: 1, area: "Producción", date: "2024-01-15", inspector: "María González", items: 12, status: "pending" },
      { id: 2, area: "Almacén", date: "2024-01-16", inspector: "Carlos Ruiz", items: 8, status: "pending" },
    ],
    inProgress: [
      { id: 3, area: "Oficinas", date: "2024-01-15", inspector: "Ana López", items: 10, completed: 6, status: "in_progress" },
    ],
    completed: [
      { id: 4, area: "Mantenimiento", date: "2024-01-14", inspector: "Juan Pérez", items: 15, score: 92, status: "completed" },
      { id: 5, area: "Producción", date: "2024-01-13", inspector: "María González", items: 12, score: 88, status: "completed" },
    ],
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, text: "Pendiente" },
      in_progress: { variant: "default" as const, text: "En Proceso" },
      completed: { variant: "outline" as const, text: "Completada" },
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
              <h1 className="text-3xl font-bold text-foreground mb-2">Inspecciones de Área</h1>
              <p className="text-muted-foreground">Programación y seguimiento de inspecciones</p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nueva Inspección
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">8</div>
              <p className="text-xs text-primary mt-1">5 áreas distintas</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">2</div>
              <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Proceso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">1</div>
              <p className="text-xs text-muted-foreground mt-1">60% completado</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">24</div>
              <p className="text-xs text-success mt-1">Este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Inspections Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 gap-4">
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="inProgress">En Proceso</TabsTrigger>
            <TabsTrigger value="completed">Completadas</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {inspections.pending.map((inspection) => (
              <Card key={inspection.id} className="shadow-card hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <ClipboardCheck className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground mb-2">{inspection.area}</h3>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {inspection.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {inspection.inspector}
                          </span>
                          <span>{inspection.items} items</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(inspection.status)}
                      <Button>Iniciar Inspección</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="inProgress" className="space-y-4">
            {inspections.inProgress.map((inspection) => (
              <Card key={inspection.id} className="shadow-card hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <ClipboardCheck className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-foreground mb-2">{inspection.area}</h3>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {inspection.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {inspection.inspector}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progreso</span>
                            <span className="font-medium text-foreground">{inspection.completed}/{inspection.items} items</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${(inspection.completed! / inspection.items) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(inspection.status)}
                      <Button>Continuar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {inspections.completed.map((inspection) => (
              <Card key={inspection.id} className="shadow-card hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-success/10 rounded-lg">
                        <ClipboardCheck className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground mb-2">{inspection.area}</h3>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {inspection.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {inspection.inspector}
                          </span>
                          <span>{inspection.items} items</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right mr-3">
                        <div className="text-2xl font-bold text-success">{inspection.score}%</div>
                        <div className="text-xs text-muted-foreground">Cumplimiento</div>
                      </div>
                      {getStatusBadge(inspection.status)}
                      <Button variant="outline">Ver Reporte</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Inspections;
