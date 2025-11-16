-- =====================================================
-- SCRIPT COMPLETO DE CONFIGURACIÓN DE BASE DE DATOS
-- Módulo de Seguridad e Higiene
-- =====================================================
-- INSTRUCCIONES:
-- 1. Ejecute este script en el SQL Editor de Supabase
-- 2. Verifique que no haya errores en la ejecución
-- 3. El script es idempotente (puede ejecutarse múltiples veces)
-- =====================================================

-- =====================================================
-- 1. TABLA DE EQUIPOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'Unidades',
  location TEXT,
  description TEXT,
  last_delivery_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para equipment
CREATE INDEX IF NOT EXISTS idx_equipment_category ON public.equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_stock ON public.equipment(stock);
CREATE INDEX IF NOT EXISTS idx_equipment_code ON public.equipment(code);

-- RLS para equipment
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Everyone can view equipment"
  ON public.equipment FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Admins and supervisors can manage equipment"
  ON public.equipment FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'supervisor'::app_role)
  );

-- =====================================================
-- 2. TABLA DE ENTREGAS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  delivery_date TIMESTAMPTZ NOT NULL,
  received_by TEXT NOT NULL,
  supplier TEXT,
  invoice_number TEXT,
  notes TEXT,
  photos TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para deliveries
CREATE INDEX IF NOT EXISTS idx_deliveries_equipment ON public.deliveries(equipment_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_date ON public.deliveries(delivery_date);

-- RLS para deliveries
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Everyone can view deliveries"
  ON public.deliveries FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Admins and supervisors can manage deliveries"
  ON public.deliveries FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'supervisor'::app_role)
  );

-- =====================================================
-- 3. TABLA DE PERFILES DE EMPLEADOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.employee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  position TEXT,
  department TEXT,
  hire_date DATE,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para employee_profiles
CREATE INDEX IF NOT EXISTS idx_employee_user_id ON public.employee_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_email ON public.employee_profiles(email);
CREATE INDEX IF NOT EXISTS idx_employee_department ON public.employee_profiles(department);

-- RLS para employee_profiles
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Everyone can view employee profiles"
  ON public.employee_profiles FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can update their own profile"
  ON public.employee_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admins can manage all employee profiles"
  ON public.employee_profiles FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 4. STORAGE BUCKETS
-- =====================================================
-- Bucket para fotos de entregas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'delivery-photos',
  'delivery-photos',
  true,
  8388608, -- 8MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para fotos de inspecciones
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspection-photos',
  'inspection-photos',
  true,
  8388608, -- 8MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para avatares de empleados
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-avatars',
  'employee-avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. RLS POLÍTICAS PARA STORAGE
-- =====================================================
-- Políticas para delivery-photos
CREATE POLICY IF NOT EXISTS "Anyone can view delivery photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'delivery-photos');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload delivery photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'delivery-photos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY IF NOT EXISTS "Users can update their delivery photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'delivery-photos' AND auth.role() = 'authenticated');

-- Políticas para inspection-photos
CREATE POLICY IF NOT EXISTS "Anyone can view inspection photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inspection-photos');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload inspection photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'inspection-photos' AND
    auth.role() = 'authenticated'
  );

-- Políticas para employee-avatars
CREATE POLICY IF NOT EXISTS "Anyone can view employee avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'employee-avatars');

CREATE POLICY IF NOT EXISTS "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'employee-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY IF NOT EXISTS "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'employee-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- 6. TRIGGERS PARA UPDATED_AT
-- =====================================================
-- Trigger para equipment
DROP TRIGGER IF EXISTS set_equipment_updated_at ON public.equipment;
CREATE TRIGGER set_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para employee_profiles
DROP TRIGGER IF EXISTS set_employee_profiles_updated_at ON public.employee_profiles;
CREATE TRIGGER set_employee_profiles_updated_at
  BEFORE UPDATE ON public.employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 7. FUNCIÓN PARA INCREMENTAR STOCK
