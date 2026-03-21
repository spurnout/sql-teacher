-- Seed data for Professional theme (TechCorp HR & Operations)
-- All numeric values, FK patterns, timestamps, and NULL distributions
-- are identical to the serious (SaaS) theme — only names and labels change.

-- ============================================================
-- PROJECTS (8 rows) — maps to products
-- ============================================================
INSERT INTO theme_professional.projects (id, name, category, budget_cents, created_at) VALUES
(1, 'API Redesign',           'engineering',  2900, '2023-01-01'),
(2, 'Cloud Migration',        'engineering',  9900, '2023-01-01'),
(3, 'Brand Refresh',          'marketing',    4900, '2023-01-01'),
(4, 'Annual Campaign',        'marketing',   19900, '2023-01-01'),
(5, 'CRM Integration',        'sales',        1900, '2023-03-15'),
(6, 'Pipeline Automation',    'sales',         4900, '2023-03-15'),
(7, 'Process Optimization',   'operations',   9900, '2023-06-01'),
(8, 'ERP Implementation',     'operations',  29900, '2023-06-01');

SELECT setval('theme_professional.projects_id_seq', 8);

-- ============================================================
-- EMPLOYEES (50 rows) — maps to users
-- role: junior|senior|lead|executive maps to free|starter|pro|enterprise
-- department maps to country
-- created_at maps to created_at, terminated_at maps to churned_at
-- SAME timestamp and NULL distribution patterns
-- ============================================================
INSERT INTO theme_professional.employees (id, name, email, role, department, created_at, terminated_at) VALUES
-- Active employees, various roles
( 1, 'Alice Martin',       'alice.martin@techcorp.com',       'lead',       'Engineering',  '2023-01-15 10:00:00+00', NULL),
( 2, 'Bob Chen',           'bob.chen@techcorp.com',           'senior',     'Marketing',    '2023-01-15 14:30:00+00', NULL),
( 3, 'Carol Davis',        'carol.davis@techcorp.com',        'executive',  'Engineering',  '2023-02-01 09:00:00+00', NULL),
( 4, 'David Kim',          'david.kim@techcorp.com',          'lead',       'Product',      '2023-02-14 11:00:00+00', NULL),
( 5, 'Emma Wilson',        'emma.wilson@techcorp.com',        'junior',     'Sales',        '2023-03-01 08:00:00+00', NULL),
( 6, 'Frank Lopez',        'frank.lopez@techcorp.com',        'senior',     'Engineering',  '2023-03-01 16:00:00+00', NULL),
( 7, 'Grace Patel',        'grace.patel@techcorp.com',        'lead',       'Marketing',    '2023-03-15 12:00:00+00', NULL),
( 8, 'Henry Brown',        'henry.brown@techcorp.com',        'executive',  'Operations',   '2023-04-01 10:00:00+00', NULL),
( 9, 'Iris Nakamura',      'iris.nakamura@techcorp.com',      'senior',     'Sales',        '2023-04-15 09:00:00+00', NULL),
(10, 'Jack Thompson',      'jack.thompson@techcorp.com',      'lead',       'Product',      '2023-05-01 11:00:00+00', NULL),

-- Terminated employees
(11, 'Karen Miller',       'karen.miller@techcorp.com',       'senior',     'Engineering',  '2023-01-20 10:00:00+00', '2023-06-20 10:00:00+00'),
(12, 'Leo Garcia',         'leo.garcia@techcorp.com',         'lead',       'Marketing',    '2023-02-10 14:00:00+00', '2023-08-10 14:00:00+00'),
(13, 'Mia Anderson',       'mia.anderson@techcorp.com',       'junior',     'Sales',        '2023-03-05 09:00:00+00', '2023-05-05 09:00:00+00'),
(14, 'Noah Taylor',        'noah.taylor@techcorp.com',        'senior',     'Operations',   '2023-04-01 10:00:00+00', '2023-09-01 10:00:00+00'),
(15, 'Olivia Martinez',    'olivia.martinez@techcorp.com',    'lead',       'Engineering',  '2023-05-15 11:00:00+00', '2023-11-15 11:00:00+00'),

-- More active employees
(16, 'Peter Zhang',        'peter.zhang@techcorp.com',        'lead',       'Product',      '2023-05-20 08:00:00+00', NULL),
(17, 'Quinn O''Brien',     'quinn.obrien@techcorp.com',       'executive',  'Engineering',  '2023-06-01 10:00:00+00', NULL),
(18, 'Rachel Santos',      'rachel.santos@techcorp.com',      'senior',     'Marketing',    '2023-06-15 14:00:00+00', NULL),
(19, 'Sam Johansson',      'sam.johansson@techcorp.com',      'junior',     'Sales',        '2023-07-01 09:00:00+00', NULL),
(20, 'Tina Dubois',        'tina.dubois@techcorp.com',        'lead',       'Operations',   '2023-07-15 11:00:00+00', NULL),

-- Employees with NO expenses (for LEFT JOIN IS NULL exercise)
(21, 'Uma Krishnan',       'uma.krishnan@techcorp.com',       'junior',     'Marketing',    '2023-08-01 10:00:00+00', NULL),
(22, 'Victor Petrov',      'victor.petrov@techcorp.com',      'junior',     'Engineering',  '2023-08-15 09:00:00+00', NULL),
(23, 'Wendy Chang',        'wendy.chang@techcorp.com',        'junior',     'Product',      '2023-09-01 11:00:00+00', NULL),
(24, 'Xander Muller',      'xander.muller@techcorp.com',      'junior',     'Sales',        '2023-09-15 14:00:00+00', NULL),
(25, 'Yuki Tanaka',        'yuki.tanaka@techcorp.com',        'junior',     'Operations',   '2023-10-01 08:00:00+00', NULL),

-- Employees who share hire dates (for self-join exercise)
-- Same date as employee 1 and 2: Jan 15
-- Same date as employee 5 and 6: Mar 1
-- Same date as employee 8 and 14: Apr 1

-- More employees for volume
(26, 'Anna Kowalski',      'anna.kowalski@techcorp.com',      'senior',     'Product',      '2023-06-01 10:00:00+00', NULL),
(27, 'Ben Okafor',         'ben.okafor@techcorp.com',         'lead',       'Engineering',  '2023-07-01 09:00:00+00', NULL),
(28, 'Clara Rivera',       'clara.rivera@techcorp.com',       'senior',     'Marketing',    '2023-08-01 10:00:00+00', NULL),
(29, 'Derek Singh',        'derek.singh@techcorp.com',        'executive',  'Operations',   '2023-09-01 11:00:00+00', NULL),
(30, 'Elena Volkov',       'elena.volkov@techcorp.com',       'lead',       'Sales',        '2023-10-01 08:00:00+00', NULL),

(31, 'Finn Larsson',       'finn.larsson@techcorp.com',       'senior',     'Product',      '2023-10-15 09:00:00+00', NULL),
(32, 'Gina Rossi',         'gina.rossi@techcorp.com',         'lead',       'Engineering',  '2023-11-01 10:00:00+00', NULL),
(33, 'Hector Morales',     'hector.morales@techcorp.com',     'junior',     'Marketing',    '2023-11-15 11:00:00+00', NULL),
(34, 'Isla MacLeod',       'isla.macleod@techcorp.com',       'senior',     'Sales',        '2023-12-01 14:00:00+00', NULL),
(35, 'James Park',         'james.park@techcorp.com',         'lead',       'Operations',   '2024-01-01 08:00:00+00', NULL),

