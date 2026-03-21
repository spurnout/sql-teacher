-- Deterministic seed data for SQL Teacher exercises
-- All data is hardcoded to ensure consistent query results for validation

-- ============================================================
-- PRODUCTS (8 rows)
-- ============================================================
INSERT INTO products (id, name, category, price_cents, created_at) VALUES
(1, 'Analytics Basic',        'analytics',     2900, '2023-01-01'),
(2, 'Analytics Pro',          'analytics',     9900, '2023-01-01'),
(3, 'Storage 100GB',          'storage',       4900, '2023-01-01'),
(4, 'Storage 1TB',            'storage',      19900, '2023-01-01'),
(5, 'Slack Integration',      'integrations',  1900, '2023-03-15'),
(6, 'Salesforce Integration', 'integrations',  4900, '2023-03-15'),
(7, 'Priority Support',       'support',       9900, '2023-06-01'),
(8, 'Enterprise Support',     'support',      29900, '2023-06-01');

SELECT setval('products_id_seq', 8);

-- ============================================================
-- USERS (50 rows — enough for meaningful queries, small enough to reason about)
-- Some users have NULL churned_at (active), some have churned
-- Some users share signup dates (for self-join exercise)
-- Some users have no orders (for LEFT JOIN exercise)
-- ============================================================
INSERT INTO users (id, email, name, plan, country, created_at, churned_at) VALUES
-- Active users, various plans
( 1, 'alice@example.com',      'Alice Martin',       'pro',        'US', '2023-01-15 10:00:00+00', NULL),
( 2, 'bob@example.com',        'Bob Chen',           'starter',    'UK', '2023-01-15 14:30:00+00', NULL),
( 3, 'carol@example.com',      'Carol Davis',        'enterprise', 'US', '2023-02-01 09:00:00+00', NULL),
( 4, 'david@example.com',      'David Kim',          'pro',        'DE', '2023-02-14 11:00:00+00', NULL),
( 5, 'emma@example.com',       'Emma Wilson',        'free',       'FR', '2023-03-01 08:00:00+00', NULL),
( 6, 'frank@example.com',      'Frank Lopez',        'starter',    'US', '2023-03-01 16:00:00+00', NULL),
( 7, 'grace@example.com',      'Grace Patel',        'pro',        'IN', '2023-03-15 12:00:00+00', NULL),
( 8, 'henry@example.com',      'Henry Brown',        'enterprise', 'UK', '2023-04-01 10:00:00+00', NULL),
( 9, 'iris@example.com',       'Iris Nakamura',      'starter',    'JP', '2023-04-15 09:00:00+00', NULL),
(10, 'jack@example.com',       'Jack Thompson',      'pro',        'AU', '2023-05-01 11:00:00+00', NULL),

-- Churned users
(11, 'karen@example.com',      'Karen Miller',       'starter',    'US', '2023-01-20 10:00:00+00', '2023-06-20 10:00:00+00'),
(12, 'leo@example.com',        'Leo Garcia',         'pro',        'BR', '2023-02-10 14:00:00+00', '2023-08-10 14:00:00+00'),
(13, 'mia@example.com',        'Mia Anderson',       'free',       'CA', '2023-03-05 09:00:00+00', '2023-05-05 09:00:00+00'),
(14, 'noah@example.com',       'Noah Taylor',        'starter',    'UK', '2023-04-01 10:00:00+00', '2023-09-01 10:00:00+00'),
(15, 'olivia@example.com',     'Olivia Martinez',    'pro',        'US', '2023-05-15 11:00:00+00', '2023-11-15 11:00:00+00'),

-- More active users
(16, 'peter@example.com',      'Peter Zhang',        'pro',        'CN', '2023-05-20 08:00:00+00', NULL),
(17, 'quinn@example.com',      'Quinn O''Brien',     'enterprise', 'IE', '2023-06-01 10:00:00+00', NULL),
(18, 'rachel@example.com',     'Rachel Santos',      'starter',    'BR', '2023-06-15 14:00:00+00', NULL),
(19, 'sam@example.com',        'Sam Johansson',      'free',       'SE', '2023-07-01 09:00:00+00', NULL),
(20, 'tina@example.com',       'Tina Dubois',        'pro',        'FR', '2023-07-15 11:00:00+00', NULL),

-- Users with NO orders (for LEFT JOIN IS NULL exercise)
(21, 'uma@example.com',        'Uma Krishnan',       'free',       'IN', '2023-08-01 10:00:00+00', NULL),
(22, 'victor@example.com',     'Victor Petrov',      'free',       'RU', '2023-08-15 09:00:00+00', NULL),
(23, 'wendy@example.com',      'Wendy Chang',        'free',       'TW', '2023-09-01 11:00:00+00', NULL),
(24, 'xander@example.com',     'Xander Muller',      'free',       'DE', '2023-09-15 14:00:00+00', NULL),
(25, 'yuki@example.com',       'Yuki Tanaka',        'free',       'JP', '2023-10-01 08:00:00+00', NULL),

-- Users who share signup dates (for self-join exercise)
-- Same date as user 1 and 2: Jan 15
-- Same date as user 5 and 6: Mar 1
-- Same date as user 8 and 14: Apr 1

-- More users for volume
(26, 'anna@example.com',       'Anna Kowalski',      'starter',    'PL', '2023-06-01 10:00:00+00', NULL),
(27, 'ben@example.com',        'Ben Okafor',         'pro',        'NG', '2023-07-01 09:00:00+00', NULL),
(28, 'clara@example.com',      'Clara Rivera',       'starter',    'MX', '2023-08-01 10:00:00+00', NULL),
(29, 'derek@example.com',      'Derek Singh',        'enterprise', 'IN', '2023-09-01 11:00:00+00', NULL),
(30, 'elena@example.com',      'Elena Volkov',       'pro',        'RU', '2023-10-01 08:00:00+00', NULL),

(31, 'finn@example.com',       'Finn Larsson',       'starter',    'SE', '2023-10-15 09:00:00+00', NULL),
(32, 'gina@example.com',       'Gina Rossi',         'pro',        'IT', '2023-11-01 10:00:00+00', NULL),
(33, 'hector@example.com',     'Hector Morales',     'free',       'AR', '2023-11-15 11:00:00+00', NULL),
(34, 'isla@example.com',       'Isla MacLeod',       'starter',    'UK', '2023-12-01 14:00:00+00', NULL),
(35, 'james@example.com',      'James Park',         'pro',        'KR', '2024-01-01 08:00:00+00', NULL),

(36, 'kate@example.com',       'Kate Nguyen',        'enterprise', 'VN', '2024-01-15 10:00:00+00', NULL),
(37, 'liam@example.com',       'Liam Fischer',       'starter',    'DE', '2024-02-01 09:00:00+00', NULL),
(38, 'maya@example.com',       'Maya Ali',           'pro',        'PK', '2024-02-15 11:00:00+00', NULL),
(39, 'nick@example.com',       'Nick Papadopoulos',  'free',       'GR', '2024-03-01 14:00:00+00', NULL),
(40, 'olivia.b@example.com',   'Olivia Bjork',       'starter',    'NO', '2024-03-15 10:00:00+00', NULL),

