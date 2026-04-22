-- =============================================
-- SAMPLE DATA FOR SCHOOL MANAGEMENT SYSTEM
-- Run this in Supabase SQL Editor to populate test data
-- =============================================

-- =============================================
-- 1. FEE CATEGORIES
-- =============================================
INSERT INTO fee_categories (id, name, description, amount, term, academic_year, is_recurring) VALUES
  (gen_random_uuid(), 'Tuition Fee', 'Termly tuition fees', 500.00, 1, '2024', true),
  (gen_random_uuid(), 'Tuition Fee', 'Termly tuition fees', 500.00, 2, '2024', true),
  (gen_random_uuid(), 'Tuition Fee', 'Termly tuition fees', 500.00, 3, '2024', true),
  (gen_random_uuid(), 'Development Levy', 'Annual development levy', 150.00, 1, '2024', false),
  (gen_random_uuid(), 'Sports Fee', 'Sports and athletics', 50.00, 1, '2024', true),
  (gen_random_uuid(), 'Computer Lab Fee', 'Computer lab access', 75.00, 1, '2024', true),
  (gen_random_uuid(), 'Exam Fee', 'Examination fees', 100.00, 3, '2024', false),
  (gen_random_uuid(), 'Library Fee', 'Library access and books', 30.00, 1, '2024', true);

-- =============================================
-- 2. EXPENSE CATEGORIES
-- =============================================
INSERT INTO expense_categories (id, name, description) VALUES
  (gen_random_uuid(), 'Salaries', 'Staff salaries and wages'),
  (gen_random_uuid(), 'Utilities', 'Electricity, water, internet'),
  (gen_random_uuid(), 'Maintenance', 'Building and equipment maintenance'),
  (gen_random_uuid(), 'Supplies', 'Office and teaching supplies'),
  (gen_random_uuid(), 'Transport', 'Vehicle fuel and maintenance'),
  (gen_random_uuid(), 'Events', 'School events and functions'),
  (gen_random_uuid(), 'Equipment', 'Equipment purchases'),
  (gen_random_uuid(), 'Security', 'Security services');

-- =============================================
-- 3. UNIFORM ITEMS
-- =============================================
INSERT INTO uniform_items (id, name, description, size, price, stock_quantity) VALUES
  (gen_random_uuid(), 'School Shirt', 'White cotton school shirt', 'S', 15.00, 50),
  (gen_random_uuid(), 'School Shirt', 'White cotton school shirt', 'M', 15.00, 75),
  (gen_random_uuid(), 'School Shirt', 'White cotton school shirt', 'L', 18.00, 60),
  (gen_random_uuid(), 'School Shirt', 'White cotton school shirt', 'XL', 18.00, 40),
  (gen_random_uuid(), 'School Trousers', 'Grey school trousers', 'S', 25.00, 45),
  (gen_random_uuid(), 'School Trousers', 'Grey school trousers', 'M', 25.00, 60),
  (gen_random_uuid(), 'School Trousers', 'Grey school trousers', 'L', 28.00, 50),
  (gen_random_uuid(), 'School Skirt', 'Grey pleated skirt', 'S', 22.00, 40),
  (gen_random_uuid(), 'School Skirt', 'Grey pleated skirt', 'M', 22.00, 55),
  (gen_random_uuid(), 'School Skirt', 'Grey pleated skirt', 'L', 25.00, 45),
  (gen_random_uuid(), 'School Tie', 'Striped school tie', 'One Size', 8.00, 100),
  (gen_random_uuid(), 'School Jersey', 'Maroon school jersey', 'S', 35.00, 30),
  (gen_random_uuid(), 'School Jersey', 'Maroon school jersey', 'M', 35.00, 45),
  (gen_random_uuid(), 'School Jersey', 'Maroon school jersey', 'L', 38.00, 35),
  (gen_random_uuid(), 'Sports Kit', 'PE uniform set', 'S', 30.00, 25),
  (gen_random_uuid(), 'Sports Kit', 'PE uniform set', 'M', 30.00, 40),
  (gen_random_uuid(), 'Sports Kit', 'PE uniform set', 'L', 32.00, 30),
  (gen_random_uuid(), 'School Shoes', 'Black leather shoes', '38', 45.00, 20),
  (gen_random_uuid(), 'School Shoes', 'Black leather shoes', '40', 45.00, 25),
  (gen_random_uuid(), 'School Shoes', 'Black leather shoes', '42', 48.00, 20),
  (gen_random_uuid(), 'School Bag', 'Backpack with logo', 'Standard', 40.00, 50);

