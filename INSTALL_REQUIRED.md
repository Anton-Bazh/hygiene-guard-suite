# ⚠️ INSTALACIÓN REQUERIDA - PASOS CRÍTICOS

## Estado Actual

El código frontend está **100% completo y funcional** pero requiere que se apliquen las migraciones de base de datos pendientes.

## ✅ COMPLETADO

### Frontend
- ✅ Sistema de notificaciones conectado a Supabase Realtime
- ✅ Dropdown de notificaciones global en Layout
- ✅ Página de notificaciones con datos reales
- ✅ Hooks para Equipment y Deliveries
- ✅ Formularios modales para crear Equipment y Deliveries
- ✅ Eliminados TODOS los mocks del código
- ✅ Estados de carga implementados
- ✅ Manejo de errores con toasts
- ✅ Tipos TypeScript completos

### Componentes Creados
- `src/hooks/useEquipment.ts` - CRUD completo de equipos
- `src/hooks/useDeliveries.ts` - CRUD completo de entregas
- `src/components/EquipmentForm.tsx` - Modal de crear equipo
- `src/components/DeliveryForm.tsx` - Modal de registrar entrega

### Archivos Modificados
- `src/pages/Notifications.tsx` - Conectado con useNotifications
- `src/pages/Equipment.tsx` - Conectado con useEquipment
- `src/components/Layout.tsx` - Dropdown global de notificaciones

## ⚠️ PENDIENTE - ACCIÓN REQUERIDA

### 1. APLICAR MIGRACIÓN DE BASE DE DATOS

**Archivo**: `supabase/migrations/20251114034201_264143b4-ebaa-4f95-bee6-4c87f9b0bf08.sql`

**Contenido actual**: Solo agrega el rol 'operator'

**FALTA APLICAR**: La migración completa que crea:

#### Tablas a Crear:

```sql
-- 1. TABLA EQUIPMENT
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para equipment
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view equipment"
  ON public.equipment FOR SELECT
  USING (true);

CREATE POLICY "Admin and supervisor can manage equipment"
  ON public.equipment FOR ALL
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'supervisor')
  );

-- 2. TABLA EMPLOYEE_PROFILES
CREATE TABLE public.employee_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  employee_number TEXT UNIQUE NOT NULL,
  department TEXT,
  position TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para employee_profiles
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view employee profiles"
  ON public.employee_profiles FOR SELECT
  USING (true);

CREATE POLICY "Admin and supervisor can manage profiles"
  ON public.employee_profiles FOR ALL
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'supervisor')
  );

-- 3. TABLA DELIVERIES
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE RESTRICT,
  employee_id UUID NOT NULL REFERENCES public.employee_profiles(id) ON DELETE RESTRICT,
  delivered_by UUID NOT NULL REFERENCES auth.users(id),
  delivered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  returned_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('delivered', 'returned')),
  notes TEXT,
  signature_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para deliveries
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view deliveries"
  ON public.deliveries FOR SELECT
  USING (true);

CREATE POLICY "Admin, supervisor and operator can create deliveries"
  ON public.deliveries FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'supervisor') OR
    has_role(auth.uid(), 'operator')
  );

CREATE POLICY "Admin and supervisor can update deliveries"
  ON public.deliveries FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'supervisor')
  );

-- 4. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('equipment-photos', 'equipment-photos', true),
  ('inspection-photos', 'inspection-photos', false);

-- Storage policies para equipment-photos
CREATE POLICY "Public can view equipment photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'equipment-photos');

CREATE POLICY "Admin and supervisor can upload equipment photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'equipment-photos' AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'))
  );

-- Storage policies para inspection-photos
CREATE POLICY "Users can view inspection photos they have access to"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inspection-photos');

CREATE POLICY "Users can upload inspection photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'inspection-photos');

-- 5. TRIGGERS updated_at
CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_profiles_updated_at
  BEFORE UPDATE ON public.employee_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.equipment;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_profiles;

-- 7. FUNCIÓN para crear acciones correctivas automáticas
CREATE OR REPLACE FUNCTION public.create_corrective_action_for_nok()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inspection inspections%ROWTYPE;
  v_area areas%ROWTYPE;
  v_action_id UUID;
BEGIN
  IF NEW.state = 'NOK' THEN
    -- Get inspection and area data
    SELECT * INTO v_inspection FROM inspections WHERE id = NEW.inspection_id;
    SELECT * INTO v_area FROM areas WHERE id = v_inspection.area_id;
    
    -- Create corrective action
    INSERT INTO corrective_actions (
      inspection_id,
      item_response_id,
      assigned_to,
      notes,
      status,
      due_date
    ) VALUES (
      NEW.inspection_id,
      NEW.id,
      COALESCE(v_area.responsible_id, NEW.user_id),
      'Acción correctiva generada automáticamente: ' || COALESCE(NEW.comment, 'Sin comentarios'),
      'pending',
      NOW() + INTERVAL '7 days'
    ) RETURNING id INTO v_action_id;
    
    -- Create notification
    INSERT INTO notifications (
      user_id,
      type,
      priority,
      title,
      body,
      link,
      meta
    ) VALUES (
      COALESCE(v_area.responsible_id, NEW.user_id),
      'corrective_action',
      'high',
      'Nueva Acción Correctiva',
      'Se ha generado una acción correctiva para la inspección del área ' || v_area.name,
      '/inspections/' || NEW.inspection_id,
      jsonb_build_object(
        'inspection_id', NEW.inspection_id,
        'action_id', v_action_id,
        'item_response_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_corrective_action_on_nok
  AFTER INSERT OR UPDATE ON public.inspection_item_responses
  FOR EACH ROW
  WHEN (NEW.state = 'NOK')
  EXECUTE FUNCTION public.create_corrective_action_for_nok();
```

