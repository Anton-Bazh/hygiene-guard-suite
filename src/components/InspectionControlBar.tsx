import { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Inspection } from '@/lib/supabase-types';

interface InspectionControlBarProps {
  inspection: Inspection;
  hasIncompleteItems: boolean;
  hasNOKItems: boolean;
  onComplete: (force: boolean, reason?: string) => Promise<any>;
  onMarkIncompleteAsNA: (reason: string) => Promise<any>;
  onReopen: () => Promise<any>;
}

export function InspectionControlBar({
  inspection,
  hasIncompleteItems,
  hasNOKItems,
  onComplete,
  onMarkIncompleteAsNA,
  onReopen,
}: InspectionControlBarProps) {
  const { hasAnyRole } = useAuth();
  const [dialog, setDialog] = useState<'complete' | 'force' | 'incomplete' | 'reopen' | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const canManage = hasAnyRole(['admin', 'supervisor']);
  const isCompleted = ['completed', 'incomplete', 'forced_closed'].includes(inspection.status);

  const handleComplete = async () => {
    if (hasIncompleteItems && !hasNOKItems) {
      setDialog('complete');
      return;
    }

    if (hasNOKItems) {
      setDialog('force');
      return;
    }

    // Can complete normally
    setLoading(true);
    const { error } = await onComplete(false);
    setLoading(false);

    if (!error) {
      setDialog(null);
    }
  };

  const handleForceComplete = async () => {
    setLoading(true);
    const { error } = await onComplete(true, reason);
    setLoading(false);

    if (!error) {
      setDialog(null);
      setReason('');
    }
  };

  const handleMarkIncomplete = async () => {
    setLoading(true);
    const { error } = await onMarkIncompleteAsNA(reason);
    setLoading(false);

    if (!error) {
      setDialog(null);
      setReason('');
    }
  };

  const handleReopen = async () => {
    setLoading(true);
    const { error } = await onReopen();
    setLoading(false);

    if (!error) {
      setDialog(null);
    }
  };

  if (!canManage) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 p-4 bg-muted rounded-lg border border-border">
        {!isCompleted ? (
          <>
            <Button
              onClick={handleComplete}
              disabled={loading}
              className="gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Terminar Inspección
            </Button>

            {hasIncompleteItems && (
              <Button
                variant="outline"
                onClick={() => setDialog('incomplete')}
                disabled={loading}
                className="gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Terminar Inconclusos
              </Button>
            )}

            {hasNOKItems && (
              <Button
                variant="destructive"
                onClick={() => setDialog('force')}
                disabled={loading}
                className="gap-2"
              >
                <XCircle className="w-4 h-4" />
                Marcar Incompleta
              </Button>
            )}
          </>
        ) : (
          <Button
            variant="outline"
            onClick={() => setDialog('reopen')}
            disabled={loading}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reabrir Inspección
          </Button>
        )}
      </div>

      {/* Complete with incomplete items dialog */}
      <AlertDialog open={dialog === 'complete'} onOpenChange={(open) => !open && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Terminar con items pendientes?</AlertDialogTitle>
            <AlertDialogDescription>
              Hay items sin responder. ¿Deseas forzar el cierre de la inspección de todas formas?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceComplete} disabled={loading}>
              {loading ? 'Cerrando...' : 'Forzar Cierre'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Force complete with NOK items */}
      <AlertDialog open={dialog === 'force'} onOpenChange={(open) => !open && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como Incompleta</AlertDialogTitle>
            <AlertDialogDescription>
              Esta inspección tiene items marcados como NOK. Proporciona un motivo para forzar el cierre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="force-reason">Motivo del cierre forzado</Label>
            <Textarea
              id="force-reason"
              placeholder="Explica por qué se está cerrando con items NOK..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleForceComplete} 
              disabled={loading || !reason.trim()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? 'Cerrando...' : 'Forzar Cierre'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark incomplete as NA */}
      <AlertDialog open={dialog === 'incomplete'} onOpenChange={(open) => !open && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminar Items Inconclusos</AlertDialogTitle>
            <AlertDialogDescription>
              Esto marcará todos los items sin responder como N/A. Proporciona una justificación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="incomplete-reason">Justificación</Label>
            <Textarea
              id="incomplete-reason"
              placeholder="Explica por qué estos items quedan inconclusos..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMarkIncomplete} 
              disabled={loading || !reason.trim()}
            >
              {loading ? 'Procesando...' : 'Marcar como N/A'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reopen inspection */}
      <AlertDialog open={dialog === 'reopen'} onOpenChange={(open) => !open && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reabrir Inspección?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto permitirá volver a editar las respuestas de la inspección.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReopen} disabled={loading}>
              {loading ? 'Reabriendo...' : 'Reabrir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
