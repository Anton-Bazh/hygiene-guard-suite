import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Equipment {
  id: string;
  code: string;
  name: string;
  category: string;
  stock: number;
  min_stock: number;
  unit: string;
  location?: string;
  description?: string;
  last_delivery_date?: string;
  created_at?: string;
  updated_at?: string;
}

export const useEquipment = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('name');

      if (error) throw error;
      setEquipment(data || []);
    } catch (error: any) {
      console.error('Error fetching equipment:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cargar el equipo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createEquipment = async (equipmentData: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .insert([equipmentData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Equipo creado correctamente',
      });

      await fetchEquipment();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating equipment:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el equipo',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Equipo actualizado correctamente',
      });

      await fetchEquipment();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating equipment:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el equipo',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const deleteEquipment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Equipo eliminado correctamente',
      });

      await fetchEquipment();
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting equipment:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el equipo',
        variant: 'destructive',
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchEquipment();

    const channel = supabase
      .channel('equipment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment',
        },
        () => {
          fetchEquipment();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    equipment,
    loading,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    refetch: fetchEquipment,
  };
};