-- Churned users (more)
(41, 'paula@example.com',      'Paula Fernandez',    'pro',        'ES', '2023-03-01 09:00:00+00', '2023-09-01 09:00:00+00'),
(42, 'raj@example.com',        'Raj Gupta',          'starter',    'IN', '2023-04-15 09:00:00+00', '2023-10-15 09:00:00+00'),
(43, 'sara@example.com',       'Sara Eriksson',      'free',       'SE', '2023-05-01 11:00:00+00', '2023-07-01 11:00:00+00'),
(44, 'tom@example.com',        'Tom Williams',       'pro',        'AU', '2023-06-15 14:00:00+00', '2024-01-15 14:00:00+00'),
(45, 'ursula@example.com',     'Ursula Weber',       'starter',    'CH', '2023-07-01 09:00:00+00', '2024-02-01 09:00:00+00'),

-- Free users who never upgraded (no subscriptions or orders)
(46, 'val@example.com',        'Val Antonov',        'free',       'BG', '2024-04-01 10:00:00+00', NULL),
(47, 'wes@example.com',        'Wes Hoffman',        'free',       'US', '2024-04-15 11:00:00+00', NULL),
(48, 'xena@example.com',       'Xena Christou',      'free',       'CY', '2024-05-01 09:00:00+00', NULL),
(49, 'yves@example.com',       'Yves Dupont',        'free',       'FR', '2024-05-15 14:00:00+00', NULL),
(50, 'zara@example.com',       'Zara Osei',          'free',       'GH', '2024-06-01 08:00:00+00', NULL);

SELECT setval('users_id_seq', 50);

-- ============================================================
-- ORDERS (80 rows)
-- Users 21-25 and 46-50 have NO orders (for LEFT JOIN exercise)
-- ============================================================
INSERT INTO orders (id, user_id, total_cents, status, created_at) VALUES
-- Alice (user 1) — 4 orders
( 1,  1, 12800, 'completed', '2023-02-10 10:00:00+00'),
( 2,  1,  9900, 'completed', '2023-05-22 14:00:00+00'),
( 3,  1, 24800, 'completed', '2023-09-15 11:00:00+00'),
( 4,  1,  4900, 'refunded',  '2023-12-01 09:00:00+00'),

-- Bob (user 2) — 2 orders
( 5,  2,  2900, 'completed', '2023-02-20 09:00:00+00'),
( 6,  2,  6800, 'completed', '2023-07-10 15:00:00+00'),

-- Carol (user 3) — 5 orders (high-value enterprise customer)
( 7,  3, 39800, 'completed', '2023-02-15 10:00:00+00'),
( 8,  3, 29900, 'completed', '2023-04-20 11:00:00+00'),
( 9,  3, 34800, 'completed', '2023-07-12 14:00:00+00'),
(10,  3, 49800, 'completed', '2023-10-05 09:00:00+00'),
(11,  3, 29900, 'completed', '2024-01-15 10:00:00+00'),

-- David (user 4) — 3 orders
(12,  4,  9900, 'completed', '2023-03-10 11:00:00+00'),
(13,  4, 14800, 'completed', '2023-06-25 14:00:00+00'),
(14,  4,  4900, 'pending',   '2023-11-20 09:00:00+00'),

-- Emma (user 5) — 1 order
(15,  5,  2900, 'completed', '2023-04-15 08:00:00+00'),

-- Frank (user 6) — 2 orders
(16,  6,  7800, 'completed', '2023-04-20 16:00:00+00'),
(17,  6,  4900, 'completed', '2023-08-10 10:00:00+00'),

-- Grace (user 7) — 3 orders
(18,  7, 14800, 'completed', '2023-04-25 12:00:00+00'),
(19,  7,  9900, 'completed', '2023-08-15 09:00:00+00'),
(20,  7, 19800, 'completed', '2024-01-10 14:00:00+00'),

-- Henry (user 8) — 4 orders
(21,  8, 39800, 'completed', '2023-05-10 10:00:00+00'),
(22,  8, 29900, 'completed', '2023-08-20 11:00:00+00'),
(23,  8, 49800, 'completed', '2023-11-15 14:00:00+00'),
(24,  8, 29900, 'refunded',  '2024-02-10 09:00:00+00'),

-- Iris (user 9) — 2 orders
(25,  9,  4900, 'completed', '2023-05-20 09:00:00+00'),
(26,  9,  2900, 'completed', '2023-09-25 14:00:00+00'),

-- Jack (user 10) — 3 orders
(27, 10, 12800, 'completed', '2023-06-10 11:00:00+00'),
(28, 10,  9900, 'completed', '2023-09-20 10:00:00+00'),
(29, 10,  4900, 'completed', '2024-01-05 14:00:00+00'),

-- Karen (user 11, churned) — 2 orders before churn
(30, 11,  2900, 'completed', '2023-02-25 10:00:00+00'),
(31, 11,  4900, 'completed', '2023-05-15 11:00:00+00'),

-- Leo (user 12, churned) — 3 orders
(32, 12, 14800, 'completed', '2023-03-20 14:00:00+00'),
(33, 12,  9900, 'completed', '2023-06-10 09:00:00+00'),
(34, 12,  4900, 'refunded',  '2023-07-25 11:00:00+00'),

-- Mia (user 13, churned) — 1 order
(35, 13,  2900, 'completed', '2023-04-01 09:00:00+00'),

-- Noah (user 14, churned) — 2 orders
(36, 14,  7800, 'completed', '2023-05-10 10:00:00+00'),
(37, 14,  4900, 'completed', '2023-08-01 14:00:00+00'),

-- Olivia (user 15, churned) — 2 orders
(38, 15, 14800, 'completed', '2023-06-20 11:00:00+00'),
(39, 15,  9900, 'completed', '2023-09-15 09:00:00+00'),

-- Peter (user 16) — 2 orders
(40, 16,  9900, 'completed', '2023-06-25 08:00:00+00'),
(41, 16, 19800, 'completed', '2023-10-15 14:00:00+00'),

-- Quinn (user 17) — 3 orders
(42, 17, 39800, 'completed', '2023-07-10 10:00:00+00'),
(43, 17, 29900, 'completed', '2023-10-20 11:00:00+00'),
(44, 17, 49800, 'completed', '2024-02-05 09:00:00+00'),

-- Rachel (user 18) — 1 order
(45, 18,  4900, 'completed', '2023-07-20 14:00:00+00'),

-- Sam (user 19) — 1 order
(46, 19,  2900, 'completed', '2023-08-10 09:00:00+00'),

-- Tina (user 20) — 2 orders
(47, 20, 14800, 'completed', '2023-08-25 11:00:00+00'),
(48, 20,  9900, 'completed', '2023-12-10 14:00:00+00'),

-- Anna (user 26) — 2 orders
(49, 26,  4900, 'completed', '2023-07-15 10:00:00+00'),
(50, 26,  7800, 'completed', '2023-11-20 09:00:00+00'),

-- Ben (user 27) — 2 orders
(51, 27, 12800, 'completed', '2023-08-10 09:00:00+00'),
(52, 27,  9900, 'completed', '2024-01-20 14:00:00+00'),