(36, 'Kate Nguyen',        'kate.nguyen@techcorp.com',        'executive',  'Engineering',  '2024-01-15 10:00:00+00', NULL),
(37, 'Liam Fischer',       'liam.fischer@techcorp.com',       'senior',     'Product',      '2024-02-01 09:00:00+00', NULL),
(38, 'Maya Ali',           'maya.ali@techcorp.com',           'lead',       'Marketing',    '2024-02-15 11:00:00+00', NULL),
(39, 'Nick Papadopoulos',  'nick.papadopoulos@techcorp.com',  'junior',     'Sales',        '2024-03-01 14:00:00+00', NULL),
(40, 'Olivia Bjork',       'olivia.bjork@techcorp.com',       'senior',     'Engineering',  '2024-03-15 10:00:00+00', NULL),

-- Terminated employees (more)
(41, 'Paula Fernandez',    'paula.fernandez@techcorp.com',    'lead',       'Operations',   '2023-03-01 09:00:00+00', '2023-09-01 09:00:00+00'),
(42, 'Raj Gupta',          'raj.gupta@techcorp.com',          'senior',     'Marketing',    '2023-04-15 09:00:00+00', '2023-10-15 09:00:00+00'),
(43, 'Sara Eriksson',      'sara.eriksson@techcorp.com',      'junior',     'Sales',        '2023-05-01 11:00:00+00', '2023-07-01 11:00:00+00'),
(44, 'Tom Williams',       'tom.williams@techcorp.com',       'lead',       'Product',      '2023-06-15 14:00:00+00', '2024-01-15 14:00:00+00'),
(45, 'Ursula Weber',       'ursula.weber@techcorp.com',       'senior',     'Engineering',  '2023-07-01 09:00:00+00', '2024-02-01 09:00:00+00'),

-- Junior employees who never got assignments (no expenses or assignments)
(46, 'Val Antonov',        'val.antonov@techcorp.com',        'junior',     'Engineering',  '2024-04-01 10:00:00+00', NULL),
(47, 'Wes Hoffman',        'wes.hoffman@techcorp.com',        'junior',     'Marketing',    '2024-04-15 11:00:00+00', NULL),
(48, 'Xena Christou',      'xena.christou@techcorp.com',      'junior',     'Product',      '2024-05-01 09:00:00+00', NULL),
(49, 'Yves Dupont',        'yves.dupont@techcorp.com',        'junior',     'Sales',        '2024-05-15 14:00:00+00', NULL),
(50, 'Zara Osei',          'zara.osei@techcorp.com',          'junior',     'Operations',   '2024-06-01 08:00:00+00', NULL);

SELECT setval('theme_professional.employees_id_seq', 50);

-- ============================================================
-- EXPENSES (80 rows) — maps to orders
-- status: approved|rejected|pending maps to completed|refunded|pending
-- created_at maps to created_at
-- SAME total_cents values and FK patterns
-- ============================================================
INSERT INTO theme_professional.expenses (id, employee_id, total_cents, status, created_at) VALUES
-- Alice (employee 1) — 4 expenses
( 1,  1, 12800, 'approved',  '2023-02-10 10:00:00+00'),
( 2,  1,  9900, 'approved',  '2023-05-22 14:00:00+00'),
( 3,  1, 24800, 'approved',  '2023-09-15 11:00:00+00'),
( 4,  1,  4900, 'rejected',  '2023-12-01 09:00:00+00'),

-- Bob (employee 2) — 2 expenses
( 5,  2,  2900, 'approved',  '2023-02-20 09:00:00+00'),
( 6,  2,  6800, 'approved',  '2023-07-10 15:00:00+00'),

-- Carol (employee 3) — 5 expenses (high-value executive)
( 7,  3, 39800, 'approved',  '2023-02-15 10:00:00+00'),
( 8,  3, 29900, 'approved',  '2023-04-20 11:00:00+00'),
( 9,  3, 34800, 'approved',  '2023-07-12 14:00:00+00'),
(10,  3, 49800, 'approved',  '2023-10-05 09:00:00+00'),
(11,  3, 29900, 'approved',  '2024-01-15 10:00:00+00'),

-- David (employee 4) — 3 expenses
(12,  4,  9900, 'approved',  '2023-03-10 11:00:00+00'),
(13,  4, 14800, 'approved',  '2023-06-25 14:00:00+00'),
(14,  4,  4900, 'pending',   '2023-11-20 09:00:00+00'),

-- Emma (employee 5) — 1 expense
(15,  5,  2900, 'approved',  '2023-04-15 08:00:00+00'),

-- Frank (employee 6) — 2 expenses
(16,  6,  7800, 'approved',  '2023-04-20 16:00:00+00'),
(17,  6,  4900, 'approved',  '2023-08-10 10:00:00+00'),

-- Grace (employee 7) — 3 expenses
(18,  7, 14800, 'approved',  '2023-04-25 12:00:00+00'),
(19,  7,  9900, 'approved',  '2023-08-15 09:00:00+00'),
(20,  7, 19800, 'approved',  '2024-01-10 14:00:00+00'),

-- Henry (employee 8) — 4 expenses
(21,  8, 39800, 'approved',  '2023-05-10 10:00:00+00'),
(22,  8, 29900, 'approved',  '2023-08-20 11:00:00+00'),
(23,  8, 49800, 'approved',  '2023-11-15 14:00:00+00'),
(24,  8, 29900, 'rejected',  '2024-02-10 09:00:00+00'),

-- Iris (employee 9) — 2 expenses
(25,  9,  4900, 'approved',  '2023-05-20 09:00:00+00'),
(26,  9,  2900, 'approved',  '2023-09-25 14:00:00+00'),

-- Jack (employee 10) — 3 expenses
(27, 10, 12800, 'approved',  '2023-06-10 11:00:00+00'),
(28, 10,  9900, 'approved',  '2023-09-20 10:00:00+00'),
(29, 10,  4900, 'approved',  '2024-01-05 14:00:00+00'),

-- Karen (employee 11, terminated) — 2 expenses before termination
(30, 11,  2900, 'approved',  '2023-02-25 10:00:00+00'),
(31, 11,  4900, 'approved',  '2023-05-15 11:00:00+00'),

-- Leo (employee 12, terminated) — 3 expenses
(32, 12, 14800, 'approved',  '2023-03-20 14:00:00+00'),
(33, 12,  9900, 'approved',  '2023-06-10 09:00:00+00'),
(34, 12,  4900, 'rejected',  '2023-07-25 11:00:00+00'),

-- Mia (employee 13, terminated) — 1 expense
(35, 13,  2900, 'approved',  '2023-04-01 09:00:00+00'),

-- Noah (employee 14, terminated) — 2 expenses
(36, 14,  7800, 'approved',  '2023-05-10 10:00:00+00'),
(37, 14,  4900, 'approved',  '2023-08-01 14:00:00+00'),

-- Olivia (employee 15, terminated) — 2 expenses
(38, 15, 14800, 'approved',  '2023-06-20 11:00:00+00'),
(39, 15,  9900, 'approved',  '2023-09-15 09:00:00+00'),

-- Peter (employee 16) — 2 expenses
(40, 16,  9900, 'approved',  '2023-06-25 08:00:00+00'),
(41, 16, 19800, 'approved',  '2023-10-15 14:00:00+00'),

-- Quinn (employee 17) — 3 expenses
(42, 17, 39800, 'approved',  '2023-07-10 10:00:00+00'),
(43, 17, 29900, 'approved',  '2023-10-20 11:00:00+00'),
(44, 17, 49800, 'approved',  '2024-02-05 09:00:00+00'),