-- =============================================
-- 4. STUDENTS
-- =============================================
INSERT INTO students (id, student_number, name, surname, date_of_birth, gender, form, stream, status, admission_date, address, guardian_name, guardian_contact, guardian_email, medical_info, previous_school) VALUES
  (gen_random_uuid(), 'STU2024001', 'Tendai', 'Moyo', '2010-03-15', 'Male', 'Form 1A', 'A', 'enrolled', '2024-01-10', '123 Main Street, Harare', 'James Moyo', '+263771234567', 'james.moyo@email.com', 'No known allergies', 'Harare Primary School'),
  (gen_random_uuid(), 'STU2024002', 'Rumbidzai', 'Ncube', '2010-07-22', 'Female', 'Form 1A', 'A', 'enrolled', '2024-01-10', '45 Second Ave, Harare', 'Mary Ncube', '+263772345678', 'mary.ncube@email.com', 'Asthmatic - carries inhaler', 'St Johns Primary'),
  (gen_random_uuid(), 'STU2024003', 'Takudzwa', 'Dube', '2009-11-08', 'Male', 'Form 2A', 'A', 'enrolled', '2023-01-12', '78 Park Lane, Bulawayo', 'Peter Dube', '+263773456789', 'peter.dube@email.com', NULL, 'Milton Primary School'),
  (gen_random_uuid(), 'STU2024004', 'Nyasha', 'Chikwanda', '2009-05-30', 'Female', 'Form 2B', 'B', 'enrolled', '2023-01-12', '12 River Road, Harare', 'Grace Chikwanda', '+263774567890', 'grace.chikwanda@email.com', 'Peanut allergy', 'Avondale Primary'),
  (gen_random_uuid(), 'STU2024005', 'Farai', 'Mutasa', '2008-09-14', 'Male', 'Form 3A', 'A', 'enrolled', '2022-01-15', '56 Hill Street, Mutare', 'Thomas Mutasa', '+263775678901', 'thomas.mutasa@email.com', NULL, 'Mutare Junior School'),
  (gen_random_uuid(), 'STU2024006', 'Chiedza', 'Sibanda', '2008-02-20', 'Female', 'Form 3A', 'A', 'enrolled', '2022-01-15', '89 Lake View, Harare', 'Sarah Sibanda', '+263776789012', 'sarah.sibanda@email.com', 'Diabetic - Type 1', 'Girls High Primary'),
  (gen_random_uuid(), 'STU2024007', 'Tatenda', 'Zimuto', '2007-12-05', 'Male', 'Form 4A', 'A', 'enrolled', '2021-01-11', '34 Mountain Road, Gweru', 'John Zimuto', '+263777890123', 'john.zimuto@email.com', NULL, 'Gweru Primary'),
  (gen_random_uuid(), 'STU2024008', 'Ruvimbo', 'Katsande', '2007-06-18', 'Female', 'Form 4B', 'B', 'enrolled', '2021-01-11', '67 Valley Drive, Harare', 'Ruth Katsande', '+263778901234', 'ruth.katsande@email.com', 'Wears glasses', 'Eastlea Primary'),
  (gen_random_uuid(), 'STU2024009', 'Tawanda', 'Mashingaidze', '2010-01-25', 'Male', 'Form 1B', 'B', 'enrolled', '2024-01-10', '23 Church Road, Masvingo', 'David Mashingaidze', '+263779012345', 'david.mash@email.com', NULL, 'Masvingo Primary'),
  (gen_random_uuid(), 'STU2024010', 'Shamiso', 'Chirwa', '2010-08-12', 'Female', 'Form 1B', 'B', 'enrolled', '2024-01-10', '90 Green Lane, Harare', 'Elizabeth Chirwa', '+263770123456', 'liz.chirwa@email.com', 'Lactose intolerant', 'Warren Park Primary'),
  (gen_random_uuid(), 'STU2024011', 'Blessing', 'Madziva', '2009-04-03', 'Male', 'Form 2A', 'A', 'enrolled', '2023-01-12', '15 Oak Avenue, Harare', 'Michael Madziva', '+263771122334', 'mike.madziva@email.com', NULL, 'Mabelreign Primary'),
  (gen_random_uuid(), 'STU2024012', 'Tariro', 'Gumbo', '2009-10-28', 'Female', 'Form 2B', 'B', 'enrolled', '2023-01-12', '48 Rose Street, Chitungwiza', 'Agnes Gumbo', '+263772233445', 'agnes.gumbo@email.com', NULL, 'Zengeza Primary'),
  (gen_random_uuid(), 'STU2024013', 'Simbarashe', 'Murefu', '2008-07-07', 'Male', 'Form 3B', 'B', 'enrolled', '2022-01-15', '72 Palm Drive, Harare', 'Charles Murefu', '+263773344556', 'charles.murefu@email.com', 'ADHD - on medication', 'Hatfield Primary'),
  (gen_random_uuid(), 'STU2024014', 'Vimbai', 'Choto', '2008-03-16', 'Female', 'Form 3B', 'B', 'enrolled', '2022-01-15', '31 Sunset Blvd, Harare', 'Patricia Choto', '+263774455667', 'pat.choto@email.com', NULL, 'Borrowdale Primary'),
  (gen_random_uuid(), 'STU2024015', 'Kudakwashe', 'Nyoni', '2007-11-22', 'Male', 'Form 4A', 'A', 'enrolled', '2021-01-11', '55 Industrial Road, Harare', 'Joseph Nyoni', '+263775566778', 'joseph.nyoni@email.com', NULL, 'Highfield Primary');

