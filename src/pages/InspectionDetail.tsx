import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, User, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { InspectionChecklist } from '@/components/InspectionChecklist';
import { InspectionControlBar } from '@/components/InspectionControlBar';
import { useInspectionDetail } from '@/hooks/useInspections';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', variant: 'secondary' as const },
  in_progress: { label: 'En Proceso', variant: 'default' as const },
  completed: { label: 'Completada', variant: 'outline' as const },
  incomplete: { label: 'Incompleta', variant: 'destructive' as const },
  forced_closed: { label: 'Cerrada Forzosamente', variant: 'destructive' as const },
};

export default function InspectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    inspection,
    items,
    responses,
    loading,
    submitResponse,
    completeInspection,
    markIncompleteAsNA,
    reopenInspection,
  } = useInspectionDetail(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando inspección...</p>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Inspección no encontrada</h2>
          <Button onClick={() => navigate('/inspections')}>Volver a Inspecciones</Button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[inspection.status];
  const hasIncompleteItems = items.length > responses.length;
  const hasNOKItems = responses.some(r => r.state === 'NOK');
  const isCompleted = ['completed', 'incomplete', 'forced_closed'].includes(inspection.status);

  const handleSubmitResponse = async (itemId: string, state: any, comment?: string, photos?: string[]) => {
    const result = await submitResponse(itemId, state, comment, photos);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la respuesta',
      });
    }
    return result;
  };

  const handleComplete = async (force: boolean, reason?: string) => {
    const result = await completeInspection(force, reason);
    if (!result.error) {
      toast({
        title: 'Inspección completada',
        description: 'La inspección ha sido completada exitosamente',
      });
    }
    return result;
  };

  const handleMarkIncompleteAsNA = async (reason: string) => {
    const result = await markIncompleteAsNA(reason);
    if (!result.error) {
      toast({
        title: 'Items marcados',
        description: 'Los items inconclusos han sido marcados como N/A',
      });
      // Complete inspection after marking as NA
      await completeInspection(false);
    }
    return result;
  };

  const handleReopen = async () => {
    const result = await reopenInspection();
    if (!result.error) {
      toast({
        title: 'Inspección reabierta',
        description: 'La inspección ha sido reabierta para edición',
      });
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-border">
        <div className="container mx-auto px-6 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/inspections')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Inspecciones
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">
                  Inspección: {inspection.area?.name}
                </h1>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(inspection.scheduled_at), "d 'de' MMMM, yyyy", { locale: es })}
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
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Progress Card */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Progreso de Inspección
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Completado</span>
                  <span className="text-sm font-bold">{inspection.percent_complete.toFixed(0)}%</span>
                </div>
                <Progress value={inspection.percent_complete} className="h-3" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-foreground">{items.length}</div>
                  <div className="text-xs text-muted-foreground">Total Items</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">{responses.filter(r => r.state === 'OK').length}</div>
                  <div className="text-xs text-muted-foreground">OK</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-destructive">{responses.filter(r => r.state === 'NOK').length}</div>
                  <div className="text-xs text-muted-foreground">NOK</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Control Bar */}
        <InspectionControlBar
          inspection={inspection}
          hasIncompleteItems={hasIncompleteItems}
          hasNOKItems={hasNOKItems}
          onComplete={handleComplete}
          onMarkIncompleteAsNA={handleMarkIncompleteAsNA}
          onReopen={handleReopen}
        />

        {/* Checklist */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Checklist de Inspección</h2>
          <InspectionChecklist
            items={items}
            responses={responses}
            onSubmitResponse={handleSubmitResponse}
            disabled={isCompleted}
          />
        </div>

        {inspection.notes && (
          <Card className="mt-8 shadow-card">
            <CardHeader>
              <CardTitle>Notas Adicionales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{inspection.notes}</p>
            </CardContent>
          </Card>
        )}

        {inspection.force_close_reason && (
          <Card className="mt-8 shadow-card border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Motivo de Cierre Forzado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{inspection.force_close_reason}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