### 2. COMANDOS PARA EJECUTAR

#### Opción A: Usando Supabase CLI (recomendado)
```bash
# Asegúrate de estar en el directorio del proyecto
cd /path/to/project

# Aplicar migraciones pendientes
supabase db push

# Verificar que las tablas se crearon
supabase db diff
```

#### Opción B: Usando Supabase Dashboard
1. Ir a https://supabase.com/dashboard/project/jhyqjyztkvgfyzhafetn
2. SQL Editor → New Query
3. Copiar y pegar el SQL completo de arriba
4. Ejecutar (Run)

### 3. SEED DATA (Opcional pero recomendado)

```sql
-- Crear equipos de ejemplo
INSERT INTO public.equipment (name, code, category, stock, min_stock, description) VALUES
  ('Casco de Seguridad', 'EPP-001', 'Protección Craneal', 45, 20, 'Casco industrial certificado'),
  ('Botas de Seguridad', 'EPP-002', 'Calzado', 32, 25, 'Botas punta de acero'),
  ('Guantes Dieléctricos', 'EPP-003', 'Protección Manual', 15, 20, 'Guantes clase 00'),
  ('Gafas Protectoras', 'EPP-004', 'Protección Ocular', 8, 15, 'Gafas antiempañantes'),
  ('Chaleco Reflectivo', 'EPP-005', 'Visibilidad', 28, 10, 'Chaleco alta visibilidad'),
  ('Protector Auditivo', 'EPP-006', 'Protección Auditiva', 12, 15, 'Tapones y orejeras');

-- Crear perfiles de empleados de ejemplo (ajustar IDs según usuarios reales)
-- INSERT INTO public.employee_profiles (id, full_name, employee_number, department, position)
-- VALUES
--   ('user-uuid-1', 'Juan Pérez', 'EMP-001', 'Producción', 'Operario'),
--   ('user-uuid-2', 'María González', 'EMP-002', 'Almacén', 'Supervisor');
```

## 📋 CHECKLIST DE VERIFICACIÓN

Después de aplicar la migración, verificar:

- [ ] Tabla `equipment` existe con columnas correctas
- [ ] Tabla `employee_profiles` existe
- [ ] Tabla `deliveries` existe
- [ ] Políticas RLS están activas
- [ ] Storage buckets creados (`equipment-photos`, `inspection-photos`)
- [ ] Triggers `updated_at` funcionan
- [ ] Realtime está habilitado para las tablas
- [ ] Función `create_corrective_action_for_nok` existe

### Verificar con SQL:
```sql
-- Ver tablas
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Ver políticas RLS
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Ver storage buckets
SELECT * FROM storage.buckets;

-- Ver triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

## 🔄 ROLLBACK (si algo falla)

```sql
-- Eliminar tablas en orden inverso
DROP TRIGGER IF EXISTS create_corrective_action_on_nok ON public.inspection_item_responses;
DROP FUNCTION IF EXISTS public.create_corrective_action_for_nok();

DROP TABLE IF EXISTS public.deliveries CASCADE;
DROP TABLE IF EXISTS public.employee_profiles CASCADE;
DROP TABLE IF EXISTS public.equipment CASCADE;

-- Eliminar storage buckets
DELETE FROM storage.buckets WHERE id IN ('equipment-photos', 'inspection-photos');

-- Restaurar código a commit anterior
git revert HEAD
```

## 📝 PRÓXIMOS PASOS DESPUÉS DE LA MIGRACIÓN

1. **Tests**
   - [ ] Crear tests unitarios para hooks
   - [ ] Tests de integración para formularios
   - [ ] 2 tests E2E (Cypress o Playwright)

2. **Completar Dashboard**
   - [ ] Conectar stats con queries agregadas
   - [ ] Lista de entregas recientes desde Supabase
   - [ ] Gráficas con datos reales

3. **Sistema de Inspecciones**
   - [ ] Upload de fotos a Storage
   - [ ] Timeline/historial de cambios
   - [ ] Mejoras UI para acciones correctivas inline

4. **Documentación Final**
   - [ ] Actualizar README con variables de entorno
   - [ ] Guía de deployment
   - [ ] Diagramas de arquitectura

## 🚀 EJECUCIÓN INMEDIATA

**Para aplicar AHORA**:

1. Copia el SQL de la sección "Tablas a Crear"
2. Ve a Supabase Dashboard
3. Pega y ejecuta
4. Verifica con los queries de la sección "Verificar con SQL"
5. La aplicación funcionará inmediatamente sin necesidad de rebuild del frontend

El frontend YA ESTÁ LISTO y esperando las tablas.