-- =============================================
-- 5. STAFF / EMPLOYEES
-- =============================================
INSERT INTO employees (id, employee_number, first_name, last_name, email, phone, date_of_birth, gender, national_id, address, department, position, employment_type, hire_date, basic_salary, status, bank_name, bank_account, emergency_contact_name, emergency_contact_phone, qualifications) VALUES
  (gen_random_uuid(), 'EMP001', 'Robert', 'Makahamadze', 'robert.maka@school.com', '+263771111111', '1980-05-15', 'Male', '63-123456-A-42', '10 Teacher Lane, Harare', 'Administration', 'Principal', 'permanent', '2015-01-05', 2500.00, 'active', 'CBZ Bank', '1234567890', 'Anna Makahamadze', '+263772222222', 'MEd Educational Leadership, BEd'),
  (gen_random_uuid(), 'EMP002', 'Susan', 'Chiromo', 'susan.chiromo@school.com', '+263773333333', '1985-08-20', 'Female', '63-234567-B-42', '25 Staff Road, Harare', 'Administration', 'Deputy Principal', 'permanent', '2016-03-10', 2000.00, 'active', 'Stanbic Bank', '2345678901', 'Tom Chiromo', '+263774444444', 'MEd, BEd Science'),
  (gen_random_uuid(), 'EMP003', 'Timothy', 'Banda', 'timothy.banda@school.com', '+263775555555', '1982-12-03', 'Male', '63-345678-C-42', '38 Maple Street, Harare', 'Mathematics', 'Head of Department', 'permanent', '2017-01-15', 1800.00, 'active', 'FBC Bank', '3456789012', 'Mary Banda', '+263776666666', 'BSc Mathematics, PGDE'),
  (gen_random_uuid(), 'EMP004', 'Florence', 'Mukwende', 'florence.mukwende@school.com', '+263777777777', '1988-04-18', 'Female', '63-456789-D-42', '42 Elm Avenue, Harare', 'English', 'Senior Teacher', 'permanent', '2018-06-01', 1500.00, 'active', 'ZB Bank', '4567890123', 'George Mukwende', '+263778888888', 'BA English, PGDE'),
  (gen_random_uuid(), 'EMP005', 'Martin', 'Chigwada', 'martin.chigwada@school.com', '+263779999999', '1990-09-25', 'Male', '63-567890-E-42', '18 Pine Road, Harare', 'Science', 'Teacher', 'permanent', '2019-01-10', 1200.00, 'active', 'Ecobank', '5678901234', 'Linda Chigwada', '+263770000000', 'BSc Chemistry, PGDE'),
  (gen_random_uuid(), 'EMP006', 'Priscilla', 'Hwata', 'priscilla.hwata@school.com', '+263771010101', '1992-02-14', 'Female', '63-678901-F-42', '63 Cedar Lane, Harare', 'History', 'Teacher', 'permanent', '2020-03-15', 1100.00, 'active', 'CBZ Bank', '6789012345', 'Simon Hwata', '+263772020202', 'BA History, PGDE'),
  (gen_random_uuid(), 'EMP007', 'Patrick', 'Mawere', 'patrick.mawere@school.com', '+263773030303', '1987-07-08', 'Male', '63-789012-G-42', '77 Birch Street, Harare', 'Science', 'Head of Department', 'permanent', '2017-08-20', 1700.00, 'active', 'Stanbic Bank', '7890123456', 'Jane Mawere', '+263774040404', 'MSc Physics, BEd'),
  (gen_random_uuid(), 'EMP008', 'Gloria', 'Rusike', 'gloria.rusike@school.com', '+263775050505', '1995-11-30', 'Female', '63-890123-H-42', '29 Acacia Drive, Harare', 'Geography', 'Teacher', 'contract', '2022-01-10', 900.00, 'active', 'FBC Bank', '8901234567', 'Brian Rusike', '+263776060606', 'BSc Geography, PGDE'),
  (gen_random_uuid(), 'EMP009', 'William', 'Shumba', 'william.shumba@school.com', '+263777070707', '1978-03-22', 'Male', '63-901234-I-42', '51 Willow Way, Harare', 'Accounts', 'Bursar', 'permanent', '2014-05-01', 1600.00, 'active', 'ZB Bank', '9012345678', 'Catherine Shumba', '+263778080808', 'BCom Accounting, CPA'),
  (gen_random_uuid(), 'EMP010', 'Nancy', 'Dongo', 'nancy.dongo@school.com', '+263779090909', '1993-06-11', 'Female', '63-012345-J-42', '84 Cypress Court, Harare', 'Administration', 'Secretary', 'permanent', '2019-09-01', 800.00, 'active', 'Ecobank', '0123456789', 'Edward Dongo', '+263770101010', 'Diploma in Secretarial Studies'),
  (gen_random_uuid(), 'EMP011', 'George', 'Makoni', 'george.makoni@school.com', '+263771212121', '1975-01-05', 'Male', '63-112233-K-42', '16 Baobab Road, Harare', 'Maintenance', 'Groundskeeper', 'permanent', '2010-02-15', 400.00, 'active', 'CBZ Bank', '1122334455', 'Rose Makoni', '+263772323232', 'O Level Certificate'),
  (gen_random_uuid(), 'EMP012', 'Tendai', 'Mushore', 'tendai.mushore@school.com', '+263773434343', '1998-10-19', 'Female', '63-223344-L-42', '39 Jacaranda Ave, Harare', 'IT', 'Lab Technician', 'contract', '2023-02-01', 700.00, 'active', 'Stanbic Bank', '2233445566', 'Paul Mushore', '+263774545454', 'Diploma in IT');

