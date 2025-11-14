import { ClipboardCheck, Plus, Calendar, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInspections } from "@/hooks/useInspections";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { InspectionStatus } from "@/lib/supabase-types";

const Inspections = () => {
  const { inspections, loading } = useInspections();
  const navigate = useNavigate();

  const getInspectionsByStatus = (status: InspectionStatus | InspectionStatus[]) => {
    if (Array.isArray(status)) {
      return inspections.filter(i => status.includes(i.status));
    }
    return inspections.filter(i => i.status === status);
  };

  const pendingInspections = getInspectionsByStatus('pending');
  const inProgressInspections = getInspectionsByStatus('in_progress');
  const completedInspections = getInspectionsByStatus(['completed', 'incomplete', 'forced_closed']);

  const getStatusBadge = (status: InspectionStatus) => {
    const variants = {
      pending: { variant: "secondary" as const, text: "Pendiente" },
      in_progress: { variant: "default" as const, text: "En Proceso" },
      completed: { variant: "outline" as const, text: "Completada" },
      incomplete: { variant: "destructive" as const, text: "Incompleta" },
      forced_closed: { variant: "destructive" as const, text: "Cerrada Forzosamente" },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando inspecciones...</p>
        </div>
      </div>
    );
  }

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
            {pendingInspections.map((inspection) => (
              <Card key={inspection.id} className="shadow-card hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <ClipboardCheck className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground mb-2">{inspection.area?.name}</h3>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(inspection.scheduled_at), "d 'de' MMMM", { locale: es })}
                          </span>
                          {inspection.area?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {inspection.area.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(inspection.status)}
                      <Button onClick={() => navigate(`/inspections/${inspection.id}`)}>
                        Ver Inspección
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="inProgress" className="space-y-4">
            {inProgressInspections.map((inspection) => (
              <Card key={inspection.id} className="shadow-card hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <ClipboardCheck className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-foreground mb-2">{inspection.area?.name}</h3>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(inspection.scheduled_at), "d 'de' MMMM", { locale: es })}
                          </span>
                          {inspection.area?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {inspection.area.location}
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progreso</span>
                            <span className="font-medium text-foreground">{inspection.percent_complete.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${inspection.percent_complete}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(inspection.status)}
                      <Button onClick={() => navigate(`/inspections/${inspection.id}`)}>
                        Continuar
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedInspections.map((inspection) => (
              <Card key={inspection.id} className="shadow-card hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-success/10 rounded-lg">
                        <ClipboardCheck className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground mb-2">{inspection.area?.name}</h3>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(inspection.scheduled_at), "d 'de' MMMM", { locale: es })}
                          </span>
                          {inspection.area?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {inspection.area.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right mr-3">
                        <div className="text-2xl font-bold text-success">{inspection.percent_complete.toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground">Completado</div>
                      </div>
                      {getStatusBadge(inspection.status)}
                      <Button variant="outline" onClick={() => navigate(`/inspections/${inspection.id}`)}>
                        Ver Detalle
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
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