-- Clara (user 28) — 1 order
(53, 28,  4900, 'completed', '2023-09-15 10:00:00+00'),

-- Derek (user 29) — 3 orders
(54, 29, 39800, 'completed', '2023-10-10 11:00:00+00'),
(55, 29, 29900, 'completed', '2024-01-25 09:00:00+00'),
(56, 29, 19800, 'completed', '2024-03-10 14:00:00+00'),

-- Elena (user 30) — 2 orders
(57, 30,  9900, 'completed', '2023-11-10 08:00:00+00'),
(58, 30, 14800, 'completed', '2024-02-20 10:00:00+00'),

-- Finn (user 31) — 1 order
(59, 31,  4900, 'completed', '2023-11-25 09:00:00+00'),

-- Gina (user 32) — 2 orders
(60, 32, 12800, 'completed', '2023-12-10 10:00:00+00'),
(61, 32,  9900, 'completed', '2024-03-15 11:00:00+00'),

-- Hector (user 33) — 1 order
(62, 33,  2900, 'completed', '2024-01-05 11:00:00+00'),

-- Isla (user 34) — 1 order
(63, 34,  7800, 'completed', '2024-01-20 14:00:00+00'),

-- James (user 35) — 2 orders
(64, 35, 14800, 'completed', '2024-02-10 08:00:00+00'),
(65, 35,  9900, 'completed', '2024-04-05 10:00:00+00'),

-- Kate (user 36) — 2 orders
(66, 36, 49800, 'completed', '2024-02-20 10:00:00+00'),
(67, 36, 29900, 'completed', '2024-05-10 09:00:00+00'),

-- Liam (user 37) — 1 order
(68, 37,  4900, 'completed', '2024-03-10 09:00:00+00'),

-- Maya (user 38) — 1 order
(69, 38, 12800, 'completed', '2024-03-25 11:00:00+00'),

-- Paula (user 41, churned) — 1 order
(70, 41,  9900, 'completed', '2023-04-10 09:00:00+00'),

-- Raj (user 42, churned) — 1 order
(71, 42,  4900, 'completed', '2023-05-25 09:00:00+00'),

-- Tom (user 44, churned) — 2 orders
(72, 44, 14800, 'completed', '2023-07-25 14:00:00+00'),
(73, 44,  9900, 'completed', '2023-11-10 10:00:00+00'),

-- Ursula (user 45, churned) — 1 order
(74, 45,  4900, 'completed', '2023-08-15 09:00:00+00'),

-- Nick (user 39) — 1 small order
(75, 39,  2900, 'pending',   '2024-04-10 14:00:00+00'),

-- Olivia B (user 40) — 1 order
(76, 40,  7800, 'completed', '2024-04-20 10:00:00+00'),

-- Extra orders for time-series analysis
(77,  1, 14800, 'completed', '2024-03-10 10:00:00+00'),
(78,  3, 39800, 'completed', '2024-04-15 11:00:00+00'),
(79,  7, 12800, 'completed', '2024-04-20 14:00:00+00'),
(80,  8, 49800, 'completed', '2024-05-10 09:00:00+00');

SELECT setval('orders_id_seq', 80);

-- ============================================================
-- ORDER_ITEMS (120 rows — each order has 1-3 line items)
-- ============================================================
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_cents) VALUES
-- Alice orders
( 1,  1, 1, 1,  2900), ( 2,  1, 3, 1,  4900), ( 3,  1, 5, 1,  1900),  -- order 1: analytics basic + storage + slack
( 4,  2, 2, 1,  9900),                                                   -- order 2: analytics pro
( 5,  3, 2, 1,  9900), ( 6,  3, 4, 1, 19900),                           -- order 3: analytics pro + storage 1TB
( 7,  4, 3, 1,  4900),                                                   -- order 4: storage 100GB (refunded)

-- Bob orders
( 8,  5, 1, 1,  2900),                                                   -- order 5: analytics basic
( 9,  6, 1, 1,  2900), (10,  6, 5, 1,  1900),                           -- order 6: analytics basic + slack

-- Carol orders (enterprise, high-value)
(11,  7, 2, 1,  9900), (12,  7, 4, 1, 19900), (13,  7, 8, 1, 29900),   -- order 7: analytics pro + storage 1TB + enterprise support
(14,  8, 8, 1, 29900),                                                   -- order 8: enterprise support renewal
(15,  9, 2, 1,  9900), (16,  9, 6, 1,  4900), (17,  9, 4, 1, 19900),   -- order 9: analytics pro + salesforce + storage 1TB
(18, 10, 8, 1, 29900), (19, 10, 4, 1, 19900),                           -- order 10: enterprise support + storage 1TB
(20, 11, 8, 1, 29900),                                                   -- order 11: enterprise support renewal

-- David orders
(21, 12, 2, 1,  9900),                                                   -- order 12: analytics pro
(22, 13, 2, 1,  9900), (23, 13, 3, 1,  4900),                           -- order 13: analytics pro + storage
(24, 14, 3, 1,  4900),                                                   -- order 14: storage (pending)

-- Emma order
(25, 15, 1, 1,  2900),                                                   -- order 15: analytics basic

-- Frank orders
(26, 16, 1, 1,  2900), (27, 16, 3, 1,  4900),                           -- order 16: analytics basic + storage
(28, 17, 3, 1,  4900),                                                   -- order 17: storage

-- Grace orders
(29, 18, 2, 1,  9900), (30, 18, 3, 1,  4900),                           -- order 18: analytics pro + storage
(31, 19, 2, 1,  9900),                                                   -- order 19: analytics pro
(32, 20, 2, 1,  9900), (33, 20, 4, 1, 19900),                           -- order 20: analytics pro + storage 1TB

-- Henry orders (enterprise)
(34, 21, 2, 1,  9900), (35, 21, 8, 1, 29900),                           -- order 21: analytics pro + enterprise support
(36, 22, 8, 1, 29900),                                                   -- order 22: enterprise support
(37, 23, 8, 1, 29900), (38, 23, 4, 1, 19900),                           -- order 23: enterprise support + storage 1TB
(39, 24, 8, 1, 29900),                                                   -- order 24: enterprise support (refunded)

-- Iris orders
(40, 25, 3, 1,  4900),                                                   -- order 25: storage
(41, 26, 1, 1,  2900),                                                   -- order 26: analytics basic

-- Jack orders
(42, 27, 2, 1,  9900), (43, 27, 5, 1,  1900),                           -- order 27: analytics pro + slack
(44, 28, 2, 1,  9900),                                                   -- order 28: analytics pro
(45, 29, 3, 1,  4900),                                                   -- order 29: storage

-- Karen (churned) orders
(46, 30, 1, 1,  2900),                                                   -- order 30: analytics basic
(47, 31, 3, 1,  4900),                                                   -- order 31: storage

-- Leo (churned) orders
(48, 32, 2, 1,  9900), (49, 32, 3, 1,  4900),                           -- order 32: analytics pro + storage
(50, 33, 2, 1,  9900),                                                   -- order 33: analytics pro
(51, 34, 3, 1,  4900),                                                   -- order 34: storage (refunded)

-- Mia (churned) order
(52, 35, 1, 1,  2900),                                                   -- order 35: analytics basic