-- =============================================
-- 6. STAFF BENEFITS
-- =============================================
INSERT INTO staff_benefits (id, name, description, type, amount, is_percentage, is_taxable) VALUES
  (gen_random_uuid(), 'Housing Allowance', 'Monthly housing allowance', 'allowance', 200.00, false, true),
  (gen_random_uuid(), 'Transport Allowance', 'Monthly transport allowance', 'allowance', 100.00, false, true),
  (gen_random_uuid(), 'Medical Aid', 'Company medical aid contribution', 'allowance', 150.00, false, false),
  (gen_random_uuid(), 'Education Allowance', 'Children education support', 'allowance', 100.00, false, false),
  (gen_random_uuid(), 'NSSA', 'National Social Security Authority', 'deduction', 4.50, true, false),
  (gen_random_uuid(), 'PAYE', 'Pay As You Earn tax', 'deduction', 25.00, true, false),
  (gen_random_uuid(), 'Pension Fund', 'Staff pension contribution', 'deduction', 5.00, true, false),
  (gen_random_uuid(), 'Union Dues', 'Teachers union membership', 'deduction', 20.00, false, false);

-- =============================================
-- 7. ASSETS
-- =============================================
INSERT INTO assets (id, asset_number, name, description, category, location, purchase_date, purchase_price, current_value, condition, status, supplier, warranty_expiry, notes) VALUES
  (gen_random_uuid(), 'AST-2024-001', 'Dell Desktop Computer', 'Dell OptiPlex 7090', 'ICT Equipment', 'Computer Lab 1', '2024-01-15', 800.00, 750.00, 'excellent', 'functional', 'CompuTech Zimbabwe', '2027-01-15', 'Core i7, 16GB RAM, 512GB SSD'),
  (gen_random_uuid(), 'AST-2024-002', 'Dell Desktop Computer', 'Dell OptiPlex 7090', 'ICT Equipment', 'Computer Lab 1', '2024-01-15', 800.00, 750.00, 'excellent', 'functional', 'CompuTech Zimbabwe', '2027-01-15', 'Core i7, 16GB RAM, 512GB SSD'),
  (gen_random_uuid(), 'AST-2024-003', 'Dell Desktop Computer', 'Dell OptiPlex 7090', 'ICT Equipment', 'Computer Lab 1', '2024-01-15', 800.00, 750.00, 'excellent', 'functional', 'CompuTech Zimbabwe', '2027-01-15', 'Core i7, 16GB RAM, 512GB SSD'),
  (gen_random_uuid(), 'AST-2024-004', 'HP LaserJet Printer', 'HP LaserJet Pro M404dn', 'ICT Equipment', 'Admin Office', '2023-06-20', 450.00, 380.00, 'good', 'functional', 'Office Supplies Ltd', '2025-06-20', 'Duplex printing, Network enabled'),
  (gen_random_uuid(), 'AST-2024-005', 'Projector', 'Epson EB-X51', 'ICT Equipment', 'Conference Room', '2023-03-10', 600.00, 520.00, 'good', 'functional', 'Tech Solutions', '2026-03-10', '3800 lumens, XGA resolution'),
  (gen_random_uuid(), 'AST-2024-006', 'Whiteboard', 'Magnetic Whiteboard 2.4m x 1.2m', 'Furniture', 'Form 1A Classroom', '2022-01-05', 120.00, 90.00, 'good', 'functional', 'School Supplies Co', NULL, NULL),
  (gen_random_uuid(), 'AST-2024-007', 'Whiteboard', 'Magnetic Whiteboard 2.4m x 1.2m', 'Furniture', 'Form 2A Classroom', '2022-01-05', 120.00, 90.00, 'good', 'functional', 'School Supplies Co', NULL, NULL),
  (gen_random_uuid(), 'AST-2024-008', 'Student Desk Set', 'Double seater desk with chairs', 'Furniture', 'Form 1A Classroom', '2021-08-15', 85.00, 60.00, 'fair', 'functional', 'Furniture World', NULL, 'Set of 25'),
  (gen_random_uuid(), 'AST-2024-009', 'Laboratory Microscope', 'Olympus CX23', 'Laboratory Equipment', 'Science Lab', '2023-09-01', 950.00, 900.00, 'excellent', 'functional', 'Lab Equipment Zim', '2026-09-01', 'Binocular, LED illumination'),
  (gen_random_uuid(), 'AST-2024-010', 'Laboratory Microscope', 'Olympus CX23', 'Laboratory Equipment', 'Science Lab', '2023-09-01', 950.00, 900.00, 'excellent', 'functional', 'Lab Equipment Zim', '2026-09-01', 'Binocular, LED illumination'),
  (gen_random_uuid(), 'AST-2024-011', 'Bunsen Burner Set', 'Complete bunsen burner kit', 'Laboratory Equipment', 'Science Lab', '2022-05-20', 45.00, 35.00, 'good', 'functional', 'Lab Equipment Zim', NULL, 'Set of 20'),
  (gen_random_uuid(), 'AST-2024-012', 'Sports Equipment Set', 'Football, netball, volleyball set', 'Sports Equipment', 'Sports Storeroom', '2024-02-01', 350.00, 340.00, 'excellent', 'functional', 'Sports World', NULL, 'Various balls and nets'),
  (gen_random_uuid(), 'AST-2024-013', 'School Bus', 'Toyota Coaster 30-seater', 'Vehicles', 'Parking Lot', '2020-06-15', 45000.00, 35000.00, 'good', 'functional', 'Toyota Zimbabwe', NULL, 'Registration: ABC 1234'),
  (gen_random_uuid(), 'AST-2024-014', 'Photocopier', 'Ricoh MP C3004', 'Office Equipment', 'Admin Office', '2022-11-10', 3500.00, 2800.00, 'good', 'functional', 'Ricoh Zimbabwe', '2025-11-10', 'Color, A3 capable'),
  (gen_random_uuid(), 'AST-2024-015', 'Generator', 'Perkins 30kVA', 'Electrical Equipment', 'Generator Room', '2021-03-25', 8000.00, 6500.00, 'good', 'functional', 'Power Systems Ltd', NULL, 'Backup power supply'),
  (gen_random_uuid(), 'AST-2024-016', 'Water Tank', 'JoJo 10000L Tank', 'Infrastructure', 'Tank Stand', '2020-09-12', 1200.00, 900.00, 'good', 'functional', 'JoJo Tanks', NULL, 'Water storage'),
  (gen_random_uuid(), 'AST-2024-017', 'Library Bookshelf', 'Wooden bookshelf 6-tier', 'Furniture', 'Library', '2019-04-08', 250.00, 150.00, 'fair', 'functional', 'Furniture World', NULL, 'Set of 10'),
  (gen_random_uuid(), 'AST-2024-018', 'Air Conditioner', 'Samsung 24000BTU Split', 'Electrical Equipment', 'Principal Office', '2023-12-01', 1200.00, 1150.00, 'excellent', 'functional', 'Cooltech', '2028-12-01', 'Inverter type'),
  (gen_random_uuid(), 'AST-2024-019', 'CCTV System', '16-channel DVR with cameras', 'Security Equipment', 'Security Office', '2023-08-15', 2500.00, 2300.00, 'excellent', 'functional', 'SecureTech', '2025-08-15', '16 cameras installed'),
  (gen_random_uuid(), 'AST-2024-020', 'PA System', 'Complete public address system', 'Audio Equipment', 'Assembly Hall', '2022-07-20', 1800.00, 1400.00, 'good', 'functional', 'Audio Solutions', NULL, 'Amplifier, speakers, microphones');

