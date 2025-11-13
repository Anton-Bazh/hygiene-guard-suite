-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'operario', 'auditor');

-- Create enum for inspection status
CREATE TYPE public.inspection_status AS ENUM ('pending', 'in_progress', 'completed', 'incomplete', 'forced_closed');

-- Create enum for inspection item state
CREATE TYPE public.item_state AS ENUM ('OK', 'NOK', 'NA', 'PENDING');

-- Create enum for corrective action status
CREATE TYPE public.corrective_action_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create enum for notification type
CREATE TYPE public.notification_type AS ENUM ('delivery_alert', 'inspection_assigned', 'inspection_overdue', 'inventory_low', 'corrective_action');

-- Create enum for notification priority
CREATE TYPE public.notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Create areas table
CREATE TABLE public.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    responsible_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    meta JSONB DEFAULT '{}'::jsonb,
    link TEXT,
    priority notification_priority DEFAULT 'normal',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inspections table
CREATE TABLE public.inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    assigned_to UUID REFERENCES auth.users(id),
    status inspection_status DEFAULT 'pending',
    percent_complete NUMERIC(5,2) DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    force_close_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inspection_items table
CREATE TABLE public.inspection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    required BOOLEAN DEFAULT true,
    attachment_schema JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inspection_item_responses table
CREATE TABLE public.inspection_item_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_item_id UUID REFERENCES public.inspection_items(id) ON DELETE CASCADE NOT NULL,
    inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    state item_state NOT NULL,
    comment TEXT,
    photos TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (inspection_item_id, inspection_id)
);

-- Create corrective_actions table
CREATE TABLE public.corrective_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE NOT NULL,
    item_response_id UUID REFERENCES public.inspection_item_responses(id),
    assigned_to UUID REFERENCES auth.users(id) NOT NULL,
    status corrective_action_status DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    notes TEXT NOT NULL,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_inspections_area_id ON public.inspections(area_id);
CREATE INDEX idx_inspections_assigned_to ON public.inspections(assigned_to);
CREATE INDEX idx_inspections_status ON public.inspections(status);
CREATE INDEX idx_inspections_created_at ON public.inspections(created_at DESC);
CREATE INDEX idx_inspection_items_inspection_id ON public.inspection_items(inspection_id);
CREATE INDEX idx_inspection_item_responses_inspection_id ON public.inspection_item_responses(inspection_id);
CREATE INDEX idx_inspection_item_responses_user_id ON public.inspection_item_responses(user_id);
CREATE INDEX idx_corrective_actions_inspection_id ON public.corrective_actions(inspection_id);
CREATE INDEX idx_corrective_actions_assigned_to ON public.corrective_actions(assigned_to);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_item_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- Create function to update inspection progress
CREATE OR REPLACE FUNCTION public.update_inspection_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_items INTEGER;
  completed_items INTEGER;
  has_nok BOOLEAN;
  new_percent NUMERIC(5,2);
  new_status inspection_status;
BEGIN
  -- Get total items for this inspection
  SELECT COUNT(*) INTO total_items
  FROM public.inspection_items
  WHERE inspection_id = NEW.inspection_id;

  -- Get completed items (OK, NOK, or NA)
  SELECT COUNT(*) INTO completed_items
  FROM public.inspection_item_responses
  WHERE inspection_id = NEW.inspection_id
    AND state IN ('OK', 'NOK', 'NA');

  -- Check if there are any NOK responses
  SELECT EXISTS (
    SELECT 1
    FROM public.inspection_item_responses
    WHERE inspection_id = NEW.inspection_id
      AND state = 'NOK'
  ) INTO has_nok;

  -- Calculate percentage
  IF total_items > 0 THEN
    new_percent := (completed_items::NUMERIC / total_items::NUMERIC) * 100;
  ELSE
    new_percent := 0;
  END IF;

  -- Determine status
  IF new_percent = 0 THEN
    new_status := 'pending';
  ELSIF new_percent = 100 THEN
    IF has_nok THEN
      new_status := 'incomplete';
    ELSE
      new_status := 'completed';
    END IF;
  ELSE
    new_status := 'in_progress';
  END IF;

  -- Update inspection
  UPDATE public.inspections
  SET 
    percent_complete = new_percent,
    status = new_status,
    updated_at = NOW()
  WHERE id = NEW.inspection_id;

  RETURN NEW;