-- =====================================================
CREATE OR REPLACE FUNCTION public.increment_equipment_stock(
  equipment_id UUID,
  quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.equipment
  SET 
    stock = stock + quantity,
    last_delivery_date = NOW(),
    updated_at = NOW()
  WHERE id = equipment_id;
END;
$$;

-- =====================================================
-- 8. FUNCIÓN PARA NOTIFICACIÓN DE STOCK BAJO
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si el stock es menor al mínimo, crear notificación
  IF NEW.stock < NEW.min_stock THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      priority,
      title,
      body,
      meta
    )
    SELECT 
      ur.user_id,
      'inventory_low'::notification_type,
      'high'::notification_priority,
      'Stock Bajo: ' || NEW.name,
      'El equipo ' || NEW.name || ' (' || NEW.code || ') tiene stock bajo. Stock actual: ' || NEW.stock || ', Mínimo: ' || NEW.min_stock,
      jsonb_build_object(
        'equipment_id', NEW.id,
        'equipment_code', NEW.code,
        'current_stock', NEW.stock,
        'min_stock', NEW.min_stock
      )
    FROM public.user_roles ur
    WHERE ur.role IN ('admin', 'supervisor');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para verificar stock bajo
DROP TRIGGER IF EXISTS check_equipment_low_stock ON public.equipment;
CREATE TRIGGER check_equipment_low_stock
  AFTER UPDATE OF stock ON public.equipment
  FOR EACH ROW
  WHEN (NEW.stock < NEW.min_stock)
  EXECUTE FUNCTION public.check_low_stock();

-- =====================================================
-- 9. HABILITAR REALTIME
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.equipment;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_profiles;

-- Para actualizaciones completas en realtime
ALTER TABLE public.equipment REPLICA IDENTITY FULL;
ALTER TABLE public.deliveries REPLICA IDENTITY FULL;
ALTER TABLE public.employee_profiles REPLICA IDENTITY FULL;

-- =====================================================
-- 10. DATOS DE PRUEBA (OPCIONAL)
-- =====================================================
-- Insertar algunos equipos de ejemplo si no existen
INSERT INTO public.equipment (code, name, category, stock, min_stock, unit, location, description)
VALUES
  ('EPP-001', 'Casco de Seguridad', 'EPP', 50, 20, 'Unidades', 'Almacén Principal', 'Casco clase G con barbiquejo'),
  ('EPP-002', 'Guantes de Nitrilo', 'EPP', 200, 100, 'Pares', 'Almacén Principal', 'Guantes desechables talle M'),
  ('EPP-003', 'Zapatos de Seguridad', 'EPP', 30, 15, 'Pares', 'Almacén Principal', 'Zapatos con puntera de acero'),
  ('HER-001', 'Extintor ABC 5kg', 'Equipos', 25, 10, 'Unidades', 'Almacén Equipos', 'Extintor multiusos 5kg'),
  ('SEÑ-001', 'Señal Prohibido Fumar', 'Señalización', 15, 5, 'Unidades', 'Almacén Señalética', 'Cartel 30x40cm')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
-- Verificar que todas las tablas existen
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = 'equipment') = 1, 'Tabla equipment no existe';
  ASSERT (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = 'deliveries') = 1, 'Tabla deliveries no existe';
  ASSERT (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = 'employee_profiles') = 1, 'Tabla employee_profiles no existe';
  RAISE NOTICE 'Verificación completada: Todas las tablas existen';
END $$;

-- Verificar buckets
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM storage.buckets WHERE id IN ('delivery-photos', 'inspection-photos', 'employee-avatars')) = 3, 'Faltan buckets de storage';
  RAISE NOTICE 'Verificación completada: Todos los buckets existen';
END $$;

RAISE NOTICE '=====================================================';
RAISE NOTICE 'CONFIGURACIÓN COMPLETADA EXITOSAMENTE';
RAISE NOTICE '=====================================================';
RAISE NOTICE 'Tablas creadas: equipment, deliveries, employee_profiles';
RAISE NOTICE 'Buckets creados: delivery-photos, inspection-photos, employee-avatars';
RAISE NOTICE 'RLS habilitado y configurado';
RAISE NOTICE 'Realtime habilitado para todas las tablas';
RAISE NOTICE '=====================================================';
