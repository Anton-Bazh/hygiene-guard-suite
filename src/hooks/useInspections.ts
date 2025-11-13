import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Inspection, 
  InspectionItem, 
  InspectionItemResponse,
  ItemState 
} from '@/lib/supabase-types';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useInspections() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const fetchInspections = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          area:areas(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInspections(data as Inspection[]);
    } catch (error) {
      console.error('Error fetching inspections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInspections();

    // Subscribe to realtime updates
    const newChannel = supabase
      .channel('inspections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inspections'
        },
        (payload) => {
          console.log('Inspection change received:', payload);
          fetchInspections(); // Re-fetch to get updated data with relations
        }
      )
      .subscribe();

    setChannel(newChannel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchInspections]);

  return {
    inspections,
    loading,
    refetch: fetchInspections,
  };
}

export function useInspectionDetail(inspectionId: string | undefined) {
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [responses, setResponses] = useState<InspectionItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const fetchInspectionDetail = useCallback(async () => {
    if (!inspectionId) return;

    try {
      // Fetch inspection
      const { data: inspData, error: inspError } = await supabase
        .from('inspections')
        .select(`
          *,
          area:areas(*)
        `)
        .eq('id', inspectionId)
        .single();

      if (inspError) throw inspError;
      setInspection(inspData as Inspection);

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from('inspection_items')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('order_index', { ascending: true });

      if (itemsError) throw itemsError;
      setItems(itemsData as InspectionItem[]);

      // Fetch responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('inspection_item_responses')
        .select('*')
        .eq('inspection_id', inspectionId);

      if (responsesError) throw responsesError;
      setResponses(responsesData as InspectionItemResponse[]);
    } catch (error) {
      console.error('Error fetching inspection detail:', error);
    } finally {
      setLoading(false);
    }
  }, [inspectionId]);

  const submitResponse = useCallback(async (
    itemId: string,
    state: ItemState,
    comment?: string,
    photos?: string[]
  ) => {
    if (!inspectionId) return;

    try {
      const { data, error } = await supabase
        .from('inspection_item_responses')
        .upsert({
          inspection_item_id: itemId,
          inspection_id: inspectionId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          state,
          comment: comment || null,
          photos: photos || [],
        }, {
          onConflict: 'inspection_item_id,inspection_id'
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setResponses(prev => {
        const existing = prev.find(r => r.inspection_item_id === itemId);
        if (existing) {
          return prev.map(r => r.inspection_item_id === itemId ? data as InspectionItemResponse : r);
        }
        return [...prev, data as InspectionItemResponse];
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error submitting response:', error);
      return { data: null, error };
    }
  }, [inspectionId]);

  const completeInspection = useCallback(async (force = false, reason?: string) => {
    if (!inspectionId) return;

    try {
      const updates: any = {
        finished_at: new Date().toISOString(),
      };

      if (force) {
        updates.status = 'forced_closed';
        updates.force_close_reason = reason;
      }

      const { error } = await supabase
        .from('inspections')
        .update(updates)
        .eq('id', inspectionId);

      if (error) throw error;

      await fetchInspectionDetail();
      return { error: null };
    } catch (error) {
      console.error('Error completing inspection:', error);
      return { error };
    }
  }, [inspectionId, fetchInspectionDetail]);

  const markIncompleteAsNA = useCallback(async (reason: string) => {
    if (!inspectionId) return;

    try {
      // Get pending items
      const pendingItems = items.filter(item => 
        !responses.find(r => r.inspection_item_id === item.id)
      );

      // Mark all as NA
      for (const item of pendingItems) {
        await submitResponse(item.id, 'NA', reason);
      }

      return { error: null };
    } catch (error) {
      console.error('Error marking incomplete as NA:', error);
      return { error };
    }
  }, [inspectionId, items, responses, submitResponse]);

  const reopenInspection = useCallback(async () => {
    if (!inspectionId) return;

    try {
      const { error } = await supabase
        .from('inspections')
        .update({
          status: 'in_progress',
          finished_at: null,
          force_close_reason: null,
        })
        .eq('id', inspectionId);

      if (error) throw error;

      await fetchInspectionDetail();
      return { error: null };
    } catch (error) {
      console.error('Error reopening inspection:', error);
      return { error };
    }
  }, [inspectionId, fetchInspectionDetail]);

  useEffect(() => {
    fetchInspectionDetail();

    if (!inspectionId) return;

    // Subscribe to realtime updates
    const newChannel = supabase
      .channel(`inspection-${inspectionId}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inspection_item_responses',
          filter: `inspection_id=eq.${inspectionId}`
        },
        (payload) => {
          console.log('Response change received:', payload);
          fetchInspectionDetail();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inspections',
          filter: `id=eq.${inspectionId}`
        },
        (payload) => {
          console.log('Inspection update received:', payload);
          fetchInspectionDetail();
        }
      )
      .subscribe();

    setChannel(newChannel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [inspectionId, fetchInspectionDetail]);

  return {
    inspection,
    items,
    responses,
    loading,
    submitResponse,
    completeInspection,
    markIncompleteAsNA,
    reopenInspection,
    refetch: fetchInspectionDetail,
  };
}