-- Rachel (employee 18) — 1 expense
(45, 18,  4900, 'approved',  '2023-07-20 14:00:00+00'),

-- Sam (employee 19) — 1 expense
(46, 19,  2900, 'approved',  '2023-08-10 09:00:00+00'),

-- Tina (employee 20) — 2 expenses
(47, 20, 14800, 'approved',  '2023-08-25 11:00:00+00'),
(48, 20,  9900, 'approved',  '2023-12-10 14:00:00+00'),

-- Anna (employee 26) — 2 expenses
(49, 26,  4900, 'approved',  '2023-07-15 10:00:00+00'),
(50, 26,  7800, 'approved',  '2023-11-20 09:00:00+00'),

-- Ben (employee 27) — 2 expenses
(51, 27, 12800, 'approved',  '2023-08-10 09:00:00+00'),
(52, 27,  9900, 'approved',  '2024-01-20 14:00:00+00'),

-- Clara (employee 28) — 1 expense
(53, 28,  4900, 'approved',  '2023-09-15 10:00:00+00'),

-- Derek (employee 29) — 3 expenses
(54, 29, 39800, 'approved',  '2023-10-10 11:00:00+00'),
(55, 29, 29900, 'approved',  '2024-01-25 09:00:00+00'),
(56, 29, 19800, 'approved',  '2024-03-10 14:00:00+00'),

-- Elena (employee 30) — 2 expenses
(57, 30,  9900, 'approved',  '2023-11-10 08:00:00+00'),
(58, 30, 14800, 'approved',  '2024-02-20 10:00:00+00'),

-- Finn (employee 31) — 1 expense
(59, 31,  4900, 'approved',  '2023-11-25 09:00:00+00'),

-- Gina (employee 32) — 2 expenses
(60, 32, 12800, 'approved',  '2023-12-10 10:00:00+00'),
(61, 32,  9900, 'approved',  '2024-03-15 11:00:00+00'),

-- Hector (employee 33) — 1 expense
(62, 33,  2900, 'approved',  '2024-01-05 11:00:00+00'),

-- Isla (employee 34) — 1 expense
(63, 34,  7800, 'approved',  '2024-01-20 14:00:00+00'),

-- James (employee 35) — 2 expenses
(64, 35, 14800, 'approved',  '2024-02-10 08:00:00+00'),
(65, 35,  9900, 'approved',  '2024-04-05 10:00:00+00'),

-- Kate (employee 36) — 2 expenses
(66, 36, 49800, 'approved',  '2024-02-20 10:00:00+00'),
(67, 36, 29900, 'approved',  '2024-05-10 09:00:00+00'),

-- Liam (employee 37) — 1 expense
(68, 37,  4900, 'approved',  '2024-03-10 09:00:00+00'),

-- Maya (employee 38) — 1 expense
(69, 38, 12800, 'approved',  '2024-03-25 11:00:00+00'),

-- Paula (employee 41, terminated) — 1 expense
(70, 41,  9900, 'approved',  '2023-04-10 09:00:00+00'),

-- Raj (employee 42, terminated) — 1 expense
(71, 42,  4900, 'approved',  '2023-05-25 09:00:00+00'),

-- Tom (employee 44, terminated) — 2 expenses
(72, 44, 14800, 'approved',  '2023-07-25 14:00:00+00'),
(73, 44,  9900, 'approved',  '2023-11-10 10:00:00+00'),

-- Ursula (employee 45, terminated) — 1 expense
(74, 45,  4900, 'approved',  '2023-08-15 09:00:00+00'),

-- Nick (employee 39) — 1 small expense
(75, 39,  2900, 'pending',   '2024-04-10 14:00:00+00'),

-- Olivia B (employee 40) — 1 expense
(76, 40,  7800, 'approved',  '2024-04-20 10:00:00+00'),

-- Extra expenses for time-series analysis
(77,  1, 14800, 'approved',  '2024-03-10 10:00:00+00'),
(78,  3, 39800, 'approved',  '2024-04-15 11:00:00+00'),
(79,  7, 12800, 'approved',  '2024-04-20 14:00:00+00'),
(80,  8, 49800, 'approved',  '2024-05-10 09:00:00+00');

SELECT setval('theme_professional.expenses_id_seq', 80);

-- ============================================================
-- EXPENSE_ITEMS (118 rows) — maps to order_items
-- SAME FK patterns, quantities, unit_cost_cents values
-- ============================================================
INSERT INTO theme_professional.expense_items (id, expense_id, project_id, quantity, unit_cost_cents) VALUES
-- Alice expenses
( 1,  1, 1, 1,  2900), ( 2,  1, 3, 1,  4900), ( 3,  1, 5, 1,  1900),  -- expense 1: API Redesign + Brand Refresh + CRM
( 4,  2, 2, 1,  9900),                                                   -- expense 2: Cloud Migration
( 5,  3, 2, 1,  9900), ( 6,  3, 4, 1, 19900),                           -- expense 3: Cloud Migration + Annual Campaign
( 7,  4, 3, 1,  4900),                                                   -- expense 4: Brand Refresh (rejected)

-- Bob expenses
( 8,  5, 1, 1,  2900),                                                   -- expense 5: API Redesign
( 9,  6, 1, 1,  2900), (10,  6, 5, 1,  1900),                           -- expense 6: API Redesign + CRM

-- Carol expenses (executive, high-value)
(11,  7, 2, 1,  9900), (12,  7, 4, 1, 19900), (13,  7, 8, 1, 29900),   -- expense 7: Cloud Migration + Annual Campaign + ERP
(14,  8, 8, 1, 29900),                                                   -- expense 8: ERP Implementation
(15,  9, 2, 1,  9900), (16,  9, 6, 1,  4900), (17,  9, 4, 1, 19900),   -- expense 9: Cloud Migration + Pipeline Automation + Annual Campaign
(18, 10, 8, 1, 29900), (19, 10, 4, 1, 19900),                           -- expense 10: ERP + Annual Campaign
(20, 11, 8, 1, 29900),                                                   -- expense 11: ERP Implementation

-- David expenses
(21, 12, 2, 1,  9900),                                                   -- expense 12: Cloud Migration
(22, 13, 2, 1,  9900), (23, 13, 3, 1,  4900),                           -- expense 13: Cloud Migration + Brand Refresh
(24, 14, 3, 1,  4900),                                                   -- expense 14: Brand Refresh (pending)

-- Emma expense
(25, 15, 1, 1,  2900),                                                   -- expense 15: API Redesign

-- Frank expenses
(26, 16, 1, 1,  2900), (27, 16, 3, 1,  4900),                           -- expense 16: API Redesign + Brand Refresh
(28, 17, 3, 1,  4900),                                                   -- expense 17: Brand Refresh

-- Grace expenses
(29, 18, 2, 1,  9900), (30, 18, 3, 1,  4900),                           -- expense 18: Cloud Migration + Brand Refresh
(31, 19, 2, 1,  9900),                                                   -- expense 19: Cloud Migration
(32, 20, 2, 1,  9900), (33, 20, 4, 1, 19900),                           -- expense 20: Cloud Migration + Annual Campaign

-- Henry expenses (executive)
(34, 21, 2, 1,  9900), (35, 21, 8, 1, 29900),                           -- expense 21: Cloud Migration + ERP
(36, 22, 8, 1, 29900),                                                   -- expense 22: ERP Implementation
(37, 23, 8, 1, 29900), (38, 23, 4, 1, 19900),                           -- expense 23: ERP + Annual Campaign
(39, 24, 8, 1, 29900),                                                   -- expense 24: ERP (rejected)