-- Noah (churned) orders
(53, 36, 1, 1,  2900), (54, 36, 3, 1,  4900),                           -- order 36: analytics basic + storage
(55, 37, 3, 1,  4900),                                                   -- order 37: storage

-- Olivia (churned) orders
(56, 38, 2, 1,  9900), (57, 38, 3, 1,  4900),                           -- order 38: analytics pro + storage
(58, 39, 2, 1,  9900),                                                   -- order 39: analytics pro

-- Peter orders
(59, 40, 2, 1,  9900),                                                   -- order 40: analytics pro
(60, 41, 2, 1,  9900), (61, 41, 4, 1, 19900),                           -- order 41: analytics pro + storage 1TB

-- Quinn orders (enterprise)
(62, 42, 2, 1,  9900), (63, 42, 8, 1, 29900),                           -- order 42: analytics pro + enterprise support
(64, 43, 8, 1, 29900),                                                   -- order 43: enterprise support
(65, 44, 8, 1, 29900), (66, 44, 4, 1, 19900),                           -- order 44: enterprise support + storage 1TB

-- Rachel, Sam, Tina
(67, 45, 3, 1,  4900),                                                   -- order 45: storage
(68, 46, 1, 1,  2900),                                                   -- order 46: analytics basic
(69, 47, 2, 1,  9900), (70, 47, 5, 1,  1900),                           -- order 47: analytics pro + slack
(71, 48, 2, 1,  9900),                                                   -- order 48: analytics pro

-- Anna, Ben, Clara, Derek, Elena, Finn, Gina, Hector, Isla, James, Kate, Liam, Maya
(72, 49, 3, 1,  4900),                                                   -- Anna order 1
(73, 50, 1, 1,  2900), (74, 50, 3, 1,  4900),                           -- Anna order 2
(75, 51, 2, 1,  9900), (76, 51, 5, 1,  1900),                           -- Ben order 1
(77, 52, 2, 1,  9900),                                                   -- Ben order 2
(78, 53, 3, 1,  4900),                                                   -- Clara order
(79, 54, 2, 1,  9900), (80, 54, 8, 1, 29900),                           -- Derek order 1
(81, 55, 8, 1, 29900),                                                   -- Derek order 2
(82, 56, 4, 1, 19900),                                                   -- Derek order 3
(83, 57, 2, 1,  9900),                                                   -- Elena order 1
(84, 58, 2, 1,  9900), (85, 58, 3, 1,  4900),                           -- Elena order 2
(86, 59, 3, 1,  4900),                                                   -- Finn order
(87, 60, 2, 1,  9900), (88, 60, 5, 1,  1900),                           -- Gina order 1
(89, 61, 2, 1,  9900),                                                   -- Gina order 2
(90, 62, 1, 1,  2900),                                                   -- Hector order
(91, 63, 1, 1,  2900), (92, 63, 3, 1,  4900),                           -- Isla order
(93, 64, 2, 1,  9900), (94, 64, 3, 1,  4900),                           -- James order 1
(95, 65, 2, 1,  9900),                                                   -- James order 2
(96, 66, 8, 1, 29900), (97, 66, 4, 1, 19900),                           -- Kate order 1
(98, 67, 8, 1, 29900),                                                   -- Kate order 2
(99, 68, 3, 1,  4900),                                                   -- Liam order
(100, 69, 2, 1, 9900), (101, 69, 5, 1, 1900),                           -- Maya order

-- Churned users' orders
(102, 70, 2, 1,  9900),                                                  -- Paula order
(103, 71, 3, 1,  4900),                                                  -- Raj order
(104, 72, 2, 1,  9900), (105, 72, 3, 1,  4900),                         -- Tom order 1
(106, 73, 2, 1,  9900),                                                  -- Tom order 2
(107, 74, 3, 1,  4900),                                                  -- Ursula order

-- Nick (pending), Olivia B
(108, 75, 1, 1,  2900),                                                  -- Nick order (pending)
(109, 76, 1, 1,  2900), (110, 76, 3, 1, 4900),                          -- Olivia B order

-- Extra time-series orders
(111, 77, 2, 1,  9900), (112, 77, 3, 1, 4900),                          -- Alice extra
(113, 78, 2, 1,  9900), (114, 78, 8, 1, 29900),                         -- Carol extra
(115, 79, 2, 1,  9900), (116, 79, 5, 1, 1900),                          -- Grace extra
(117, 80, 8, 1, 29900), (118, 80, 4, 1, 19900);                         -- Henry extra

SELECT setval('order_items_id_seq', 118);

-- ============================================================
-- SUBSCRIPTIONS (60 rows)
-- ============================================================
INSERT INTO subscriptions (id, user_id, product_id, status, started_at, cancelled_at, mrr_cents) VALUES
-- Active subscriptions
( 1,  1, 2, 'active',    '2023-02-10', NULL,          9900),  -- Alice: Analytics Pro
( 2,  1, 4, 'active',    '2023-09-15', NULL,         19900),  -- Alice: Storage 1TB
( 3,  2, 1, 'active',    '2023-02-20', NULL,          2900),  -- Bob: Analytics Basic
( 4,  3, 2, 'active',    '2023-02-15', NULL,          9900),  -- Carol: Analytics Pro
( 5,  3, 8, 'active',    '2023-02-15', NULL,         29900),  -- Carol: Enterprise Support
( 6,  3, 4, 'active',    '2023-07-12', NULL,         19900),  -- Carol: Storage 1TB
( 7,  4, 2, 'active',    '2023-03-10', NULL,          9900),  -- David: Analytics Pro
( 8,  6, 1, 'active',    '2023-04-20', NULL,          2900),  -- Frank: Analytics Basic
( 9,  7, 2, 'active',    '2023-04-25', NULL,          9900),  -- Grace: Analytics Pro
(10,  8, 2, 'active',    '2023-05-10', NULL,          9900),  -- Henry: Analytics Pro
(11,  8, 8, 'active',    '2023-05-10', NULL,         29900),  -- Henry: Enterprise Support
(12, 10, 2, 'active',    '2023-06-10', NULL,          9900),  -- Jack: Analytics Pro
(13, 16, 2, 'active',    '2023-06-25', NULL,          9900),  -- Peter: Analytics Pro
(14, 17, 2, 'active',    '2023-07-10', NULL,          9900),  -- Quinn: Analytics Pro
(15, 17, 8, 'active',    '2023-07-10', NULL,         29900),  -- Quinn: Enterprise Support
(16, 20, 2, 'active',    '2023-08-25', NULL,          9900),  -- Tina: Analytics Pro
(17, 27, 2, 'active',    '2023-08-10', NULL,          9900),  -- Ben: Analytics Pro
(18, 29, 2, 'active',    '2023-10-10', NULL,          9900),  -- Derek: Analytics Pro
(19, 29, 8, 'active',    '2023-10-10', NULL,         29900),  -- Derek: Enterprise Support
(20, 30, 2, 'active',    '2023-11-10', NULL,          9900),  -- Elena: Analytics Pro
(21, 32, 2, 'active',    '2023-12-10', NULL,          9900),  -- Gina: Analytics Pro
(22, 35, 2, 'active',    '2024-02-10', NULL,          9900),  -- James: Analytics Pro
(23, 36, 8, 'active',    '2024-02-20', NULL,         29900),  -- Kate: Enterprise Support
(24, 36, 4, 'active',    '2024-02-20', NULL,         19900),  -- Kate: Storage 1TB
(25, 38, 2, 'active',    '2024-03-25', NULL,          9900),  -- Maya: Analytics Pro