-- =============================================
-- 8. SUBJECTS
-- =============================================
INSERT INTO subjects (id, name, code, department) VALUES
  (gen_random_uuid(), 'Mathematics', 'MATH', 'Mathematics'),
  (gen_random_uuid(), 'English Language', 'ENG', 'Languages'),
  (gen_random_uuid(), 'Shona', 'SHO', 'Languages'),
  (gen_random_uuid(), 'Physics', 'PHY', 'Sciences'),
  (gen_random_uuid(), 'Chemistry', 'CHEM', 'Sciences'),
  (gen_random_uuid(), 'Biology', 'BIO', 'Sciences'),
  (gen_random_uuid(), 'Geography', 'GEO', 'Humanities'),
  (gen_random_uuid(), 'History', 'HIST', 'Humanities'),
  (gen_random_uuid(), 'Computer Science', 'CS', 'Technical'),
  (gen_random_uuid(), 'Accounting', 'ACC', 'Commerce'),
  (gen_random_uuid(), 'Business Studies', 'BUS', 'Commerce'),
  (gen_random_uuid(), 'Agriculture', 'AGR', 'Technical'),
  (gen_random_uuid(), 'Physical Education', 'PE', 'Sports'),
  (gen_random_uuid(), 'Art', 'ART', 'Arts'),
  (gen_random_uuid(), 'Music', 'MUS', 'Arts');