-- Iris expenses
(40, 25, 3, 1,  4900),                                                   -- expense 25: Brand Refresh
(41, 26, 1, 1,  2900),                                                   -- expense 26: API Redesign

-- Jack expenses
(42, 27, 2, 1,  9900), (43, 27, 5, 1,  1900),                           -- expense 27: Cloud Migration + CRM
(44, 28, 2, 1,  9900),                                                   -- expense 28: Cloud Migration
(45, 29, 3, 1,  4900),                                                   -- expense 29: Brand Refresh

-- Karen (terminated) expenses
(46, 30, 1, 1,  2900),                                                   -- expense 30: API Redesign
(47, 31, 3, 1,  4900),                                                   -- expense 31: Brand Refresh

-- Leo (terminated) expenses
(48, 32, 2, 1,  9900), (49, 32, 3, 1,  4900),                           -- expense 32: Cloud Migration + Brand Refresh
(50, 33, 2, 1,  9900),                                                   -- expense 33: Cloud Migration
(51, 34, 3, 1,  4900),                                                   -- expense 34: Brand Refresh (rejected)

-- Mia (terminated) expense
(52, 35, 1, 1,  2900),                                                   -- expense 35: API Redesign

-- Noah (terminated) expenses
(53, 36, 1, 1,  2900), (54, 36, 3, 1,  4900),                           -- expense 36: API Redesign + Brand Refresh
(55, 37, 3, 1,  4900),                                                   -- expense 37: Brand Refresh

-- Olivia (terminated) expenses
(56, 38, 2, 1,  9900), (57, 38, 3, 1,  4900),                           -- expense 38: Cloud Migration + Brand Refresh
(58, 39, 2, 1,  9900),                                                   -- expense 39: Cloud Migration

-- Peter expenses
(59, 40, 2, 1,  9900),                                                   -- expense 40: Cloud Migration
(60, 41, 2, 1,  9900), (61, 41, 4, 1, 19900),                           -- expense 41: Cloud Migration + Annual Campaign

-- Quinn expenses (executive)
(62, 42, 2, 1,  9900), (63, 42, 8, 1, 29900),                           -- expense 42: Cloud Migration + ERP
(64, 43, 8, 1, 29900),                                                   -- expense 43: ERP Implementation
(65, 44, 8, 1, 29900), (66, 44, 4, 1, 19900),                           -- expense 44: ERP + Annual Campaign

-- Rachel, Sam, Tina
(67, 45, 3, 1,  4900),                                                   -- expense 45: Brand Refresh
(68, 46, 1, 1,  2900),                                                   -- expense 46: API Redesign
(69, 47, 2, 1,  9900), (70, 47, 5, 1,  1900),                           -- expense 47: Cloud Migration + CRM
(71, 48, 2, 1,  9900),                                                   -- expense 48: Cloud Migration

-- Anna, Ben, Clara, Derek, Elena, Finn, Gina, Hector, Isla, James, Kate, Liam, Maya
(72, 49, 3, 1,  4900),                                                   -- Anna expense 1
(73, 50, 1, 1,  2900), (74, 50, 3, 1,  4900),                           -- Anna expense 2
(75, 51, 2, 1,  9900), (76, 51, 5, 1,  1900),                           -- Ben expense 1
(77, 52, 2, 1,  9900),                                                   -- Ben expense 2
(78, 53, 3, 1,  4900),                                                   -- Clara expense
(79, 54, 2, 1,  9900), (80, 54, 8, 1, 29900),                           -- Derek expense 1
(81, 55, 8, 1, 29900),                                                   -- Derek expense 2
(82, 56, 4, 1, 19900),                                                   -- Derek expense 3
(83, 57, 2, 1,  9900),                                                   -- Elena expense 1
(84, 58, 2, 1,  9900), (85, 58, 3, 1,  4900),                           -- Elena expense 2
(86, 59, 3, 1,  4900),                                                   -- Finn expense
(87, 60, 2, 1,  9900), (88, 60, 5, 1,  1900),                           -- Gina expense 1
(89, 61, 2, 1,  9900),                                                   -- Gina expense 2
(90, 62, 1, 1,  2900),                                                   -- Hector expense
(91, 63, 1, 1,  2900), (92, 63, 3, 1,  4900),                           -- Isla expense
(93, 64, 2, 1,  9900), (94, 64, 3, 1,  4900),                           -- James expense 1
(95, 65, 2, 1,  9900),                                                   -- James expense 2
(96, 66, 8, 1, 29900), (97, 66, 4, 1, 19900),                           -- Kate expense 1
(98, 67, 8, 1, 29900),                                                   -- Kate expense 2
(99, 68, 3, 1,  4900),                                                   -- Liam expense
(100, 69, 2, 1, 9900), (101, 69, 5, 1, 1900),                           -- Maya expense

-- Terminated employees' expenses
(102, 70, 2, 1,  9900),                                                  -- Paula expense
(103, 71, 3, 1,  4900),                                                  -- Raj expense
(104, 72, 2, 1,  9900), (105, 72, 3, 1,  4900),                         -- Tom expense 1
(106, 73, 2, 1,  9900),                                                  -- Tom expense 2
(107, 74, 3, 1,  4900),                                                  -- Ursula expense

-- Nick (pending), Olivia B
(108, 75, 1, 1,  2900),                                                  -- Nick expense (pending)
(109, 76, 1, 1,  2900), (110, 76, 3, 1, 4900),                          -- Olivia B expense

-- Extra time-series expenses
(111, 77, 2, 1,  9900), (112, 77, 3, 1, 4900),                          -- Alice extra
(113, 78, 2, 1,  9900), (114, 78, 8, 1, 29900),                         -- Carol extra
(115, 79, 2, 1,  9900), (116, 79, 5, 1, 1900),                          -- Grace extra
(117, 80, 8, 1, 29900), (118, 80, 4, 1, 19900);                         -- Henry extra

SELECT setval('theme_professional.expense_items_id_seq', 118);

-- ============================================================
-- ASSIGNMENTS (60 rows) — maps to subscriptions
-- status: active|completed|on_hold|cancelled maps to active|cancelled|past_due|trialing
-- hourly_rate maps to mrr_cents, ended_at maps to cancelled_at
-- SAME values and FK patterns
-- ============================================================
INSERT INTO theme_professional.assignments (id, employee_id, project_id, status, started_at, ended_at, hourly_rate) VALUES
-- Active assignments
( 1,  1, 2, 'active',     '2023-02-10', NULL,          9900),  -- Alice: Cloud Migration
( 2,  1, 4, 'active',     '2023-09-15', NULL,         19900),  -- Alice: Annual Campaign
( 3,  2, 1, 'active',     '2023-02-20', NULL,          2900),  -- Bob: API Redesign
( 4,  3, 2, 'active',     '2023-02-15', NULL,          9900),  -- Carol: Cloud Migration
( 5,  3, 8, 'active',     '2023-02-15', NULL,         29900),  -- Carol: ERP Implementation
( 6,  3, 4, 'active',     '2023-07-12', NULL,         19900),  -- Carol: Annual Campaign
( 7,  4, 2, 'active',     '2023-03-10', NULL,          9900),  -- David: Cloud Migration
( 8,  6, 1, 'active',     '2023-04-20', NULL,          2900),  -- Frank: API Redesign
( 9,  7, 2, 'active',     '2023-04-25', NULL,          9900),  -- Grace: Cloud Migration
(10,  8, 2, 'active',     '2023-05-10', NULL,          9900),  -- Henry: Cloud Migration
(11,  8, 8, 'active',     '2023-05-10', NULL,         29900),  -- Henry: ERP Implementation
(12, 10, 2, 'active',     '2023-06-10', NULL,          9900),  -- Jack: Cloud Migration
(13, 16, 2, 'active',     '2023-06-25', NULL,          9900),  -- Peter: Cloud Migration
(14, 17, 2, 'active',     '2023-07-10', NULL,          9900),  -- Quinn: Cloud Migration
(15, 17, 8, 'active',     '2023-07-10', NULL,         29900),  -- Quinn: ERP Implementation
(16, 20, 2, 'active',     '2023-08-25', NULL,          9900),  -- Tina: Cloud Migration
(17, 27, 2, 'active',     '2023-08-10', NULL,          9900),  -- Ben: Cloud Migration
(18, 29, 2, 'active',     '2023-10-10', NULL,          9900),  -- Derek: Cloud Migration
(19, 29, 8, 'active',     '2023-10-10', NULL,         29900),  -- Derek: ERP Implementation
(20, 30, 2, 'active',     '2023-11-10', NULL,          9900),  -- Elena: Cloud Migration
(21, 32, 2, 'active',     '2023-12-10', NULL,          9900),  -- Gina: Cloud Migration
(22, 35, 2, 'active',     '2024-02-10', NULL,          9900),  -- James: Cloud Migration
(23, 36, 8, 'active',     '2024-02-20', NULL,         29900),  -- Kate: ERP Implementation
(24, 36, 4, 'active',     '2024-02-20', NULL,         19900),  -- Kate: Annual Campaign
(25, 38, 2, 'active',     '2024-03-25', NULL,          9900),  -- Maya: Cloud Migration