-- Cancelled subscriptions (churned users)
(26, 11, 1, 'cancelled', '2023-02-25', '2023-06-20',  0),     -- Karen: Analytics Basic (churned)
(27, 12, 2, 'cancelled', '2023-03-20', '2023-08-10',  0),     -- Leo: Analytics Pro (churned)
(28, 13, 1, 'cancelled', '2023-04-01', '2023-05-05',  0),     -- Mia: Analytics Basic (churned)
(29, 14, 1, 'cancelled', '2023-05-10', '2023-09-01',  0),     -- Noah: Analytics Basic (churned)
(30, 15, 2, 'cancelled', '2023-06-20', '2023-11-15',  0),     -- Olivia: Analytics Pro (churned)
(31, 41, 2, 'cancelled', '2023-04-10', '2023-09-01',  0),     -- Paula: Analytics Pro (churned)
(32, 42, 3, 'cancelled', '2023-05-25', '2023-10-15',  0),     -- Raj: Storage (churned)
(33, 43, 1, 'cancelled', '2023-05-01', '2023-07-01',  0),     -- Sara: Analytics Basic (churned)
(34, 44, 2, 'cancelled', '2023-07-25', '2024-01-15',  0),     -- Tom: Analytics Pro (churned)
(35, 45, 3, 'cancelled', '2023-08-15', '2024-02-01',  0),     -- Ursula: Storage (churned)

-- Trialing subscriptions (newer users)
(36, 37, 1, 'trialing',  '2024-03-10', NULL,          0),     -- Liam: Analytics Basic (trial)
(37, 39, 1, 'trialing',  '2024-04-10', NULL,          0),     -- Nick: Analytics Basic (trial)
(38, 40, 1, 'trialing',  '2024-04-20', NULL,          0),     -- Olivia B: Analytics Basic (trial)

-- Past due
(39,  9, 1, 'past_due',  '2023-05-20', NULL,          2900),  -- Iris: Analytics Basic (past due)
(40, 18, 3, 'past_due',  '2023-07-20', NULL,          4900),  -- Rachel: Storage (past due)

-- More active subs for data volume
(41,  1, 5, 'active',    '2023-05-22', NULL,          1900),  -- Alice: Slack
(42,  7, 3, 'active',    '2023-04-25', NULL,          4900),  -- Grace: Storage
(43, 10, 5, 'active',    '2023-06-10', NULL,          1900),  -- Jack: Slack
(44,  2, 5, 'active',    '2023-07-10', NULL,          1900),  -- Bob: Slack
(45,  6, 3, 'active',    '2023-04-20', NULL,          4900),  -- Frank: Storage
(46, 20, 5, 'active',    '2023-08-25', NULL,          1900),  -- Tina: Slack
(47, 26, 3, 'active',    '2023-07-15', NULL,          4900),  -- Anna: Storage
(48, 28, 3, 'active',    '2023-09-15', NULL,          4900),  -- Clara: Storage
(49, 31, 3, 'active',    '2023-11-25', NULL,          4900),  -- Finn: Storage
(50, 34, 1, 'active',    '2024-01-20', NULL,          2900),  -- Isla: Analytics Basic

-- Upgraded subscriptions (had basic, now pro)
(51,  4, 1, 'cancelled', '2023-03-10', '2023-06-25',  0),     -- David: had Basic, cancelled when upgraded
(52,  4, 3, 'active',    '2023-06-25', NULL,          4900),  -- David: Storage
(53, 16, 4, 'active',    '2023-10-15', NULL,         19900),  -- Peter: Storage 1TB (added later)
(54,  8, 4, 'active',    '2023-11-15', NULL,         19900),  -- Henry: Storage 1TB (added later)
(55, 32, 5, 'active',    '2023-12-10', NULL,          1900),  -- Gina: Slack
(56, 35, 3, 'active',    '2024-02-10', NULL,          4900),  -- James: Storage
(57, 38, 5, 'active',    '2024-03-25', NULL,          1900),  -- Maya: Slack
(58, 27, 5, 'active',    '2023-08-10', NULL,          1900),  -- Ben: Slack
(59, 30, 3, 'active',    '2023-11-10', NULL,          4900),  -- Elena: Storage
(60, 17, 4, 'active',    '2023-10-20', NULL,         19900);  -- Quinn: Storage 1TB

SELECT setval('subscriptions_id_seq', 60);

-- ============================================================
-- EVENTS (200 rows — representative sample for queries)
-- ============================================================
INSERT INTO events (id, user_id, event_type, properties, occurred_at) VALUES
-- Alice events (user 1)
( 1,  1, 'login',        '{"device": "desktop"}',                   '2023-02-10 10:05:00+00'),
( 2,  1, 'feature_used', '{"feature": "dashboard"}',                '2023-02-10 10:15:00+00'),
( 3,  1, 'feature_used', '{"feature": "reports"}',                  '2023-02-10 11:00:00+00'),
( 4,  1, 'export',       '{"format": "csv", "rows": 1500}',        '2023-02-10 11:30:00+00'),
( 5,  1, 'login',        '{"device": "mobile"}',                    '2023-03-15 08:00:00+00'),
( 6,  1, 'feature_used', '{"feature": "dashboard"}',                '2023-03-15 08:10:00+00'),
( 7,  1, 'api_call',     '{"endpoint": "/v1/analytics"}',           '2023-04-20 14:00:00+00'),
( 8,  1, 'api_call',     '{"endpoint": "/v1/reports"}',             '2023-04-20 14:30:00+00'),
( 9,  1, 'login',        '{"device": "desktop"}',                   '2023-05-22 09:00:00+00'),
(10,  1, 'upgrade_prompt_shown', '{"from": "starter", "to": "pro"}','2023-05-22 09:15:00+00'),

-- Bob events (user 2)
(11,  2, 'login',        '{"device": "desktop"}',                   '2023-02-20 09:00:00+00'),
(12,  2, 'feature_used', '{"feature": "dashboard"}',                '2023-02-20 09:10:00+00'),
(13,  2, 'login',        '{"device": "desktop"}',                   '2023-03-10 10:00:00+00'),
(14,  2, 'feature_used', '{"feature": "reports"}',                  '2023-03-10 10:30:00+00'),
(15,  2, 'export',       '{"format": "pdf", "rows": 200}',         '2023-03-10 11:00:00+00'),

