import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Employee {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  hire_date?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  roles?: string[];
}

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select(`
          *,
          user_roles (
            role
          )
        `)
        .order('full_name');

      if (error) throw error;

      const formattedData = data?.map(emp => ({
        ...emp,
        roles: emp.user_roles?.map((ur: any) => ur.role) || [],
      })) || [];

      setEmployees(formattedData);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cargar los empleados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'roles'>) => {
    try {
      const { data, error } = await supabase
        .from('employee_profiles')
        .insert([employeeData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Empleado creado correctamente',
      });

      await fetchEmployees();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el empleado',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      const { data, error } = await supabase
        .from('employee_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Empleado actualizado correctamente',
      });

      await fetchEmployees();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el empleado',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const toggleEmployeeStatus = async (id: string, isActive: boolean) => {
    return updateEmployee(id, { is_active: isActive });
  };

  useEffect(() => {
    fetchEmployees();

    const channel = supabase
      .channel('employees-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_profiles',
        },
        () => {
          fetchEmployees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    employees,
    loading,
    createEmployee,
    updateEmployee,
    toggleEmployeeStatus,
    refetch: fetchEmployees,
  };
};