END;
$$;

-- Create trigger for automatic progress update
CREATE TRIGGER trigger_update_inspection_progress
AFTER INSERT OR UPDATE ON public.inspection_item_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_inspection_progress();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at columns
CREATE TRIGGER update_areas_updated_at
BEFORE UPDATE ON public.areas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at
BEFORE UPDATE ON public.inspections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspection_item_responses_updated_at
BEFORE UPDATE ON public.inspection_item_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_corrective_actions_updated_at
BEFORE UPDATE ON public.corrective_actions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for areas
CREATE POLICY "Everyone can view areas"
ON public.areas
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and supervisors can manage areas"
ON public.areas
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'supervisor')
);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for inspections
CREATE POLICY "Users can view inspections they created or are assigned to"
ON public.inspections
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR
  assigned_to = auth.uid() OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'supervisor') OR
  public.has_role(auth.uid(), 'auditor')
);

CREATE POLICY "Admins and supervisors can create inspections"
ON public.inspections
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'supervisor')
);

CREATE POLICY "Admins and supervisors can update inspections"
ON public.inspections
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'supervisor')
);

-- RLS Policies for inspection_items
CREATE POLICY "Users can view inspection items for accessible inspections"
ON public.inspection_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.inspections
    WHERE id = inspection_items.inspection_id
      AND (
        created_by = auth.uid() OR
        assigned_to = auth.uid() OR
        public.has_role(auth.uid(), 'admin') OR
        public.has_role(auth.uid(), 'supervisor') OR
        public.has_role(auth.uid(), 'auditor')
      )
  )
);

CREATE POLICY "Admins and supervisors can manage inspection items"
ON public.inspection_items
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'supervisor')
);

-- RLS Policies for inspection_item_responses
CREATE POLICY "Users can view responses for accessible inspections"
ON public.inspection_item_responses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.inspections
    WHERE id = inspection_item_responses.inspection_id
      AND (
        created_by = auth.uid() OR
        assigned_to = auth.uid() OR
        public.has_role(auth.uid(), 'admin') OR
        public.has_role(auth.uid(), 'supervisor') OR
        public.has_role(auth.uid(), 'auditor')
      )
  )
);

CREATE POLICY "Assigned users can create responses"
ON public.inspection_item_responses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inspections
    WHERE id = inspection_item_responses.inspection_id
      AND (
        assigned_to = auth.uid() OR
        public.has_role(auth.uid(), 'admin') OR
        public.has_role(auth.uid(), 'supervisor')
      )
      AND status NOT IN ('completed', 'forced_closed')
  )
);

CREATE POLICY "Users can update their own responses"
ON public.inspection_item_responses
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.inspections
    WHERE id = inspection_item_responses.inspection_id
      AND status NOT IN ('completed', 'forced_closed')
  )
);

-- RLS Policies for corrective_actions
CREATE POLICY "Users can view corrective actions they created or are assigned to"
ON public.corrective_actions
FOR SELECT
TO authenticated
USING (
  assigned_to = auth.uid() OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'supervisor') OR
  public.has_role(auth.uid(), 'auditor')
);

CREATE POLICY "Supervisors can create corrective actions"
ON public.corrective_actions
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'supervisor')
);

CREATE POLICY "Assigned users can update corrective actions"
ON public.corrective_actions
FOR UPDATE
TO authenticated
USING (
  assigned_to = auth.uid() OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'supervisor')
);

-- RLS Policies for audit_logs
CREATE POLICY "Admins and auditors can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'auditor')
);

CREATE POLICY "System can create audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inspections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inspection_item_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.corrective_actions;