-- Carol events (user 3 — heavy user)
(16,  3, 'login',        '{"device": "desktop"}',                   '2023-02-15 09:00:00+00'),
(17,  3, 'feature_used', '{"feature": "dashboard"}',                '2023-02-15 09:10:00+00'),
(18,  3, 'api_call',     '{"endpoint": "/v1/analytics"}',           '2023-02-15 10:00:00+00'),
(19,  3, 'api_call',     '{"endpoint": "/v1/reports"}',             '2023-02-15 10:30:00+00'),
(20,  3, 'api_call',     '{"endpoint": "/v1/export"}',              '2023-02-15 11:00:00+00'),
(21,  3, 'login',        '{"device": "desktop"}',                   '2023-03-20 09:00:00+00'),
(22,  3, 'feature_used', '{"feature": "integrations"}',             '2023-03-20 09:30:00+00'),
(23,  3, 'login',        '{"device": "mobile"}',                    '2023-04-20 08:00:00+00'),
(24,  3, 'api_call',     '{"endpoint": "/v1/analytics"}',           '2023-05-10 14:00:00+00'),
(25,  3, 'export',       '{"format": "csv", "rows": 5000}',        '2023-05-10 14:30:00+00'),

-- David events (user 4)
(26,  4, 'login',        '{"device": "desktop"}',                   '2023-03-10 11:00:00+00'),
(27,  4, 'feature_used', '{"feature": "dashboard"}',                '2023-03-10 11:15:00+00'),
(28,  4, 'upgrade_prompt_shown', '{"from": "starter", "to": "pro"}','2023-03-10 11:30:00+00'),
(29,  4, 'login',        '{"device": "desktop"}',                   '2023-06-25 09:00:00+00'),
(30,  4, 'feature_used', '{"feature": "reports"}',                  '2023-06-25 09:30:00+00'),

-- Emma events (user 5 — light user)
(31,  5, 'login',        '{"device": "mobile"}',                    '2023-04-15 08:00:00+00'),
(32,  5, 'feature_used', '{"feature": "dashboard"}',                '2023-04-15 08:10:00+00'),

-- Frank events (user 6)
(33,  6, 'login',        '{"device": "desktop"}',                   '2023-04-20 16:00:00+00'),
(34,  6, 'feature_used', '{"feature": "dashboard"}',                '2023-04-20 16:15:00+00'),
(35,  6, 'feature_used', '{"feature": "storage"}',                  '2023-04-20 16:30:00+00'),
(36,  6, 'login',        '{"device": "desktop"}',                   '2023-08-10 09:00:00+00'),

-- Grace events (user 7)
(37,  7, 'login',        '{"device": "desktop"}',                   '2023-04-25 12:00:00+00'),
(38,  7, 'feature_used', '{"feature": "dashboard"}',                '2023-04-25 12:10:00+00'),
(39,  7, 'feature_used', '{"feature": "reports"}',                  '2023-04-25 12:30:00+00'),
(40,  7, 'export',       '{"format": "csv", "rows": 800}',         '2023-04-25 13:00:00+00'),
(41,  7, 'login',        '{"device": "mobile"}',                    '2023-08-15 07:00:00+00'),
(42,  7, 'api_call',     '{"endpoint": "/v1/analytics"}',           '2023-08-15 07:30:00+00'),

-- Henry events (user 8 — enterprise, heavy API)
(43,  8, 'login',        '{"device": "desktop"}',                   '2023-05-10 10:00:00+00'),
(44,  8, 'api_call',     '{"endpoint": "/v1/analytics"}',           '2023-05-10 10:15:00+00'),
(45,  8, 'api_call',     '{"endpoint": "/v1/reports"}',             '2023-05-10 10:30:00+00'),
(46,  8, 'api_call',     '{"endpoint": "/v1/export"}',              '2023-05-10 11:00:00+00'),
(47,  8, 'api_call',     '{"endpoint": "/v1/analytics"}',           '2023-06-15 09:00:00+00'),
(48,  8, 'api_call',     '{"endpoint": "/v1/analytics"}',           '2023-07-20 14:00:00+00'),
(49,  8, 'login',        '{"device": "desktop"}',                   '2023-08-20 10:00:00+00'),
(50,  8, 'export',       '{"format": "json", "rows": 10000}',      '2023-08-20 10:30:00+00'),

-- Iris events (user 9)
(51,  9, 'login',        '{"device": "desktop"}',                   '2023-05-20 09:00:00+00'),
(52,  9, 'feature_used', '{"feature": "dashboard"}',                '2023-05-20 09:15:00+00'),
(53,  9, 'login',        '{"device": "desktop"}',                   '2023-09-25 10:00:00+00'),

-- Jack events (user 10)
(54, 10, 'login',        '{"device": "desktop"}',                   '2023-06-10 11:00:00+00'),
(55, 10, 'feature_used', '{"feature": "dashboard"}',                '2023-06-10 11:10:00+00'),
(56, 10, 'feature_used', '{"feature": "reports"}',                  '2023-06-10 11:30:00+00'),
(57, 10, 'login',        '{"device": "mobile"}',                    '2023-09-20 08:00:00+00'),
(58, 10, 'export',       '{"format": "csv", "rows": 500}',         '2023-09-20 08:30:00+00'),

-- Karen events (user 11, churned)
(59, 11, 'login',        '{"device": "desktop"}',                   '2023-02-25 10:00:00+00'),
(60, 11, 'feature_used', '{"feature": "dashboard"}',                '2023-02-25 10:10:00+00'),
(61, 11, 'login',        '{"device": "desktop"}',                   '2023-05-15 09:00:00+00'),
(62, 11, 'upgrade_prompt_shown', '{"from": "starter", "to": "pro"}','2023-05-15 09:30:00+00'),

-- Leo events (user 12, churned)
(63, 12, 'login',        '{"device": "desktop"}',                   '2023-03-20 14:00:00+00'),
(64, 12, 'feature_used', '{"feature": "reports"}',                  '2023-03-20 14:30:00+00'),
(65, 12, 'login',        '{"device": "desktop"}',                   '2023-06-10 09:00:00+00'),
(66, 12, 'feature_used', '{"feature": "dashboard"}',                '2023-06-10 09:15:00+00'),

-- More users' events
(67, 13, 'login',        '{"device": "mobile"}',                    '2023-04-01 09:00:00+00'),
(68, 14, 'login',        '{"device": "desktop"}',                   '2023-05-10 10:00:00+00'),
(69, 14, 'feature_used', '{"feature": "dashboard"}',                '2023-05-10 10:15:00+00'),
(70, 15, 'login',        '{"device": "desktop"}',                   '2023-06-20 11:00:00+00'),
(71, 15, 'feature_used', '{"feature": "reports"}',                  '2023-06-20 11:30:00+00'),
(72, 15, 'export',       '{"format": "csv", "rows": 300}',         '2023-06-20 12:00:00+00'),

-- Peter events (user 16)
(73, 16, 'login',        '{"device": "desktop"}',                   '2023-06-25 08:00:00+00'),
(74, 16, 'feature_used', '{"feature": "dashboard"}',                '2023-06-25 08:10:00+00'),
(75, 16, 'api_call',     '{"endpoint": "/v1/analytics"}',           '2023-10-15 09:00:00+00'),

-- Quinn events (user 17 — enterprise)
(76, 17, 'login',        '{"device": "desktop"}',                   '2023-07-10 10:00:00+00'),
(77, 17, 'api_call',     '{"endpoint": "/v1/analytics"}',           '2023-07-10 10:30:00+00'),
(78, 17, 'api_call',     '{"endpoint": "/v1/reports"}',             '2023-07-10 11:00:00+00'),
(79, 17, 'login',        '{"device": "desktop"}',                   '2023-10-20 09:00:00+00'),
(80, 17, 'export',       '{"format": "json", "rows": 8000}',       '2023-10-20 09:30:00+00'),

