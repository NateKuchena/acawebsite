-- =============================================
-- SCHOOL CALENDAR AND TEACHER DUTY ROSTER
-- Migration 019
-- =============================================

-- =============================================
-- EVENT TYPES TABLE (for custom event types)
-- =============================================
CREATE TABLE IF NOT EXISTS event_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    is_system BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default event types
INSERT INTO event_types (name, color, icon, is_system, is_public) VALUES
    ('Holiday', '#EF4444', 'calendar-off', true, true),
    ('Exam', '#8B5CF6', 'file-text', true, true),
    ('Parent Day', '#10B981', 'users', true, true),
    ('Sports Day', '#F59E0B', 'trophy', true, true),
    ('School Event', '#3B82F6', 'calendar', true, true),
    ('Staff Meeting', '#6366F1', 'briefcase', true, false),
    ('Assembly', '#EC4899', 'megaphone', true, true),
    ('Club Activity', '#14B8A6', 'heart', true, true),
    ('External Visit', '#84CC16', 'map-pin', true, true)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- SCHOOL EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS school_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type_id UUID REFERENCES event_types(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    all_day BOOLEAN DEFAULT true,
    location VARCHAR(200),
    academic_year VARCHAR(10),
    term INTEGER CHECK (term BETWEEN 1 AND 3),
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DUTY ROSTER TABLE (Weekly duty periods)
-- =============================================
CREATE TABLE IF NOT EXISTS duty_roster (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_start_date DATE NOT NULL UNIQUE,
    week_end_date DATE NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    term INTEGER NOT NULL CHECK (term BETWEEN 1 AND 3),
    notes TEXT,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DUTY ASSIGNMENTS TABLE (Multiple teachers per week)
-- =============================================
CREATE TABLE IF NOT EXISTS duty_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    duty_roster_id UUID NOT NULL REFERENCES duty_roster(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    duty_area VARCHAR(100),
    notes TEXT,
    notified_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(duty_roster_id, staff_id)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_school_events_dates ON school_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_school_events_type ON school_events(event_type_id);
CREATE INDEX IF NOT EXISTS idx_school_events_public ON school_events(is_public);
CREATE INDEX IF NOT EXISTS idx_school_events_year_term ON school_events(academic_year, term);

CREATE INDEX IF NOT EXISTS idx_duty_roster_week ON duty_roster(week_start_date);
CREATE INDEX IF NOT EXISTS idx_duty_roster_year_term ON duty_roster(academic_year, term);

CREATE INDEX IF NOT EXISTS idx_duty_assignments_roster ON duty_assignments(duty_roster_id);
CREATE INDEX IF NOT EXISTS idx_duty_assignments_staff ON duty_assignments(staff_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_assignments ENABLE ROW LEVEL SECURITY;

-- Event types: Everyone can view, admins can manage
CREATE POLICY "Event types viewable by authenticated" ON event_types
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Event types insertable by admins" ON event_types
    FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Event types updatable by admins" ON event_types
    FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Event types deletable by admins" ON event_types
    FOR DELETE TO authenticated USING (is_admin(auth.uid()) AND is_system = false);

-- School events: Staff can view all, parents can view public only, admins can manage
CREATE POLICY "Events viewable by staff and parents" ON school_events
    FOR SELECT TO authenticated USING (
        is_admin(auth.uid()) OR
        EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('teacher', 'staff')) OR
        (is_public = true AND EXISTS(SELECT 1 FROM parent_student_links WHERE user_id = auth.uid()))
    );

CREATE POLICY "Events insertable by admins" ON school_events
    FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Events updatable by admins" ON school_events
    FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Events deletable by admins" ON school_events
    FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Duty roster: Staff can view, admins can manage
CREATE POLICY "Duty roster viewable by staff" ON duty_roster
    FOR SELECT TO authenticated USING (
        is_admin(auth.uid()) OR
        EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('teacher', 'staff'))
    );

CREATE POLICY "Duty roster insertable by admins" ON duty_roster
    FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Duty roster updatable by admins" ON duty_roster
    FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Duty roster deletable by admins" ON duty_roster
    FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Duty assignments: Teachers can view own, admins can manage all
CREATE POLICY "Duty assignments viewable by assigned staff and admins" ON duty_assignments
    FOR SELECT TO authenticated USING (
        is_admin(auth.uid()) OR
        staff_id IN (SELECT staff_id FROM user_roles WHERE user_id = auth.uid())
    );

CREATE POLICY "Duty assignments insertable by admins" ON duty_assignments
    FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Duty assignments updatable by admins" ON duty_assignments
    FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Duty assignments deletable by admins" ON duty_assignments
    FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_event_types_updated_at ON event_types;
CREATE TRIGGER update_event_types_updated_at
    BEFORE UPDATE ON event_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_school_events_updated_at ON school_events;
CREATE TRIGGER update_school_events_updated_at
    BEFORE UPDATE ON school_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_duty_roster_updated_at ON duty_roster;
CREATE TRIGGER update_duty_roster_updated_at
    BEFORE UPDATE ON duty_roster
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
