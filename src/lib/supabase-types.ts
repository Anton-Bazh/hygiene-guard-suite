// Extended types for the application
export type AppRole = 'admin' | 'supervisor' | 'operario' | 'auditor';
export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'incomplete' | 'forced_closed';
export type ItemState = 'OK' | 'NOK' | 'NA' | 'PENDING';
export type CorrectiveActionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type NotificationType = 'delivery_alert' | 'inspection_assigned' | 'inspection_overdue' | 'inventory_low' | 'corrective_action';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Area {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  responsible_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  meta: Record<string, any>;
  link: string | null;
  priority: NotificationPriority;
  read_at: string | null;
  created_at: string;
}

export interface Inspection {
  id: string;
  area_id: string;
  scheduled_at: string;
  created_by: string;
  assigned_to: string | null;
  status: InspectionStatus;
  percent_complete: number;
  started_at: string | null;
  finished_at: string | null;
  notes: string | null;
  force_close_reason: string | null;
  created_at: string;
  updated_at: string;
  area?: Area;
}

export interface InspectionItem {
  id: string;
  inspection_id: string;
  label: string;
  description: string | null;
  order_index: number;
  required: boolean;
  attachment_schema: Record<string, any>;
  created_at: string;
}

export interface InspectionItemResponse {
  id: string;
  inspection_item_id: string;
  inspection_id: string;
  user_id: string;
  state: ItemState;
  comment: string | null;
  photos: string[];
  created_at: string;
  updated_at: string;
}

export interface CorrectiveAction {
  id: string;
  inspection_id: string;
  item_response_id: string | null;
  assigned_to: string;
  status: CorrectiveActionStatus;
  due_date: string | null;
  notes: string;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}