-- =============================================
-- 9. REQUISITIONS (Sample)
-- =============================================
INSERT INTO requisitions (id, requisition_number, requested_by, department, description, items, total_amount, status, approved_by, approved_at, notes, created_at) VALUES
  (gen_random_uuid(), 'REQ-2024-001', 'Timothy Banda', 'Mathematics', 'Mathematical instruments for Form 3', '[{"name": "Geometry Sets", "quantity": 30, "unit_price": 5.00}, {"name": "Scientific Calculators", "quantity": 20, "unit_price": 15.00}]', 450.00, 'approved', 'Robert Makahamadze', NOW() - INTERVAL '5 days', 'Urgent for upcoming exams', NOW() - INTERVAL '7 days'),
  (gen_random_uuid(), 'REQ-2024-002', 'Patrick Mawere', 'Science', 'Laboratory chemicals refill', '[{"name": "Hydrochloric Acid 2.5L", "quantity": 5, "unit_price": 25.00}, {"name": "Sodium Hydroxide 1kg", "quantity": 3, "unit_price": 18.00}]', 179.00, 'approved', 'Susan Chiromo', NOW() - INTERVAL '3 days', NULL, NOW() - INTERVAL '6 days'),
  (gen_random_uuid(), 'REQ-2024-003', 'Nancy Dongo', 'Administration', 'Office stationery', '[{"name": "A4 Paper Ream", "quantity": 20, "unit_price": 8.00}, {"name": "Pens Box", "quantity": 10, "unit_price": 12.00}]', 280.00, 'pending', NULL, NULL, 'Monthly supplies', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), 'REQ-2024-004', 'Gloria Rusike', 'Geography', 'Maps and atlases', '[{"name": "World Atlas", "quantity": 15, "unit_price": 20.00}, {"name": "Wall Map Zimbabwe", "quantity": 2, "unit_price": 45.00}]', 390.00, 'rejected', 'Robert Makahamadze', NOW() - INTERVAL '2 days', 'Budget constraints - resubmit next term', NOW() - INTERVAL '4 days');