-- Cancelled assignments (terminated employees)
(26, 11, 1, 'cancelled',  '2023-02-25', '2023-06-20',  0),     -- Karen: API Redesign (terminated)
(27, 12, 2, 'cancelled',  '2023-03-20', '2023-08-10',  0),     -- Leo: Cloud Migration (terminated)
(28, 13, 1, 'cancelled',  '2023-04-01', '2023-05-05',  0),     -- Mia: API Redesign (terminated)
(29, 14, 1, 'cancelled',  '2023-05-10', '2023-09-01',  0),     -- Noah: API Redesign (terminated)
(30, 15, 2, 'cancelled',  '2023-06-20', '2023-11-15',  0),     -- Olivia: Cloud Migration (terminated)
(31, 41, 2, 'cancelled',  '2023-04-10', '2023-09-01',  0),     -- Paula: Cloud Migration (terminated)
(32, 42, 3, 'cancelled',  '2023-05-25', '2023-10-15',  0),     -- Raj: Brand Refresh (terminated)
(33, 43, 1, 'cancelled',  '2023-05-01', '2023-07-01',  0),     -- Sara: API Redesign (terminated)
(34, 44, 2, 'cancelled',  '2023-07-25', '2024-01-15',  0),     -- Tom: Cloud Migration (terminated)
(35, 45, 3, 'cancelled',  '2023-08-15', '2024-02-01',  0),     -- Ursula: Brand Refresh (terminated)

-- On-hold assignments (maps to trialing)
(36, 37, 1, 'on_hold',    '2024-03-10', NULL,          0),     -- Liam: API Redesign (on hold)
(37, 39, 1, 'on_hold',    '2024-04-10', NULL,          0),     -- Nick: API Redesign (on hold)
(38, 40, 1, 'on_hold',    '2024-04-20', NULL,          0),     -- Olivia B: API Redesign (on hold)

-- Completed (maps to past_due)
(39,  9, 1, 'completed',  '2023-05-20', NULL,          2900),  -- Iris: API Redesign (completed)
(40, 18, 3, 'completed',  '2023-07-20', NULL,          4900),  -- Rachel: Brand Refresh (completed)

-- More active assignments for data volume
(41,  1, 5, 'active',     '2023-05-22', NULL,          1900),  -- Alice: CRM Integration
(42,  7, 3, 'active',     '2023-04-25', NULL,          4900),  -- Grace: Brand Refresh
(43, 10, 5, 'active',     '2023-06-10', NULL,          1900),  -- Jack: CRM Integration
(44,  2, 5, 'active',     '2023-07-10', NULL,          1900),  -- Bob: CRM Integration
(45,  6, 3, 'active',     '2023-04-20', NULL,          4900),  -- Frank: Brand Refresh
(46, 20, 5, 'active',     '2023-08-25', NULL,          1900),  -- Tina: CRM Integration
(47, 26, 3, 'active',     '2023-07-15', NULL,          4900),  -- Anna: Brand Refresh
(48, 28, 3, 'active',     '2023-09-15', NULL,          4900),  -- Clara: Brand Refresh
(49, 31, 3, 'active',     '2023-11-25', NULL,          4900),  -- Finn: Brand Refresh
(50, 34, 1, 'active',     '2024-01-20', NULL,          2900),  -- Isla: API Redesign

-- Reassigned (had one project, moved to another)
(51,  4, 1, 'cancelled',  '2023-03-10', '2023-06-25',  0),     -- David: had API Redesign, cancelled when reassigned
(52,  4, 3, 'active',     '2023-06-25', NULL,          4900),  -- David: Brand Refresh
(53, 16, 4, 'active',     '2023-10-15', NULL,         19900),  -- Peter: Annual Campaign (added later)
(54,  8, 4, 'active',     '2023-11-15', NULL,         19900),  -- Henry: Annual Campaign (added later)
(55, 32, 5, 'active',     '2023-12-10', NULL,          1900),  -- Gina: CRM Integration
(56, 35, 3, 'active',     '2024-02-10', NULL,          4900),  -- James: Brand Refresh
(57, 38, 5, 'active',     '2024-03-25', NULL,          1900),  -- Maya: CRM Integration
(58, 27, 5, 'active',     '2023-08-10', NULL,          1900),  -- Ben: CRM Integration
(59, 30, 3, 'active',     '2023-11-10', NULL,          4900),  -- Elena: Brand Refresh
(60, 17, 4, 'active',     '2023-10-20', NULL,         19900);  -- Quinn: Annual Campaign

SELECT setval('theme_professional.assignments_id_seq', 60);

-- ============================================================
-- TIMESHEET_ENTRIES (200 rows) — maps to events
-- entry_type: regular|overtime|meeting|training|review maps to login|feature_used|export|api_call|upgrade_prompt_shown
-- logged_at maps to occurred_at
-- SAME JSONB properties structure and FK patterns
-- ============================================================
INSERT INTO theme_professional.timesheet_entries (id, employee_id, entry_type, properties, logged_at) VALUES
-- Alice entries (employee 1)
( 1,  1, 'regular',   '{"device": "desktop"}',                   '2023-02-10 10:05:00+00'),
( 2,  1, 'overtime',  '{"feature": "dashboard"}',                '2023-02-10 10:15:00+00'),
( 3,  1, 'overtime',  '{"feature": "reports"}',                  '2023-02-10 11:00:00+00'),
( 4,  1, 'meeting',   '{"format": "csv", "rows": 1500}',        '2023-02-10 11:30:00+00'),
( 5,  1, 'regular',   '{"device": "mobile"}',                    '2023-03-15 08:00:00+00'),
( 6,  1, 'overtime',  '{"feature": "dashboard"}',                '2023-03-15 08:10:00+00'),
( 7,  1, 'training',  '{"endpoint": "/v1/analytics"}',           '2023-04-20 14:00:00+00'),
( 8,  1, 'training',  '{"endpoint": "/v1/reports"}',             '2023-04-20 14:30:00+00'),
( 9,  1, 'regular',   '{"device": "desktop"}',                   '2023-05-22 09:00:00+00'),
(10,  1, 'review',    '{"from": "starter", "to": "pro"}',        '2023-05-22 09:15:00+00'),

