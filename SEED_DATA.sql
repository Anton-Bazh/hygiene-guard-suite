-- =====================================================
-- SEED DATA FOR SAFETYHUB
-- =====================================================
-- 
-- IMPORTANT: Before running this script, you MUST:
-- 1. Create at least 4 user accounts through the authentication UI
-- 2. Note their user_id values from auth.users table
-- 3. Replace the UUID placeholders below with actual user IDs
--
-- To get user IDs, run: SELECT id, email FROM auth.users;
-- =====================================================

-- Replace these UUIDs with actual user IDs from your auth.users table
-- USER 1: Admin
-- USER 2: Supervisor  
-- USER 3: Operario
-- USER 4: Auditor

-- Example: After getting real user IDs, replace like this:
-- DO $$
-- DECLARE
--     admin_user_id UUID := 'abc123...';  -- Replace with real ID
--     supervisor_user_id UUID := 'def456...';  -- Replace with real ID
--     operario_user_id UUID := 'ghi789...';  -- Replace with real ID
--     auditor_user_id UUID := 'jkl012...';  -- Replace with real ID

-- For demonstration, we'll use placeholder UUIDs - REPLACE THESE!
DO $$
DECLARE
    admin_user_id UUID := '00000000-0000-0000-0000-000000000001';
    supervisor_user_id UUID := '00000000-0000-0000-0000-000000000002';
    operario_user_id UUID := '00000000-0000-0000-0000-000000000003';
    auditor_user_id UUID := '00000000-0000-0000-0000-000000000004';
    
    area1_id UUID;
    area2_id UUID;
    area3_id UUID;
    
    insp1_id UUID;
    insp2_id UUID;
    
    item1_id UUID;
    item2_id UUID;
    item3_id UUID;
    item4_id UUID;
    item5_id UUID;