-- =============================================
-- 10. PAYMENT VOUCHERS (Sample)
-- =============================================
INSERT INTO payment_vouchers (id, voucher_number, payee, description, amount, payment_method, status, prepared_by, approved_by, approved_at, paid_at, reference_number, created_at) VALUES
  (gen_random_uuid(), 'PV-2024-001', 'CompuTech Zimbabwe', 'Computer equipment maintenance', 350.00, 'bank_transfer', 'paid', 'William Shumba', 'Robert Makahamadze', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days', 'TRF-20240115', NOW() - INTERVAL '12 days'),
  (gen_random_uuid(), 'PV-2024-002', 'ZESA Holdings', 'Electricity bill - January 2024', 1250.00, 'bank_transfer', 'paid', 'William Shumba', 'Susan Chiromo', NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days', 'TRF-20240118', NOW() - INTERVAL '9 days'),
  (gen_random_uuid(), 'PV-2024-003', 'City of Harare', 'Water and rates - Q1 2024', 480.00, 'cheque', 'approved', 'William Shumba', 'Robert Makahamadze', NOW() - INTERVAL '2 days', NULL, NULL, NOW() - INTERVAL '4 days'),
  (gen_random_uuid(), 'PV-2024-004', 'Office Supplies Ltd', 'Stationery supplies', 280.00, 'cash', 'pending', 'William Shumba', NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 day');

-- =============================================
-- 11. OTHER INCOME (Sample)
-- =============================================
INSERT INTO other_income (id, receipt_number, source, description, amount, payment_method, received_by, category, created_at) VALUES
  (gen_random_uuid(), 'INC-2024-001', 'Hall Rental', 'Wedding reception - Moyo family', 500.00, 'cash', 'William Shumba', 'Facility Rental', NOW() - INTERVAL '14 days'),
  (gen_random_uuid(), 'INC-2024-002', 'Photocopying Services', 'Public photocopying - January', 125.00, 'cash', 'Nancy Dongo', 'Services', NOW() - INTERVAL '7 days'),
  (gen_random_uuid(), 'INC-2024-003', 'Tuckshop Sales', 'Weekly tuckshop revenue', 850.00, 'cash', 'William Shumba', 'Sales', NOW() - INTERVAL '3 days'),
  (gen_random_uuid(), 'INC-2024-004', 'Donation', 'Alumni association donation', 2000.00, 'bank_transfer', 'Robert Makahamadze', 'Donations', NOW() - INTERVAL '1 day');

-- =============================================
-- NOTES:
-- 1. Run this after running all migrations
-- 2. Student marks need to be added via the UI (marks entry page)
-- 3. Fee payments need to be made via the UI (payments page)
-- 4. Parent-student links need to be created via admin page
-- 5. Adjust dates as needed for your testing
-- =============================================

SELECT 'Sample data inserted successfully!' as message;