-- Rachel, Sam, Tina events
(81, 18, 'login',        '{"device": "mobile"}',                    '2023-07-20 14:00:00+00'),
(82, 19, 'login',        '{"device": "desktop"}',                   '2023-08-10 09:00:00+00'),
(83, 19, 'feature_used', '{"feature": "dashboard"}',                '2023-08-10 09:10:00+00'),
(84, 20, 'login',        '{"device": "desktop"}',                   '2023-08-25 11:00:00+00'),
(85, 20, 'feature_used', '{"feature": "reports"}',                  '2023-08-25 11:15:00+00'),
(86, 20, 'login',        '{"device": "mobile"}',                    '2023-12-10 08:00:00+00'),

-- Users 21-25 (no orders, light activity)
(87, 21, 'login',        '{"device": "mobile"}',                    '2023-08-01 10:00:00+00'),
(88, 22, 'login',        '{"device": "desktop"}',                   '2023-08-15 09:00:00+00'),
(89, 23, 'login',        '{"device": "desktop"}',                   '2023-09-01 11:00:00+00'),
(90, 23, 'feature_used', '{"feature": "dashboard"}',                '2023-09-01 11:10:00+00'),
(91, 24, 'login',        '{"device": "mobile"}',                    '2023-09-15 14:00:00+00'),
(92, 25, 'login',        '{"device": "desktop"}',                   '2023-10-01 08:00:00+00'),

-- Anna, Ben, Clara, Derek events
(93, 26, 'login',        '{"device": "desktop"}',                   '2023-07-15 10:00:00+00'),
(94, 26, 'feature_used', '{"feature": "storage"}',                  '2023-07-15 10:15:00+00'),
(95, 27, 'login',        '{"device": "desktop"}',                   '2023-08-10 09:00:00+00'),
(96, 27, 'feature_used', '{"feature": "dashboard"}',                '2023-08-10 09:15:00+00'),
(97, 27, 'api_call',     '{"endpoint": "/v1/analytics"}',           '2023-08-10 10:00:00+00'),
(98, 28, 'login',        '{"device": "mobile"}',                    '2023-09-15 10:00:00+00'),
(99, 29, 'login',        '{"device": "desktop"}',                   '2023-10-10 11:00:00+00'),
(100, 29, 'api_call',    '{"endpoint": "/v1/analytics"}',           '2023-10-10 11:30:00+00'),
(101, 29, 'api_call',    '{"endpoint": "/v1/reports"}',             '2023-10-10 12:00:00+00'),
(102, 29, 'export',      '{"format": "csv", "rows": 3000}',        '2023-10-10 12:30:00+00'),

-- Elena, Finn, Gina events
(103, 30, 'login',       '{"device": "desktop"}',                   '2023-11-10 08:00:00+00'),
(104, 30, 'feature_used','{"feature": "reports"}',                  '2023-11-10 08:15:00+00'),
(105, 31, 'login',       '{"device": "desktop"}',                   '2023-11-25 09:00:00+00'),
(106, 32, 'login',       '{"device": "desktop"}',                   '2023-12-10 10:00:00+00'),
(107, 32, 'feature_used','{"feature": "dashboard"}',                '2023-12-10 10:10:00+00'),
(108, 32, 'export',      '{"format": "csv", "rows": 600}',         '2023-12-10 10:30:00+00'),

-- More events for time-series patterns (monthly logins for window function exercises)
(109,  1, 'login',       '{"device": "desktop"}',                   '2023-06-15 10:00:00+00'),
(110,  1, 'login',       '{"device": "desktop"}',                   '2023-07-20 10:00:00+00'),
(111,  1, 'login',       '{"device": "desktop"}',                   '2023-08-18 10:00:00+00'),
(112,  1, 'login',       '{"device": "desktop"}',                   '2023-09-15 10:00:00+00'),
(113,  1, 'login',       '{"device": "desktop"}',                   '2023-10-20 10:00:00+00'),
(114,  1, 'login',       '{"device": "desktop"}',                   '2023-11-15 10:00:00+00'),
(115,  1, 'login',       '{"device": "desktop"}',                   '2023-12-18 10:00:00+00'),
(116,  1, 'login',       '{"device": "desktop"}',                   '2024-01-15 10:00:00+00'),
(117,  1, 'login',       '{"device": "desktop"}',                   '2024-02-20 10:00:00+00'),
(118,  1, 'login',       '{"device": "desktop"}',                   '2024-03-18 10:00:00+00'),

(119,  3, 'login',       '{"device": "desktop"}',                   '2023-06-20 09:00:00+00'),
(120,  3, 'login',       '{"device": "desktop"}',                   '2023-07-15 09:00:00+00'),
(121,  3, 'login',       '{"device": "desktop"}',                   '2023-08-22 09:00:00+00'),
(122,  3, 'login',       '{"device": "desktop"}',                   '2023-09-18 09:00:00+00'),
(123,  3, 'login',       '{"device": "desktop"}',                   '2023-10-16 09:00:00+00'),
(124,  3, 'login',       '{"device": "desktop"}',                   '2023-11-20 09:00:00+00'),
(125,  3, 'login',       '{"device": "desktop"}',                   '2023-12-15 09:00:00+00'),
(126,  3, 'login',       '{"device": "desktop"}',                   '2024-01-22 09:00:00+00'),

-- Churned users' late events
(127, 41, 'login',       '{"device": "desktop"}',                   '2023-04-10 09:00:00+00'),
(128, 41, 'feature_used','{"feature": "dashboard"}',                '2023-04-10 09:10:00+00'),
(129, 42, 'login',       '{"device": "mobile"}',                    '2023-05-25 09:00:00+00'),
(130, 43, 'login',       '{"device": "desktop"}',                   '2023-05-01 11:00:00+00'),
(131, 44, 'login',       '{"device": "desktop"}',                   '2023-07-25 14:00:00+00'),
(132, 44, 'feature_used','{"feature": "reports"}',                  '2023-07-25 14:15:00+00'),
(133, 45, 'login',       '{"device": "desktop"}',                   '2023-08-15 09:00:00+00'),

-- James, Kate, Liam, Maya events
(134, 35, 'login',       '{"device": "desktop"}',                   '2024-02-10 08:00:00+00'),
(135, 35, 'feature_used','{"feature": "dashboard"}',                '2024-02-10 08:10:00+00'),
(136, 35, 'api_call',    '{"endpoint": "/v1/analytics"}',           '2024-02-10 09:00:00+00'),
(137, 36, 'login',       '{"device": "desktop"}',                   '2024-02-20 10:00:00+00'),
(138, 36, 'api_call',    '{"endpoint": "/v1/analytics"}',           '2024-02-20 10:15:00+00'),
(139, 36, 'api_call',    '{"endpoint": "/v1/reports"}',             '2024-02-20 10:30:00+00'),
(140, 36, 'api_call',    '{"endpoint": "/v1/export"}',              '2024-02-20 11:00:00+00'),
(141, 37, 'login',       '{"device": "desktop"}',                   '2024-03-10 09:00:00+00'),
(142, 38, 'login',       '{"device": "desktop"}',                   '2024-03-25 11:00:00+00'),
(143, 38, 'feature_used','{"feature": "dashboard"}',                '2024-03-25 11:10:00+00'),

