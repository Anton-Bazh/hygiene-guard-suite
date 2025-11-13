import { useState } from 'react';
import { Check, X, Minus, Camera, MessageSquare, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ItemState, InspectionItem, InspectionItemResponse } from '@/lib/supabase-types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface InspectionChecklistProps {
  items: InspectionItem[];
  responses: InspectionItemResponse[];
  onSubmitResponse: (itemId: string, state: ItemState, comment?: string, photos?: string[]) => Promise<any>;
  disabled?: boolean;
}

export function InspectionChecklist({ 
  items, 
  responses, 
  onSubmitResponse,
  disabled = false 
}: InspectionChecklistProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [correctiveActionDialog, setCorrectiveActionDialog] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const getResponseForItem = (itemId: string) => {
    return responses.find(r => r.inspection_item_id === itemId);
  };

  const handleStateChange = async (itemId: string, state: ItemState) => {
    const response = getResponseForItem(itemId);
    
    if (state === 'NOK') {
      // Show dialog to add comment and potentially create corrective action
      setSelectedItemId(itemId);
      setExpandedItem(itemId);
      setComment(response?.comment || '');
      setPhotos(response?.photos || []);
    } else {
      // Submit directly
      setSubmitting(true);
      const { error } = await onSubmitResponse(
        itemId, 
        state, 
        response?.comment, 
        response?.photos
      );
      
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo guardar la respuesta',
        });
      } else {
        toast({
          title: 'Guardado',
          description: 'Respuesta guardada exitosamente',
        });
      }
      setSubmitting(false);
    }
  };

  const handleSaveResponse = async () => {
    if (!selectedItemId) return;

    setSubmitting(true);
    const response = getResponseForItem(selectedItemId);
    const state = response?.state || 'NOK';

    const { error } = await onSubmitResponse(
      selectedItemId,
      state,
      comment,
      photos
    );

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la respuesta',
      });
    } else {
      toast({
        title: 'Guardado',
        description: 'Respuesta guardada exitosamente',
      });
      setExpandedItem(null);
      setComment('');
      setPhotos([]);
      setSelectedItemId(null);
    }
    setSubmitting(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // In production, upload to Supabase Storage
    // For now, simulate with base64 or placeholder URLs
    const newPhotos: string[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.size > 8 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Archivo muy grande',
          description: `${file.name} excede el límite de 8MB`,
        });
        return;
      }

      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Tipo de archivo no permitido',
          description: `${file.name} debe ser JPG, PNG o PDF`,
        });
        return;
      }

      // Create object URL for preview
      const url = URL.createObjectURL(file);
      newPhotos.push(url);
    });

    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const getStateColor = (state: ItemState) => {
    switch (state) {
      case 'OK':
        return 'bg-success text-success-foreground';
      case 'NOK':
        return 'bg-destructive text-destructive-foreground';
      case 'NA':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const response = getResponseForItem(item.id);
        const isExpanded = expandedItem === item.id;

        return (
          <Card key={item.id} className={cn(
            "shadow-card transition-all",
            response?.state === 'NOK' && "border-l-4 border-l-destructive"
          )}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Item number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>

                <div className="flex-1">
                  {/* Item title and description */}
                  <div className="mb-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{item.label}</h3>
                      {response && (
                        <Badge className={getStateColor(response.state)}>
                          {response.state}
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Button
                      variant={response?.state === 'OK' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStateChange(item.id, 'OK')}
                      disabled={disabled || submitting}
                      className="gap-2"
                    >
                      <Check className="w-4 h-4" />
                      OK
                    </Button>
                    <Button
                      variant={response?.state === 'NOK' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => handleStateChange(item.id, 'NOK')}
                      disabled={disabled || submitting}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      NOK
                    </Button>
                    <Button
                      variant={response?.state === 'NA' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => handleStateChange(item.id, 'NA')}
                      disabled={disabled || submitting}
                      className="gap-2"
                    >
                      <Minus className="w-4 h-4" />
                      N/A
                    </Button>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="space-y-3 p-3 bg-muted rounded-lg">
                      <div>
                        <Label htmlFor={`comment-${item.id}`} className="mb-2 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Comentario
                        </Label>
                        <Textarea
                          id={`comment-${item.id}`}
                          placeholder="Describe el problema o situación..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`photos-${item.id}`} className="mb-2 flex items-center gap-2">
                          <Camera className="w-4 h-4" />
                          Fotos de evidencia
                        </Label>
                        <Input
                          id={`photos-${item.id}`}
                          type="file"
                          accept="image/jpeg,image/png,application/pdf"
                          multiple
                          onChange={handleFileUpload}
                        />
                        {photos.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {photos.map((photo, i) => (
                              <div key={i} className="w-20 h-20 rounded border border-border overflow-hidden">
                                <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {response?.state === 'NOK' && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-semibold text-destructive mb-1">Acción Correctiva Requerida</p>
                            <p className="text-muted-foreground">
                              Este item requiere una acción correctiva. Asegúrate de documentar el problema y asignar un responsable.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button onClick={handleSaveResponse} disabled={submitting}>
                          {submitting ? 'Guardando...' : 'Guardar'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setExpandedItem(null);
                            setComment('');
                            setPhotos([]);
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Show comment if exists and not expanded */}
                  {!isExpanded && response?.comment && (
                    <div className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                      <span className="font-medium">Comentario:</span> {response.comment}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