BEGIN
    -- =====================================================
    -- 1. ASSIGN USER ROLES
    -- =====================================================
    INSERT INTO public.user_roles (user_id, role) VALUES
    (admin_user_id, 'admin'),
    (supervisor_user_id, 'supervisor'),
    (operario_user_id, 'operario'),
    (auditor_user_id, 'auditor')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- =====================================================
    -- 2. CREATE AREAS
    -- =====================================================
    INSERT INTO public.areas (name, description, location, responsible_id)
    VALUES 
    ('Producción', 'Área de producción y manufactura', 'Planta baja - Zona A', supervisor_user_id),
    ('Almacén', 'Almacén de materiales y equipos', 'Planta baja - Zona B', supervisor_user_id),
    ('Mantenimiento', 'Taller de mantenimiento y reparaciones', 'Planta alta - Zona C', supervisor_user_id)
    RETURNING id INTO area1_id;

    SELECT id INTO area1_id FROM public.areas WHERE name = 'Producción';
    SELECT id INTO area2_id FROM public.areas WHERE name = 'Almacén';
    SELECT id INTO area3_id FROM public.areas WHERE name = 'Mantenimiento';

    -- =====================================================
    -- 3. CREATE INSPECTIONS
    -- =====================================================
    
    -- Inspection 1: Pending inspection
    INSERT INTO public.inspections (
        area_id, scheduled_at, created_by, assigned_to, status, percent_complete
    ) VALUES (
        area1_id,
        NOW() + INTERVAL '2 days',
        supervisor_user_id,
        operario_user_id,
        'pending',
        0
    ) RETURNING id INTO insp1_id;

    -- Inspection 2: In progress inspection
    INSERT INTO public.inspections (
        area_id, scheduled_at, created_by, assigned_to, status, percent_complete, started_at
    ) VALUES (
        area2_id,
        NOW() - INTERVAL '1 day',
        supervisor_user_id,
        operario_user_id,
        'in_progress',
        60,
        NOW() - INTERVAL '3 hours'
    ) RETURNING id INTO insp2_id;

    -- =====================================================
    -- 4. CREATE INSPECTION ITEMS FOR INSPECTION 1
    -- =====================================================
    INSERT INTO public.inspection_items (inspection_id, label, description, order_index, required)
    VALUES 
    (insp1_id, 'Extintores operativos', 'Verificar que todos los extintores estén cargados y accesibles', 1, true),
    (insp1_id, 'Salidas de emergencia', 'Verificar que las salidas estén despejadas y señalizadas', 2, true),
    (insp1_id, 'Iluminación de emergencia', 'Verificar funcionamiento de luces de emergencia', 3, true),
    (insp1_id, 'Botiquín de primeros auxilios', 'Verificar contenido completo y medicamentos en fecha', 4, true),
    (insp1_id, 'EPP disponible', 'Verificar disponibilidad de cascos, guantes y gafas', 5, true);

    -- =====================================================
    -- 5. CREATE INSPECTION ITEMS FOR INSPECTION 2
    -- =====================================================
    INSERT INTO public.inspection_items (inspection_id, label, description, order_index, required)
    VALUES 
    (insp2_id, 'Orden y limpieza', 'Verificar que el área esté ordenada y limpia', 1, true),
    (insp2_id, 'Señalización', 'Verificar señalización de seguridad visible', 2, true),
    (insp2_id, 'Maquinaria protegida', 'Verificar guardas de seguridad en máquinas', 3, true),
    (insp2_id, 'Cables eléctricos', 'Verificar estado de cables y conexiones', 4, true),
    (insp2_id, 'Ventilación', 'Verificar sistema de ventilación operativo', 5, true)
    RETURNING id INTO item1_id;

    SELECT id INTO item1_id FROM public.inspection_items WHERE inspection_id = insp2_id AND order_index = 1;
    SELECT id INTO item2_id FROM public.inspection_items WHERE inspection_id = insp2_id AND order_index = 2;
    SELECT id INTO item3_id FROM public.inspection_items WHERE inspection_id = insp2_id AND order_index = 3;

    -- =====================================================
    -- 6. CREATE SOME RESPONSES FOR INSPECTION 2 (60% complete)
    -- =====================================================
    INSERT INTO public.inspection_item_responses (
        inspection_item_id, inspection_id, user_id, state, comment
    ) VALUES
    (item1_id, insp2_id, operario_user_id, 'OK', 'Área en buen estado de limpieza'),
    (item2_id, insp2_id, operario_user_id, 'OK', 'Señalización adecuada'),
    (item3_id, insp2_id, operario_user_id, 'NOK', 'Falta guarda de seguridad en sierra eléctrica');

    -- =====================================================
    -- 7. CREATE A CORRECTIVE ACTION FOR THE NOK ITEM
    -- =====================================================
    INSERT INTO public.corrective_actions (
        inspection_id,
        item_response_id,
        assigned_to,
        status,
        due_date,
        notes
    ) VALUES (
        insp2_id,
        (SELECT id FROM public.inspection_item_responses WHERE inspection_item_id = item3_id),
        supervisor_user_id,
        'pending',
        NOW() + INTERVAL '7 days',
        'Instalar guarda de seguridad en sierra eléctrica de la estación 3'
    );

    -- =====================================================
    -- 8. CREATE NOTIFICATIONS
    -- =====================================================
    INSERT INTO public.notifications (user_id, type, title, body, link, priority, read_at)
    VALUES
    -- Unread notifications
    (operario_user_id, 'inspection_assigned', 'Nueva inspección asignada', 'Se te ha asignado la inspección del área de Producción', '/inspections/' || insp1_id, 'high', NULL),
    (operario_user_id, 'inventory_low', 'Stock bajo de EPP', 'Guantes de seguridad por debajo del stock mínimo (8/15)', '/equipment', 'normal', NULL),
    (supervisor_user_id, 'corrective_action', 'Acción correctiva pendiente', 'Revisar e implementar guarda de seguridad en sierra', '/inspections/' || insp2_id, 'high', NULL),
    
    -- Read notifications
    (operario_user_id, 'inspection_assigned', 'Inspección de Almacén', 'Se te ha asignado la inspección del área de Almacén', '/inspections/' || insp2_id, 'normal', NOW() - INTERVAL '2 hours'),
    (supervisor_user_id, 'delivery_alert', 'Entrega de equipos', 'Cascos de seguridad entregados al área de Producción', '/equipment', 'normal', NOW() - INTERVAL '1 day');

    -- =====================================================
    -- 9. CREATE AUDIT LOGS
    -- =====================================================
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES
    (supervisor_user_id, 'CREATE', 'inspection', insp1_id, jsonb_build_object('area', 'Producción', 'status', 'pending')),
    (supervisor_user_id, 'CREATE', 'inspection', insp2_id, jsonb_build_object('area', 'Almacén', 'status', 'pending')),
    (operario_user_id, 'UPDATE', 'inspection', insp2_id, jsonb_build_object('action', 'started', 'status', 'in_progress')),
    (operario_user_id, 'CREATE', 'inspection_response', item1_id, jsonb_build_object('state', 'OK')),
    (operario_user_id, 'CREATE', 'inspection_response', item2_id, jsonb_build_object('state', 'OK')),
    (operario_user_id, 'CREATE', 'inspection_response', item3_id, jsonb_build_object('state', 'NOK'));

END $$;

-- =====================================================
-- VERIFY DATA INSERTION
-- =====================================================
SELECT 'Areas created:' as info, COUNT(*) as count FROM public.areas;
SELECT 'Inspections created:' as info, COUNT(*) as count FROM public.inspections;
SELECT 'Inspection items created:' as info, COUNT(*) as count FROM public.inspection_items;
SELECT 'Responses created:' as info, COUNT(*) as count FROM public.inspection_item_responses;
SELECT 'Corrective actions created:' as info, COUNT(*) as count FROM public.corrective_actions;
SELECT 'Notifications created:' as info, COUNT(*) as count FROM public.notifications;
SELECT 'Audit logs created:' as info, COUNT(*) as count FROM public.audit_logs;