-- Free users' minimal activity
(144, 33, 'login',       '{"device": "mobile"}',                    '2024-01-05 11:00:00+00'),
(145, 34, 'login',       '{"device": "desktop"}',                   '2024-01-20 14:00:00+00'),
(146, 34, 'feature_used','{"feature": "dashboard"}',                '2024-01-20 14:10:00+00'),
(147, 39, 'login',       '{"device": "desktop"}',                   '2024-04-10 14:00:00+00'),
(148, 40, 'login',       '{"device": "desktop"}',                   '2024-04-20 10:00:00+00'),
(149, 40, 'feature_used','{"feature": "dashboard"}',                '2024-04-20 10:10:00+00'),

-- Extra feature_used events for analytics
(150,  1, 'feature_used','{"feature": "integrations"}',             '2023-05-22 10:00:00+00'),
(151,  3, 'feature_used','{"feature": "api_keys"}',                 '2023-04-20 09:00:00+00'),
(152,  7, 'feature_used','{"feature": "integrations"}',             '2023-08-15 08:00:00+00'),
(153,  8, 'feature_used','{"feature": "api_keys"}',                 '2023-06-15 09:15:00+00'),
(154, 10, 'feature_used','{"feature": "integrations"}',             '2023-06-10 12:00:00+00'),
(155, 17, 'feature_used','{"feature": "api_keys"}',                 '2023-07-10 11:15:00+00'),
(156, 29, 'feature_used','{"feature": "api_keys"}',                 '2023-10-10 13:00:00+00'),
(157, 36, 'feature_used','{"feature": "api_keys"}',                 '2024-02-20 11:30:00+00'),

-- Upgrade prompts (for conversion analysis)
(158,  5, 'upgrade_prompt_shown', '{"from": "free", "to": "starter"}', '2023-04-15 08:15:00+00'),
(159,  6, 'upgrade_prompt_shown', '{"from": "free", "to": "starter"}', '2023-04-20 16:20:00+00'),
(160, 13, 'upgrade_prompt_shown', '{"from": "free", "to": "starter"}', '2023-04-01 09:15:00+00'),
(161, 19, 'upgrade_prompt_shown', '{"from": "free", "to": "starter"}', '2023-08-10 09:15:00+00'),
(162, 21, 'upgrade_prompt_shown', '{"from": "free", "to": "starter"}', '2023-08-01 10:15:00+00'),
(163, 22, 'upgrade_prompt_shown', '{"from": "free", "to": "starter"}', '2023-08-15 09:15:00+00'),
(164, 23, 'upgrade_prompt_shown', '{"from": "free", "to": "starter"}', '2023-09-01 11:15:00+00'),
(165, 33, 'upgrade_prompt_shown', '{"from": "free", "to": "starter"}', '2024-01-05 11:15:00+00'),

-- Additional api_call events for heavy users
(166,  3, 'api_call',    '{"endpoint": "/v1/analytics"}',           '2023-08-22 10:00:00+00'),
(167,  3, 'api_call',    '{"endpoint": "/v1/reports"}',             '2023-09-18 10:00:00+00'),
(168,  8, 'api_call',    '{"endpoint": "/v1/analytics"}',           '2023-08-20 11:00:00+00'),
(169,  8, 'api_call',    '{"endpoint": "/v1/reports"}',             '2023-11-15 09:00:00+00'),
(170, 17, 'api_call',    '{"endpoint": "/v1/analytics"}',           '2023-10-20 10:00:00+00'),
(171, 29, 'api_call',    '{"endpoint": "/v1/export"}',              '2024-01-25 10:00:00+00'),

-- Late 2024 events
(172,  1, 'login',       '{"device": "desktop"}',                   '2024-04-15 10:00:00+00'),
(173,  1, 'feature_used','{"feature": "dashboard"}',                '2024-04-15 10:10:00+00'),
(174,  3, 'login',       '{"device": "desktop"}',                   '2024-04-15 09:00:00+00'),
(175,  3, 'api_call',    '{"endpoint": "/v1/analytics"}',           '2024-04-15 09:30:00+00'),
(176,  7, 'login',       '{"device": "desktop"}',                   '2024-04-20 12:00:00+00'),
(177,  8, 'login',       '{"device": "desktop"}',                   '2024-05-10 10:00:00+00'),
(178,  8, 'api_call',    '{"endpoint": "/v1/analytics"}',           '2024-05-10 10:15:00+00'),
(179, 17, 'login',       '{"device": "desktop"}',                   '2024-02-05 09:00:00+00'),
(180, 17, 'api_call',    '{"endpoint": "/v1/analytics"}',           '2024-02-05 09:30:00+00'),

-- Fill to 200 with misc events
(181, 46, 'login',       '{"device": "mobile"}',                    '2024-04-01 10:00:00+00'),
(182, 47, 'login',       '{"device": "desktop"}',                   '2024-04-15 11:00:00+00'),
(183, 48, 'login',       '{"device": "desktop"}',                   '2024-05-01 09:00:00+00'),
(184, 49, 'login',       '{"device": "mobile"}',                    '2024-05-15 14:00:00+00'),
(185, 50, 'login',       '{"device": "desktop"}',                   '2024-06-01 08:00:00+00'),
(186,  2, 'login',       '{"device": "desktop"}',                   '2023-07-10 09:00:00+00'),
(187,  2, 'feature_used','{"feature": "storage"}',                  '2023-07-10 09:15:00+00'),
(188,  4, 'login',       '{"device": "desktop"}',                   '2023-11-20 10:00:00+00'),
(189,  4, 'feature_used','{"feature": "storage"}',                  '2023-11-20 10:15:00+00'),
(190,  6, 'login',       '{"device": "desktop"}',                   '2024-01-10 09:00:00+00'),
(191,  9, 'feature_used','{"feature": "dashboard"}',                '2023-09-25 10:15:00+00'),
(192, 10, 'login',       '{"device": "desktop"}',                   '2024-01-05 09:00:00+00'),
(193, 16, 'login',       '{"device": "desktop"}',                   '2024-03-10 08:00:00+00'),
(194, 18, 'feature_used','{"feature": "storage"}',                  '2023-07-20 14:15:00+00'),
(195, 20, 'feature_used','{"feature": "dashboard"}',                '2023-12-10 08:10:00+00'),
(196, 27, 'login',       '{"device": "desktop"}',                   '2024-01-20 09:00:00+00'),
(197, 30, 'login',       '{"device": "desktop"}',                   '2024-02-20 08:00:00+00'),
(198, 32, 'login',       '{"device": "desktop"}',                   '2024-03-15 09:00:00+00'),
(199, 35, 'login',       '{"device": "desktop"}',                   '2024-04-05 08:00:00+00'),
(200, 38, 'login',       '{"device": "desktop"}',                   '2024-05-10 11:00:00+00');

SELECT setval('events_id_seq', 200);