-- Bob entries (employee 2)
(11,  2, 'regular',   '{"device": "desktop"}',                   '2023-02-20 09:00:00+00'),
(12,  2, 'overtime',  '{"feature": "dashboard"}',                '2023-02-20 09:10:00+00'),
(13,  2, 'regular',   '{"device": "desktop"}',                   '2023-03-10 10:00:00+00'),
(14,  2, 'overtime',  '{"feature": "reports"}',                  '2023-03-10 10:30:00+00'),
(15,  2, 'meeting',   '{"format": "pdf", "rows": 200}',         '2023-03-10 11:00:00+00'),

-- Carol entries (employee 3 — heavy user)
(16,  3, 'regular',   '{"device": "desktop"}',                   '2023-02-15 09:00:00+00'),
(17,  3, 'overtime',  '{"feature": "dashboard"}',                '2023-02-15 09:10:00+00'),
(18,  3, 'training',  '{"endpoint": "/v1/analytics"}',           '2023-02-15 10:00:00+00'),
(19,  3, 'training',  '{"endpoint": "/v1/reports"}',             '2023-02-15 10:30:00+00'),
(20,  3, 'training',  '{"endpoint": "/v1/export"}',              '2023-02-15 11:00:00+00'),
(21,  3, 'regular',   '{"device": "desktop"}',                   '2023-03-20 09:00:00+00'),
(22,  3, 'overtime',  '{"feature": "integrations"}',             '2023-03-20 09:30:00+00'),
(23,  3, 'regular',   '{"device": "mobile"}',                    '2023-04-20 08:00:00+00'),
(24,  3, 'training',  '{"endpoint": "/v1/analytics"}',           '2023-05-10 14:00:00+00'),
(25,  3, 'meeting',   '{"format": "csv", "rows": 5000}',        '2023-05-10 14:30:00+00'),

-- David entries (employee 4)
(26,  4, 'regular',   '{"device": "desktop"}',                   '2023-03-10 11:00:00+00'),
(27,  4, 'overtime',  '{"feature": "dashboard"}',                '2023-03-10 11:15:00+00'),
(28,  4, 'review',    '{"from": "starter", "to": "pro"}',        '2023-03-10 11:30:00+00'),
(29,  4, 'regular',   '{"device": "desktop"}',                   '2023-06-25 09:00:00+00'),
(30,  4, 'overtime',  '{"feature": "reports"}',                  '2023-06-25 09:30:00+00'),

-- Emma entries (employee 5 — light user)
(31,  5, 'regular',   '{"device": "mobile"}',                    '2023-04-15 08:00:00+00'),
(32,  5, 'overtime',  '{"feature": "dashboard"}',                '2023-04-15 08:10:00+00'),

-- Frank entries (employee 6)
(33,  6, 'regular',   '{"device": "desktop"}',                   '2023-04-20 16:00:00+00'),
(34,  6, 'overtime',  '{"feature": "dashboard"}',                '2023-04-20 16:15:00+00'),
(35,  6, 'overtime',  '{"feature": "storage"}',                  '2023-04-20 16:30:00+00'),
(36,  6, 'regular',   '{"device": "desktop"}',                   '2023-08-10 09:00:00+00'),

-- Grace entries (employee 7)
(37,  7, 'regular',   '{"device": "desktop"}',                   '2023-04-25 12:00:00+00'),
(38,  7, 'overtime',  '{"feature": "dashboard"}',                '2023-04-25 12:10:00+00'),
(39,  7, 'overtime',  '{"feature": "reports"}',                  '2023-04-25 12:30:00+00'),
(40,  7, 'meeting',   '{"format": "csv", "rows": 800}',         '2023-04-25 13:00:00+00'),
(41,  7, 'regular',   '{"device": "mobile"}',                    '2023-08-15 07:00:00+00'),
(42,  7, 'training',  '{"endpoint": "/v1/analytics"}',           '2023-08-15 07:30:00+00'),

-- Henry entries (employee 8 — executive, heavy training)
(43,  8, 'regular',   '{"device": "desktop"}',                   '2023-05-10 10:00:00+00'),
(44,  8, 'training',  '{"endpoint": "/v1/analytics"}',           '2023-05-10 10:15:00+00'),
(45,  8, 'training',  '{"endpoint": "/v1/reports"}',             '2023-05-10 10:30:00+00'),
(46,  8, 'training',  '{"endpoint": "/v1/export"}',              '2023-05-10 11:00:00+00'),
(47,  8, 'training',  '{"endpoint": "/v1/analytics"}',           '2023-06-15 09:00:00+00'),
(48,  8, 'training',  '{"endpoint": "/v1/analytics"}',           '2023-07-20 14:00:00+00'),
(49,  8, 'regular',   '{"device": "desktop"}',                   '2023-08-20 10:00:00+00'),
(50,  8, 'meeting',   '{"format": "json", "rows": 10000}',      '2023-08-20 10:30:00+00'),

-- Iris entries (employee 9)
(51,  9, 'regular',   '{"device": "desktop"}',                   '2023-05-20 09:00:00+00'),
(52,  9, 'overtime',  '{"feature": "dashboard"}',                '2023-05-20 09:15:00+00'),
(53,  9, 'regular',   '{"device": "desktop"}',                   '2023-09-25 10:00:00+00'),

-- Jack entries (employee 10)
(54, 10, 'regular',   '{"device": "desktop"}',                   '2023-06-10 11:00:00+00'),
(55, 10, 'overtime',  '{"feature": "dashboard"}',                '2023-06-10 11:10:00+00'),
(56, 10, 'overtime',  '{"feature": "reports"}',                  '2023-06-10 11:30:00+00'),
(57, 10, 'regular',   '{"device": "mobile"}',                    '2023-09-20 08:00:00+00'),
(58, 10, 'meeting',   '{"format": "csv", "rows": 500}',         '2023-09-20 08:30:00+00'),

-- Karen entries (employee 11, terminated)
(59, 11, 'regular',   '{"device": "desktop"}',                   '2023-02-25 10:00:00+00'),
(60, 11, 'overtime',  '{"feature": "dashboard"}',                '2023-02-25 10:10:00+00'),
(61, 11, 'regular',   '{"device": "desktop"}',                   '2023-05-15 09:00:00+00'),
(62, 11, 'review',    '{"from": "starter", "to": "pro"}',        '2023-05-15 09:30:00+00'),

-- Leo entries (employee 12, terminated)
(63, 12, 'regular',   '{"device": "desktop"}',                   '2023-03-20 14:00:00+00'),
(64, 12, 'overtime',  '{"feature": "reports"}',                  '2023-03-20 14:30:00+00'),
(65, 12, 'regular',   '{"device": "desktop"}',                   '2023-06-10 09:00:00+00'),
(66, 12, 'overtime',  '{"feature": "dashboard"}',                '2023-06-10 09:15:00+00'),

-- More employees' entries
(67, 13, 'regular',   '{"device": "mobile"}',                    '2023-04-01 09:00:00+00'),
(68, 14, 'regular',   '{"device": "desktop"}',                   '2023-05-10 10:00:00+00'),
(69, 14, 'overtime',  '{"feature": "dashboard"}',                '2023-05-10 10:15:00+00'),
(70, 15, 'regular',   '{"device": "desktop"}',                   '2023-06-20 11:00:00+00'),
(71, 15, 'overtime',  '{"feature": "reports"}',                  '2023-06-20 11:30:00+00'),
(72, 15, 'meeting',   '{"format": "csv", "rows": 300}',         '2023-06-20 12:00:00+00'),

