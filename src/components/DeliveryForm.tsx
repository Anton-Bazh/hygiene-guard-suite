import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package } from 'lucide-react';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useEquipment } from '@/hooks/useEquipment';

interface DeliveryFormProps {
  trigger?: React.ReactNode;
}

export const DeliveryForm = ({ trigger }: DeliveryFormProps) => {
  const [open, setOpen] = useState(false);
  const { createDelivery, uploadDeliveryPhotos } = useDeliveries();
  const { equipment } = useEquipment();
  const [formData, setFormData] = useState({
    equipment_id: '',
    quantity: 0,
    delivery_date: new Date().toISOString().split('T')[0],
    received_by: '',
    supplier: '',
    invoice_number: '',
    notes: '',
  });
  const [photos, setPhotos] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await createDelivery(formData);
    if (!error && data && photos.length > 0) {
      await uploadDeliveryPhotos(data.id, photos);
    }
    if (!error) {
      setOpen(false);
      setFormData({
        equipment_id: '',
        quantity: 0,
        delivery_date: new Date().toISOString().split('T')[0],
        received_by: '',
        supplier: '',
        invoice_number: '',
        notes: '',
      });
      setPhotos([]);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Package className="w-4 h-4 mr-2" />
            Nueva Entrega
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Entrega de Equipo</DialogTitle>
          <DialogDescription>
            Complete los datos de la entrega recibida
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="equipment_id">Equipo *</Label>
              <Select
                value={formData.equipment_id}
                onValueChange={(value) => setFormData({ ...formData, equipment_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione equipo" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.code} - {eq.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_date">Fecha de Entrega *</Label>
              <Input
                id="delivery_date"
                type="date"
                required
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="received_by">Recibido Por *</Label>
              <Input
                id="received_by"
                required
                value={formData.received_by}
                onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
                placeholder="Nombre del receptor"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Proveedor</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Nombre del proveedor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Nº Factura/Remito</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="FT-00123"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photos">Fotografías</Label>
            <Input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
            />
            {photos.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {photos.length} archivo(s) seleccionado(s)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observaciones adicionales..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Registrar Entrega</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
