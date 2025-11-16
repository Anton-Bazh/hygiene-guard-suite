import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Delivery {
  id: string;
  equipment_id: string;
  quantity: number;
  delivery_date: string;
  received_by: string;
  supplier?: string;
  invoice_number?: string;
  notes?: string;
  photos?: string[];
  created_at?: string;
  equipment?: {
    name: string;
    code: string;
  };
}

export const useDeliveries = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          equipment:equipment_id (
            name,
            code
          )
        `)
        .order('delivery_date', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error: any) {
      console.error('Error fetching deliveries:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cargar las entregas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createDelivery = async (deliveryData: Omit<Delivery, 'id' | 'created_at' | 'equipment'>) => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .insert([deliveryData])
        .select()
        .single();

      if (error) throw error;

      // Update equipment stock
      const { error: updateError } = await supabase.rpc('increment_equipment_stock', {
        equipment_id: deliveryData.equipment_id,
        quantity: deliveryData.quantity,
      });

      if (updateError) throw updateError;

      toast({
        title: 'Éxito',
        description: 'Entrega registrada correctamente',
      });

      await fetchDeliveries();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating delivery:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar la entrega',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const uploadDeliveryPhotos = async (deliveryId: string, files: File[]) => {
    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${deliveryId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('delivery-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('delivery-photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(data.publicUrl);
      }

      // Update delivery with photo URLs
      const { error: updateError } = await supabase
        .from('deliveries')
        .update({ photos: uploadedUrls })
        .eq('id', deliveryId);

      if (updateError) throw updateError;

      return { urls: uploadedUrls, error: null };
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      return { urls: null, error };
    }
  };

  useEffect(() => {
    fetchDeliveries();

    const channel = supabase
      .channel('deliveries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
        },
        () => {
          fetchDeliveries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    deliveries,
    loading,
    createDelivery,
    uploadDeliveryPhotos,
    refetch: fetchDeliveries,
  };
};