-- Peter entries (employee 16)
(73, 16, 'regular',   '{"device": "desktop"}',                   '2023-06-25 08:00:00+00'),
(74, 16, 'overtime',  '{"feature": "dashboard"}',                '2023-06-25 08:10:00+00'),
(75, 16, 'training',  '{"endpoint": "/v1/analytics"}',           '2023-10-15 09:00:00+00'),

-- Quinn entries (employee 17 — executive)
(76, 17, 'regular',   '{"device": "desktop"}',                   '2023-07-10 10:00:00+00'),
(77, 17, 'training',  '{"endpoint": "/v1/analytics"}',           '2023-07-10 10:30:00+00'),
(78, 17, 'training',  '{"endpoint": "/v1/reports"}',             '2023-07-10 11:00:00+00'),
(79, 17, 'regular',   '{"device": "desktop"}',                   '2023-10-20 09:00:00+00'),
(80, 17, 'meeting',   '{"format": "json", "rows": 8000}',       '2023-10-20 09:30:00+00'),

-- Rachel, Sam, Tina entries
(81, 18, 'regular',   '{"device": "mobile"}',                    '2023-07-20 14:00:00+00'),
(82, 19, 'regular',   '{"device": "desktop"}',                   '2023-08-10 09:00:00+00'),
(83, 19, 'overtime',  '{"feature": "dashboard"}',                '2023-08-10 09:10:00+00'),
(84, 20, 'regular',   '{"device": "desktop"}',                   '2023-08-25 11:00:00+00'),
(85, 20, 'overtime',  '{"feature": "reports"}',                  '2023-08-25 11:15:00+00'),
(86, 20, 'regular',   '{"device": "mobile"}',                    '2023-12-10 08:00:00+00'),

-- Employees 21-25 (no expenses, light activity)
(87, 21, 'regular',   '{"device": "mobile"}',                    '2023-08-01 10:00:00+00'),
(88, 22, 'regular',   '{"device": "desktop"}',                   '2023-08-15 09:00:00+00'),
(89, 23, 'regular',   '{"device": "desktop"}',                   '2023-09-01 11:00:00+00'),
(90, 23, 'overtime',  '{"feature": "dashboard"}',                '2023-09-01 11:10:00+00'),
(91, 24, 'regular',   '{"device": "mobile"}',                    '2023-09-15 14:00:00+00'),
(92, 25, 'regular',   '{"device": "desktop"}',                   '2023-10-01 08:00:00+00'),

-- Anna, Ben, Clara, Derek entries
(93, 26, 'regular',   '{"device": "desktop"}',                   '2023-07-15 10:00:00+00'),
(94, 26, 'overtime',  '{"feature": "storage"}',                  '2023-07-15 10:15:00+00'),
(95, 27, 'regular',   '{"device": "desktop"}',                   '2023-08-10 09:00:00+00'),
(96, 27, 'overtime',  '{"feature": "dashboard"}',                '2023-08-10 09:15:00+00'),
(97, 27, 'training',  '{"endpoint": "/v1/analytics"}',           '2023-08-10 10:00:00+00'),
(98, 28, 'regular',   '{"device": "mobile"}',                    '2023-09-15 10:00:00+00'),
(99, 29, 'regular',   '{"device": "desktop"}',                   '2023-10-10 11:00:00+00'),
(100, 29, 'training', '{"endpoint": "/v1/analytics"}',           '2023-10-10 11:30:00+00'),
(101, 29, 'training', '{"endpoint": "/v1/reports"}',             '2023-10-10 12:00:00+00'),
(102, 29, 'meeting',  '{"format": "csv", "rows": 3000}',        '2023-10-10 12:30:00+00'),

-- Elena, Finn, Gina entries
(103, 30, 'regular',  '{"device": "desktop"}',                   '2023-11-10 08:00:00+00'),
(104, 30, 'overtime', '{"feature": "reports"}',                  '2023-11-10 08:15:00+00'),
(105, 31, 'regular',  '{"device": "desktop"}',                   '2023-11-25 09:00:00+00'),
(106, 32, 'regular',  '{"device": "desktop"}',                   '2023-12-10 10:00:00+00'),
(107, 32, 'overtime', '{"feature": "dashboard"}',                '2023-12-10 10:10:00+00'),
(108, 32, 'meeting',  '{"format": "csv", "rows": 600}',         '2023-12-10 10:30:00+00'),

-- More entries for time-series patterns (monthly regular entries for window function exercises)
(109,  1, 'regular',  '{"device": "desktop"}',                   '2023-06-15 10:00:00+00'),
(110,  1, 'regular',  '{"device": "desktop"}',                   '2023-07-20 10:00:00+00'),
(111,  1, 'regular',  '{"device": "desktop"}',                   '2023-08-18 10:00:00+00'),
(112,  1, 'regular',  '{"device": "desktop"}',                   '2023-09-15 10:00:00+00'),
(113,  1, 'regular',  '{"device": "desktop"}',                   '2023-10-20 10:00:00+00'),
(114,  1, 'regular',  '{"device": "desktop"}',                   '2023-11-15 10:00:00+00'),
(115,  1, 'regular',  '{"device": "desktop"}',                   '2023-12-18 10:00:00+00'),
(116,  1, 'regular',  '{"device": "desktop"}',                   '2024-01-15 10:00:00+00'),
(117,  1, 'regular',  '{"device": "desktop"}',                   '2024-02-20 10:00:00+00'),
(118,  1, 'regular',  '{"device": "desktop"}',                   '2024-03-18 10:00:00+00'),

(119,  3, 'regular',  '{"device": "desktop"}',                   '2023-06-20 09:00:00+00'),
(120,  3, 'regular',  '{"device": "desktop"}',                   '2023-07-15 09:00:00+00'),
(121,  3, 'regular',  '{"device": "desktop"}',                   '2023-08-22 09:00:00+00'),
(122,  3, 'regular',  '{"device": "desktop"}',                   '2023-09-18 09:00:00+00'),
(123,  3, 'regular',  '{"device": "desktop"}',                   '2023-10-16 09:00:00+00'),
(124,  3, 'regular',  '{"device": "desktop"}',                   '2023-11-20 09:00:00+00'),
(125,  3, 'regular',  '{"device": "desktop"}',                   '2023-12-15 09:00:00+00'),
(126,  3, 'regular',  '{"device": "desktop"}',                   '2024-01-22 09:00:00+00'),

-- Terminated employees' late entries
(127, 41, 'regular',  '{"device": "desktop"}',                   '2023-04-10 09:00:00+00'),
(128, 41, 'overtime', '{"feature": "dashboard"}',                '2023-04-10 09:10:00+00'),
(129, 42, 'regular',  '{"device": "mobile"}',                    '2023-05-25 09:00:00+00'),
(130, 43, 'regular',  '{"device": "desktop"}',                   '2023-05-01 11:00:00+00'),
(131, 44, 'regular',  '{"device": "desktop"}',                   '2023-07-25 14:00:00+00'),
(132, 44, 'overtime', '{"feature": "reports"}',                  '2023-07-25 14:15:00+00'),
(133, 45, 'regular',  '{"device": "desktop"}',                   '2023-08-15 09:00:00+00'),

-- James, Kate, Liam, Maya entries
(134, 35, 'regular',  '{"device": "desktop"}',                   '2024-02-10 08:00:00+00'),
(135, 35, 'overtime', '{"feature": "dashboard"}',                '2024-02-10 08:10:00+00'),
(136, 35, 'training', '{"endpoint": "/v1/analytics"}',           '2024-02-10 09:00:00+00'),
(137, 36, 'regular',  '{"device": "desktop"}',                   '2024-02-20 10:00:00+00'),
(138, 36, 'training', '{"endpoint": "/v1/analytics"}',           '2024-02-20 10:15:00+00'),
(139, 36, 'training', '{"endpoint": "/v1/reports"}',             '2024-02-20 10:30:00+00'),
(140, 36, 'training', '{"endpoint": "/v1/export"}',              '2024-02-20 11:00:00+00'),
(141, 37, 'regular',  '{"device": "desktop"}',                   '2024-03-10 09:00:00+00'),
(142, 38, 'regular',  '{"device": "desktop"}',                   '2024-03-25 11:00:00+00'),
(143, 38, 'overtime', '{"feature": "dashboard"}',                '2024-03-25 11:10:00+00'),

-- Junior employees' minimal activity
(144, 33, 'regular',  '{"device": "mobile"}',                    '2024-01-05 11:00:00+00'),
(145, 34, 'regular',  '{"device": "desktop"}',                   '2024-01-20 14:00:00+00'),
(146, 34, 'overtime', '{"feature": "dashboard"}',                '2024-01-20 14:10:00+00'),
(147, 39, 'regular',  '{"device": "desktop"}',                   '2024-04-10 14:00:00+00'),
(148, 40, 'regular',  '{"device": "desktop"}',                   '2024-04-20 10:00:00+00'),
(149, 40, 'overtime', '{"feature": "dashboard"}',                '2024-04-20 10:10:00+00'),

-- Extra overtime entries for analytics
(150,  1, 'overtime', '{"feature": "integrations"}',             '2023-05-22 10:00:00+00'),
(151,  3, 'overtime', '{"feature": "api_keys"}',                 '2023-04-20 09:00:00+00'),
(152,  7, 'overtime', '{"feature": "integrations"}',             '2023-08-15 08:00:00+00'),
(153,  8, 'overtime', '{"feature": "api_keys"}',                 '2023-06-15 09:15:00+00'),
(154, 10, 'overtime', '{"feature": "integrations"}',             '2023-06-10 12:00:00+00'),
(155, 17, 'overtime', '{"feature": "api_keys"}',                 '2023-07-10 11:15:00+00'),
(156, 29, 'overtime', '{"feature": "api_keys"}',                 '2023-10-10 13:00:00+00'),
(157, 36, 'overtime', '{"feature": "api_keys"}',                 '2024-02-20 11:30:00+00'),

-- Review entries (for conversion analysis)
(158,  5, 'review',   '{"from": "free", "to": "starter"}',       '2023-04-15 08:15:00+00'),
(159,  6, 'review',   '{"from": "free", "to": "starter"}',       '2023-04-20 16:20:00+00'),
(160, 13, 'review',   '{"from": "free", "to": "starter"}',       '2023-04-01 09:15:00+00'),
(161, 19, 'review',   '{"from": "free", "to": "starter"}',       '2023-08-10 09:15:00+00'),
(162, 21, 'review',   '{"from": "free", "to": "starter"}',       '2023-08-01 10:15:00+00'),
(163, 22, 'review',   '{"from": "free", "to": "starter"}',       '2023-08-15 09:15:00+00'),
(164, 23, 'review',   '{"from": "free", "to": "starter"}',       '2023-09-01 11:15:00+00'),
(165, 33, 'review',   '{"from": "free", "to": "starter"}',       '2024-01-05 11:15:00+00'),

-- Additional training entries for heavy users
(166,  3, 'training', '{"endpoint": "/v1/analytics"}',           '2023-08-22 10:00:00+00'),
(167,  3, 'training', '{"endpoint": "/v1/reports"}',             '2023-09-18 10:00:00+00'),
(168,  8, 'training', '{"endpoint": "/v1/analytics"}',           '2023-08-20 11:00:00+00'),
(169,  8, 'training', '{"endpoint": "/v1/reports"}',             '2023-11-15 09:00:00+00'),
(170, 17, 'training', '{"endpoint": "/v1/analytics"}',           '2023-10-20 10:00:00+00'),
(171, 29, 'training', '{"endpoint": "/v1/export"}',              '2024-01-25 10:00:00+00'),

-- Late 2024 entries
(172,  1, 'regular',  '{"device": "desktop"}',                   '2024-04-15 10:00:00+00'),
(173,  1, 'overtime', '{"feature": "dashboard"}',                '2024-04-15 10:10:00+00'),
(174,  3, 'regular',  '{"device": "desktop"}',                   '2024-04-15 09:00:00+00'),
(175,  3, 'training', '{"endpoint": "/v1/analytics"}',           '2024-04-15 09:30:00+00'),
(176,  7, 'regular',  '{"device": "desktop"}',                   '2024-04-20 12:00:00+00'),
(177,  8, 'regular',  '{"device": "desktop"}',                   '2024-05-10 10:00:00+00'),
(178,  8, 'training', '{"endpoint": "/v1/analytics"}',           '2024-05-10 10:15:00+00'),
(179, 17, 'regular',  '{"device": "desktop"}',                   '2024-02-05 09:00:00+00'),
(180, 17, 'training', '{"endpoint": "/v1/analytics"}',           '2024-02-05 09:30:00+00'),

-- Fill to 200 with misc entries
(181, 46, 'regular',  '{"device": "mobile"}',                    '2024-04-01 10:00:00+00'),
(182, 47, 'regular',  '{"device": "desktop"}',                   '2024-04-15 11:00:00+00'),
(183, 48, 'regular',  '{"device": "desktop"}',                   '2024-05-01 09:00:00+00'),
(184, 49, 'regular',  '{"device": "mobile"}',                    '2024-05-15 14:00:00+00'),
(185, 50, 'regular',  '{"device": "desktop"}',                   '2024-06-01 08:00:00+00'),
(186,  2, 'regular',  '{"device": "desktop"}',                   '2023-07-10 09:00:00+00'),
(187,  2, 'overtime', '{"feature": "storage"}',                  '2023-07-10 09:15:00+00'),
(188,  4, 'regular',  '{"device": "desktop"}',                   '2023-11-20 10:00:00+00'),
(189,  4, 'overtime', '{"feature": "storage"}',                  '2023-11-20 10:15:00+00'),
(190,  6, 'regular',  '{"device": "desktop"}',                   '2024-01-10 09:00:00+00'),
(191,  9, 'overtime', '{"feature": "dashboard"}',                '2023-09-25 10:15:00+00'),
(192, 10, 'regular',  '{"device": "desktop"}',                   '2024-01-05 09:00:00+00'),
(193, 16, 'regular',  '{"device": "desktop"}',                   '2024-03-10 08:00:00+00'),
(194, 18, 'overtime', '{"feature": "storage"}',                  '2023-07-20 14:15:00+00'),
(195, 20, 'overtime', '{"feature": "dashboard"}',                '2023-12-10 08:10:00+00'),
(196, 27, 'regular',  '{"device": "desktop"}',                   '2024-01-20 09:00:00+00'),
(197, 30, 'regular',  '{"device": "desktop"}',                   '2024-02-20 08:00:00+00'),
(198, 32, 'regular',  '{"device": "desktop"}',                   '2024-03-15 09:00:00+00'),
(199, 35, 'regular',  '{"device": "desktop"}',                   '2024-04-05 08:00:00+00'),
(200, 38, 'regular',  '{"device": "desktop"}',                   '2024-05-10 11:00:00+00');

SELECT setval('theme_professional.timesheet_entries_id_seq', 200);
