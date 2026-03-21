-- ============================================================
-- Seed data for SILLY theme (Galactic Pizza Delivery)
-- All numeric values, FK patterns, timestamps, and NULL
-- distributions are IDENTICAL to the serious theme (03-seed.sql).
-- Only names, categories, types, and domain labels change.
-- ============================================================

-- ============================================================
-- PIZZAS (8 rows) — maps to products
-- ============================================================
INSERT INTO theme_silly.pizzas (id, name, category, cost_credits, created_at) VALUES
(1, 'Margherita Meteor',       'classic',     2900, '2023-01-01'),
(2, 'Pepperoni Pulsar',        'classic',     9900, '2023-01-01'),
(3, 'Nebula Nachos Supreme',   'exotic',      4900, '2023-01-01'),
(4, 'Black Hole Burrito Pizza', 'exotic',    19900, '2023-01-01'),
(5, 'Uranium Thin Crust',      'radioactive', 1900, '2023-03-15'),
(6, 'Plutonium Deep Dish',     'radioactive', 4900, '2023-03-15'),
(7, 'Void Walker Special',     'void',        9900, '2023-06-01'),
(8, 'Cosmic Oblivion Feast',   'void',       29900, '2023-06-01');

SELECT setval('theme_silly.pizzas_id_seq', 8);

-- ============================================================
-- ALIENS (50 rows) — maps to users
-- appetite_level maps to plan: snacker=free, hungry=starter, ravenous=pro, bottomless=enterprise
-- planet maps to country: Zorgon=US, Blorpix=UK, Kragnoth=DE, Flimflam=FR, Glorbania=IN,
--   Squishtar=JP, Wumbulon=AU, Crunchtopia=BR, Zibblezap=CA, Plonkus=CN,
--   Snorkelheim=IE, Blipblorp=SE, Muncheron=RU, Noodletron=PL, Gurgleton=NG,
--   Fizzpop=MX, Wobblex=IT, Sploinkus=AR, Dingleberry=KR, Quagmire=VN,
--   Bumbleton=PK, Sproing=GR, Fluffernax=NO, Garglax=ES, Tinkleton=CH,
--   Yoinkus=BG, Zappleton=TW, Honksworth=GH, Blurpton=CY
-- IDs 1&2 share registration date (Jan 15), IDs 5&6 share (Mar 1), IDs 8&14 share (Apr 1)
-- ============================================================
INSERT INTO theme_silly.aliens (id, name, species, appetite_level, planet, created_at, banned_at) VALUES
-- Active aliens, various appetite levels
( 1, 'Zyx the Devourer',       'Zorblaxian',  'ravenous',   'Zorgon',      '2023-01-15 10:00:00+00', NULL),
( 2, 'Blurp McSlurp',          'Glumpoid',    'hungry',     'Blorpix',     '2023-01-15 14:30:00+00', NULL),
( 3, 'Omnomnom Prime',          'Nebulite',    'bottomless', 'Zorgon',      '2023-02-01 09:00:00+00', NULL),
( 4, 'Gnarfle the Famished',   'Crunchtoid',  'ravenous',   'Kragnoth',    '2023-02-14 11:00:00+00', NULL),
( 5, 'Squeaky Fromage',        'Squelchian',  'snacker',    'Flimflam',    '2023-03-01 08:00:00+00', NULL),
( 6, 'Drizzle von Spatula',    'Zorblaxian',  'hungry',     'Zorgon',      '2023-03-01 16:00:00+00', NULL),
( 7, 'Sprocket Mozzarella',    'Glumpoid',    'ravenous',   'Glorbania',   '2023-03-15 12:00:00+00', NULL),
( 8, 'Lord Pepperoncini',      'Nebulite',    'bottomless', 'Blorpix',     '2023-04-01 10:00:00+00', NULL),
( 9, 'Wobbleflop Anchovy',     'Crunchtoid',  'hungry',     'Squishtar',   '2023-04-15 09:00:00+00', NULL),
(10, 'Captain Crustacean',     'Squelchian',  'ravenous',   'Wumbulon',    '2023-05-01 11:00:00+00', NULL),

-- Banned aliens (maps to churned users)
(11, 'Sludgeclaw the Rancid',  'Zorblaxian',  'hungry',     'Zorgon',      '2023-01-20 10:00:00+00', '2023-06-20 10:00:00+00'),
(12, 'Greasefang Lurker',      'Glumpoid',    'ravenous',   'Crunchtopia', '2023-02-10 14:00:00+00', '2023-08-10 14:00:00+00'),
(13, 'Moldspore Nibbler',      'Nebulite',    'snacker',    'Zibblezap',   '2023-03-05 09:00:00+00', '2023-05-05 09:00:00+00'),
(14, 'Scumtooth Gnasher',      'Crunchtoid',  'hungry',     'Blorpix',     '2023-04-01 10:00:00+00', '2023-09-01 10:00:00+00'),
(15, 'Rottenshell Chomp',      'Squelchian',  'ravenous',   'Zorgon',      '2023-05-15 11:00:00+00', '2023-11-15 11:00:00+00'),

-- More active aliens
(16, 'Quantum Quesadilla',     'Zorblaxian',  'ravenous',   'Plonkus',     '2023-05-20 08:00:00+00', NULL),
(17, 'Overlord Olivepit',      'Nebulite',    'bottomless', 'Snorkelheim', '2023-06-01 10:00:00+00', NULL),
(18, 'Ripple Ravioli',         'Glumpoid',    'hungry',     'Crunchtopia', '2023-06-15 14:00:00+00', NULL),
(19, 'Sploop the Idle',        'Crunchtoid',  'snacker',    'Blipblorp',   '2023-07-01 09:00:00+00', NULL),
(20, 'Tizzy Tartufo',          'Squelchian',  'ravenous',   'Flimflam',    '2023-07-15 11:00:00+00', NULL),

-- Aliens with NO orders (for LEFT JOIN IS NULL exercise)
(21, 'Umbrax the Hollow',      'Zorblaxian',  'snacker',    'Glorbania',   '2023-08-01 10:00:00+00', NULL),
(22, 'Voidsnack Petrovich',    'Glumpoid',    'snacker',    'Muncheron',   '2023-08-15 09:00:00+00', NULL),
(23, 'Wumble Changsworth',     'Nebulite',    'snacker',    'Zappleton',   '2023-09-01 11:00:00+00', NULL),
(24, 'Xorblitz Mullerax',      'Crunchtoid',  'snacker',    'Kragnoth',    '2023-09-15 14:00:00+00', NULL),
(25, 'Yukimura Slurpface',     'Squelchian',  'snacker',    'Squishtar',   '2023-10-01 08:00:00+00', NULL),

-- More aliens for volume
(26, 'Ankleblaster Kowski',    'Zorblaxian',  'hungry',     'Noodletron',  '2023-06-01 10:00:00+00', NULL),
(27, 'Blastoid Okafork',       'Glumpoid',    'ravenous',   'Gurgleton',   '2023-07-01 09:00:00+00', NULL),
(28, 'Clamjaw Riverblorp',     'Nebulite',    'hungry',     'Fizzpop',     '2023-08-01 10:00:00+00', NULL),
(29, 'Deathcrust Singularity', 'Crunchtoid',  'bottomless', 'Glorbania',   '2023-09-01 11:00:00+00', NULL),
(30, 'Electroslice Volkov',    'Squelchian',  'ravenous',   'Muncheron',   '2023-10-01 08:00:00+00', NULL),

(31, 'Fizzbucket Larsson',     'Zorblaxian',  'hungry',     'Blipblorp',   '2023-10-15 09:00:00+00', NULL),
(32, 'Goopstreak Rossi',       'Glumpoid',    'ravenous',   'Wobblex',     '2023-11-01 10:00:00+00', NULL),
(33, 'Hectoplasm Morales',     'Nebulite',    'snacker',    'Sploinkus',   '2023-11-15 11:00:00+00', NULL),
(34, 'Islandcheese MacBlorp',  'Crunchtoid',  'hungry',     'Blorpix',     '2023-12-01 14:00:00+00', NULL),
(35, 'Jellybrain Parkoid',     'Squelchian',  'ravenous',   'Dingleberry', '2024-01-01 08:00:00+00', NULL),

(36, 'Kablooey Nguyenoid',     'Zorblaxian',  'bottomless', 'Quagmire',    '2024-01-15 10:00:00+00', NULL),
(37, 'Lumpkin Fischerblatt',   'Glumpoid',    'hungry',     'Kragnoth',    '2024-02-01 09:00:00+00', NULL),
(38, 'Mucusoid Aliblorp',      'Nebulite',    'ravenous',   'Bumbleton',   '2024-02-15 11:00:00+00', NULL),
(39, 'Noodlearm Papadopoid',   'Crunchtoid',  'snacker',    'Sproing',     '2024-03-01 14:00:00+00', NULL),
(40, 'Oozemaster Bjorkson',    'Squelchian',  'hungry',     'Fluffernax',  '2024-03-15 10:00:00+00', NULL),

-- Banned aliens (more churned)
(41, 'Putridpeel Fernandez',   'Zorblaxian',  'ravenous',   'Garglax',     '2023-03-01 09:00:00+00', '2023-09-01 09:00:00+00'),
(42, 'Rancidclaw Guptoid',     'Glumpoid',    'hungry',     'Glorbania',   '2023-04-15 09:00:00+00', '2023-10-15 09:00:00+00'),
(43, 'Stenchblob Eriksson',    'Nebulite',    'snacker',    'Blipblorp',   '2023-05-01 11:00:00+00', '2023-07-01 11:00:00+00'),
(44, 'Toxicrust Williams',     'Crunchtoid',  'ravenous',   'Wumbulon',    '2023-06-15 14:00:00+00', '2024-01-15 14:00:00+00'),
(45, 'Ulcersnout Weberblatt',  'Squelchian',  'hungry',     'Tinkleton',   '2023-07-01 09:00:00+00', '2024-02-01 09:00:00+00'),

-- Snacker aliens who never upgraded (no subscriptions or orders)
(46, 'Vacuumgut Antonov',      'Zorblaxian',  'snacker',    'Yoinkus',     '2024-04-01 10:00:00+00', NULL),
(47, 'Whifflebrain Hoffman',   'Glumpoid',    'snacker',    'Zorgon',      '2024-04-15 11:00:00+00', NULL),
(48, 'Xeroxface Christou',     'Nebulite',    'snacker',    'Blurpton',    '2024-05-01 09:00:00+00', NULL),
(49, 'Yawnstretch Dupontoid',  'Crunchtoid',  'snacker',    'Flimflam',    '2024-05-15 14:00:00+00', NULL),
(50, 'Zilchmouth Oseibork',    'Squelchian',  'snacker',    'Honksworth',  '2024-06-01 08:00:00+00', NULL);

SELECT setval('theme_silly.aliens_id_seq', 50);

-- ============================================================
-- ORDERS (80 rows) — maps to orders
-- status mapping: completed->delivered, refunded->vaporized, pending->pending
-- total_credits = same values as total_cents
-- ============================================================
INSERT INTO theme_silly.orders (id, alien_id, total_credits, status, created_at) VALUES
-- Zyx (alien 1) — 4 orders
( 1,  1, 12800, 'delivered',  '2023-02-10 10:00:00+00'),
( 2,  1,  9900, 'delivered',  '2023-05-22 14:00:00+00'),
( 3,  1, 24800, 'delivered',  '2023-09-15 11:00:00+00'),
( 4,  1,  4900, 'vaporized',  '2023-12-01 09:00:00+00'),

-- Blurp (alien 2) — 2 orders
( 5,  2,  2900, 'delivered',  '2023-02-20 09:00:00+00'),
( 6,  2,  6800, 'delivered',  '2023-07-10 15:00:00+00'),

-- Omnomnom (alien 3) — 5 orders (high-value bottomless customer)
( 7,  3, 39800, 'delivered',  '2023-02-15 10:00:00+00'),
( 8,  3, 29900, 'delivered',  '2023-04-20 11:00:00+00'),
( 9,  3, 34800, 'delivered',  '2023-07-12 14:00:00+00'),
(10,  3, 49800, 'delivered',  '2023-10-05 09:00:00+00'),
(11,  3, 29900, 'delivered',  '2024-01-15 10:00:00+00'),

-- Gnarfle (alien 4) — 3 orders
(12,  4,  9900, 'delivered',  '2023-03-10 11:00:00+00'),
(13,  4, 14800, 'delivered',  '2023-06-25 14:00:00+00'),
(14,  4,  4900, 'pending',    '2023-11-20 09:00:00+00'),

-- Squeaky (alien 5) — 1 order
(15,  5,  2900, 'delivered',  '2023-04-15 08:00:00+00'),

-- Drizzle (alien 6) — 2 orders
(16,  6,  7800, 'delivered',  '2023-04-20 16:00:00+00'),
(17,  6,  4900, 'delivered',  '2023-08-10 10:00:00+00'),

-- Sprocket (alien 7) — 3 orders
(18,  7, 14800, 'delivered',  '2023-04-25 12:00:00+00'),
(19,  7,  9900, 'delivered',  '2023-08-15 09:00:00+00'),
(20,  7, 19800, 'delivered',  '2024-01-10 14:00:00+00'),

-- Lord Pepperoncini (alien 8) — 4 orders
(21,  8, 39800, 'delivered',  '2023-05-10 10:00:00+00'),
(22,  8, 29900, 'delivered',  '2023-08-20 11:00:00+00'),
(23,  8, 49800, 'delivered',  '2023-11-15 14:00:00+00'),
(24,  8, 29900, 'vaporized',  '2024-02-10 09:00:00+00'),

-- Wobbleflop (alien 9) — 2 orders
(25,  9,  4900, 'delivered',  '2023-05-20 09:00:00+00'),
(26,  9,  2900, 'delivered',  '2023-09-25 14:00:00+00'),

-- Captain Crustacean (alien 10) — 3 orders
(27, 10, 12800, 'delivered',  '2023-06-10 11:00:00+00'),
(28, 10,  9900, 'delivered',  '2023-09-20 10:00:00+00'),
(29, 10,  4900, 'delivered',  '2024-01-05 14:00:00+00'),

-- Sludgeclaw (alien 11, banned) — 2 orders before ban
(30, 11,  2900, 'delivered',  '2023-02-25 10:00:00+00'),
(31, 11,  4900, 'delivered',  '2023-05-15 11:00:00+00'),

-- Greasefang (alien 12, banned) — 3 orders
(32, 12, 14800, 'delivered',  '2023-03-20 14:00:00+00'),
(33, 12,  9900, 'delivered',  '2023-06-10 09:00:00+00'),
(34, 12,  4900, 'vaporized',  '2023-07-25 11:00:00+00'),

-- Moldspore (alien 13, banned) — 1 order
(35, 13,  2900, 'delivered',  '2023-04-01 09:00:00+00'),

-- Scumtooth (alien 14, banned) — 2 orders
(36, 14,  7800, 'delivered',  '2023-05-10 10:00:00+00'),
(37, 14,  4900, 'delivered',  '2023-08-01 14:00:00+00'),

-- Rottenshell (alien 15, banned) — 2 orders
(38, 15, 14800, 'delivered',  '2023-06-20 11:00:00+00'),
(39, 15,  9900, 'delivered',  '2023-09-15 09:00:00+00'),

-- Quantum Quesadilla (alien 16) — 2 orders
(40, 16,  9900, 'delivered',  '2023-06-25 08:00:00+00'),
(41, 16, 19800, 'delivered',  '2023-10-15 14:00:00+00'),

-- Overlord Olivepit (alien 17) — 3 orders
(42, 17, 39800, 'delivered',  '2023-07-10 10:00:00+00'),
(43, 17, 29900, 'delivered',  '2023-10-20 11:00:00+00'),
(44, 17, 49800, 'delivered',  '2024-02-05 09:00:00+00'),

-- Ripple Ravioli (alien 18) — 1 order
(45, 18,  4900, 'delivered',  '2023-07-20 14:00:00+00'),

-- Sploop the Idle (alien 19) — 1 order
(46, 19,  2900, 'delivered',  '2023-08-10 09:00:00+00'),

-- Tizzy Tartufo (alien 20) — 2 orders
(47, 20, 14800, 'delivered',  '2023-08-25 11:00:00+00'),
(48, 20,  9900, 'delivered',  '2023-12-10 14:00:00+00'),

-- Ankleblaster (alien 26) — 2 orders
(49, 26,  4900, 'delivered',  '2023-07-15 10:00:00+00'),
(50, 26,  7800, 'delivered',  '2023-11-20 09:00:00+00'),

-- Blastoid (alien 27) — 2 orders
(51, 27, 12800, 'delivered',  '2023-08-10 09:00:00+00'),
(52, 27,  9900, 'delivered',  '2024-01-20 14:00:00+00'),

-- Clamjaw (alien 28) — 1 order
(53, 28,  4900, 'delivered',  '2023-09-15 10:00:00+00'),

-- Deathcrust (alien 29) — 3 orders
(54, 29, 39800, 'delivered',  '2023-10-10 11:00:00+00'),
(55, 29, 29900, 'delivered',  '2024-01-25 09:00:00+00'),
(56, 29, 19800, 'delivered',  '2024-03-10 14:00:00+00'),

-- Electroslice (alien 30) — 2 orders
(57, 30,  9900, 'delivered',  '2023-11-10 08:00:00+00'),
(58, 30, 14800, 'delivered',  '2024-02-20 10:00:00+00'),

-- Fizzbucket (alien 31) — 1 order
(59, 31,  4900, 'delivered',  '2023-11-25 09:00:00+00'),

-- Goopstreak (alien 32) — 2 orders
(60, 32, 12800, 'delivered',  '2023-12-10 10:00:00+00'),
(61, 32,  9900, 'delivered',  '2024-03-15 11:00:00+00'),

-- Hectoplasm (alien 33) — 1 order
(62, 33,  2900, 'delivered',  '2024-01-05 11:00:00+00'),

-- Islandcheese (alien 34) — 1 order
(63, 34,  7800, 'delivered',  '2024-01-20 14:00:00+00'),

-- Jellybrain (alien 35) — 2 orders
(64, 35, 14800, 'delivered',  '2024-02-10 08:00:00+00'),
(65, 35,  9900, 'delivered',  '2024-04-05 10:00:00+00'),

-- Kablooey (alien 36) — 2 orders
(66, 36, 49800, 'delivered',  '2024-02-20 10:00:00+00'),
(67, 36, 29900, 'delivered',  '2024-05-10 09:00:00+00'),

-- Lumpkin (alien 37) — 1 order
(68, 37,  4900, 'delivered',  '2024-03-10 09:00:00+00'),

-- Mucusoid (alien 38) — 1 order
(69, 38, 12800, 'delivered',  '2024-03-25 11:00:00+00'),

-- Putridpeel (alien 41, banned) — 1 order
(70, 41,  9900, 'delivered',  '2023-04-10 09:00:00+00'),

-- Rancidclaw (alien 42, banned) — 1 order
(71, 42,  4900, 'delivered',  '2023-05-25 09:00:00+00'),

-- Toxicrust (alien 44, banned) — 2 orders
(72, 44, 14800, 'delivered',  '2023-07-25 14:00:00+00'),
(73, 44,  9900, 'delivered',  '2023-11-10 10:00:00+00'),

-- Ulcersnout (alien 45, banned) — 1 order
(74, 45,  4900, 'delivered',  '2023-08-15 09:00:00+00'),

-- Noodlearm (alien 39) — 1 small order
(75, 39,  2900, 'pending',    '2024-04-10 14:00:00+00'),

-- Oozemaster (alien 40) — 1 order
(76, 40,  7800, 'delivered',  '2024-04-20 10:00:00+00'),

-- Extra orders for time-series analysis
(77,  1, 14800, 'delivered',  '2024-03-10 10:00:00+00'),
(78,  3, 39800, 'delivered',  '2024-04-15 11:00:00+00'),
(79,  7, 12800, 'delivered',  '2024-04-20 14:00:00+00'),
(80,  8, 49800, 'delivered',  '2024-05-10 09:00:00+00');

SELECT setval('theme_silly.orders_id_seq', 80);

-- ============================================================
-- ORDER_ITEMS (118 rows) — maps to order_items
-- pizza_id maps to product_id, unit_cost_credits maps to unit_price_cents
-- ============================================================
INSERT INTO theme_silly.order_items (id, order_id, pizza_id, quantity, unit_cost_credits) VALUES
-- Zyx orders
( 1,  1, 1, 1,  2900), ( 2,  1, 3, 1,  4900), ( 3,  1, 5, 1,  1900),  -- order 1: margherita + nachos + uranium
( 4,  2, 2, 1,  9900),                                                   -- order 2: pepperoni pulsar
( 5,  3, 2, 1,  9900), ( 6,  3, 4, 1, 19900),                           -- order 3: pepperoni + black hole
( 7,  4, 3, 1,  4900),                                                   -- order 4: nachos (vaporized)

-- Blurp orders
( 8,  5, 1, 1,  2900),                                                   -- order 5: margherita
( 9,  6, 1, 1,  2900), (10,  6, 5, 1,  1900),                           -- order 6: margherita + uranium

-- Omnomnom orders (bottomless, high-value)
(11,  7, 2, 1,  9900), (12,  7, 4, 1, 19900), (13,  7, 8, 1, 29900),   -- order 7: pepperoni + black hole + cosmic oblivion
(14,  8, 8, 1, 29900),                                                   -- order 8: cosmic oblivion renewal
(15,  9, 2, 1,  9900), (16,  9, 6, 1,  4900), (17,  9, 4, 1, 19900),   -- order 9: pepperoni + plutonium + black hole
(18, 10, 8, 1, 29900), (19, 10, 4, 1, 19900),                           -- order 10: cosmic oblivion + black hole
(20, 11, 8, 1, 29900),                                                   -- order 11: cosmic oblivion renewal

-- Gnarfle orders
(21, 12, 2, 1,  9900),                                                   -- order 12: pepperoni
(22, 13, 2, 1,  9900), (23, 13, 3, 1,  4900),                           -- order 13: pepperoni + nachos
(24, 14, 3, 1,  4900),                                                   -- order 14: nachos (pending)

-- Squeaky order
(25, 15, 1, 1,  2900),                                                   -- order 15: margherita

-- Drizzle orders
(26, 16, 1, 1,  2900), (27, 16, 3, 1,  4900),                           -- order 16: margherita + nachos
(28, 17, 3, 1,  4900),                                                   -- order 17: nachos

-- Sprocket orders
(29, 18, 2, 1,  9900), (30, 18, 3, 1,  4900),                           -- order 18: pepperoni + nachos
(31, 19, 2, 1,  9900),                                                   -- order 19: pepperoni
(32, 20, 2, 1,  9900), (33, 20, 4, 1, 19900),                           -- order 20: pepperoni + black hole

-- Lord Pepperoncini orders (bottomless)
(34, 21, 2, 1,  9900), (35, 21, 8, 1, 29900),                           -- order 21: pepperoni + cosmic oblivion
(36, 22, 8, 1, 29900),                                                   -- order 22: cosmic oblivion
(37, 23, 8, 1, 29900), (38, 23, 4, 1, 19900),                           -- order 23: cosmic oblivion + black hole
(39, 24, 8, 1, 29900),                                                   -- order 24: cosmic oblivion (vaporized)

-- Wobbleflop orders
(40, 25, 3, 1,  4900),                                                   -- order 25: nachos
(41, 26, 1, 1,  2900),                                                   -- order 26: margherita

-- Captain Crustacean orders
(42, 27, 2, 1,  9900), (43, 27, 5, 1,  1900),                           -- order 27: pepperoni + uranium
(44, 28, 2, 1,  9900),                                                   -- order 28: pepperoni
(45, 29, 3, 1,  4900),                                                   -- order 29: nachos

-- Sludgeclaw (banned) orders
(46, 30, 1, 1,  2900),                                                   -- order 30: margherita
(47, 31, 3, 1,  4900),                                                   -- order 31: nachos

-- Greasefang (banned) orders
(48, 32, 2, 1,  9900), (49, 32, 3, 1,  4900),                           -- order 32: pepperoni + nachos
(50, 33, 2, 1,  9900),                                                   -- order 33: pepperoni
(51, 34, 3, 1,  4900),                                                   -- order 34: nachos (vaporized)

-- Moldspore (banned) order
(52, 35, 1, 1,  2900),                                                   -- order 35: margherita

-- Scumtooth (banned) orders
(53, 36, 1, 1,  2900), (54, 36, 3, 1,  4900),                           -- order 36: margherita + nachos
(55, 37, 3, 1,  4900),                                                   -- order 37: nachos

-- Rottenshell (banned) orders
(56, 38, 2, 1,  9900), (57, 38, 3, 1,  4900),                           -- order 38: pepperoni + nachos
(58, 39, 2, 1,  9900),                                                   -- order 39: pepperoni

-- Quantum Quesadilla orders
(59, 40, 2, 1,  9900),                                                   -- order 40: pepperoni
(60, 41, 2, 1,  9900), (61, 41, 4, 1, 19900),                           -- order 41: pepperoni + black hole

-- Overlord Olivepit orders (bottomless)
(62, 42, 2, 1,  9900), (63, 42, 8, 1, 29900),                           -- order 42: pepperoni + cosmic oblivion
(64, 43, 8, 1, 29900),                                                   -- order 43: cosmic oblivion
(65, 44, 8, 1, 29900), (66, 44, 4, 1, 19900),                           -- order 44: cosmic oblivion + black hole

-- Ripple, Sploop, Tizzy
(67, 45, 3, 1,  4900),                                                   -- order 45: nachos
(68, 46, 1, 1,  2900),                                                   -- order 46: margherita
(69, 47, 2, 1,  9900), (70, 47, 5, 1,  1900),                           -- order 47: pepperoni + uranium
(71, 48, 2, 1,  9900),                                                   -- order 48: pepperoni

-- Ankleblaster, Blastoid, Clamjaw, Deathcrust, Electroslice, Fizzbucket, Goopstreak, Hectoplasm, Islandcheese, Jellybrain, Kablooey, Lumpkin, Mucusoid
(72, 49, 3, 1,  4900),                                                   -- Ankleblaster order 1
(73, 50, 1, 1,  2900), (74, 50, 3, 1,  4900),                           -- Ankleblaster order 2
(75, 51, 2, 1,  9900), (76, 51, 5, 1,  1900),                           -- Blastoid order 1
(77, 52, 2, 1,  9900),                                                   -- Blastoid order 2
(78, 53, 3, 1,  4900),                                                   -- Clamjaw order
(79, 54, 2, 1,  9900), (80, 54, 8, 1, 29900),                           -- Deathcrust order 1
(81, 55, 8, 1, 29900),                                                   -- Deathcrust order 2
(82, 56, 4, 1, 19900),                                                   -- Deathcrust order 3
(83, 57, 2, 1,  9900),                                                   -- Electroslice order 1
(84, 58, 2, 1,  9900), (85, 58, 3, 1,  4900),                           -- Electroslice order 2
(86, 59, 3, 1,  4900),                                                   -- Fizzbucket order
(87, 60, 2, 1,  9900), (88, 60, 5, 1,  1900),                           -- Goopstreak order 1
(89, 61, 2, 1,  9900),                                                   -- Goopstreak order 2
(90, 62, 1, 1,  2900),                                                   -- Hectoplasm order
(91, 63, 1, 1,  2900), (92, 63, 3, 1,  4900),                           -- Islandcheese order
(93, 64, 2, 1,  9900), (94, 64, 3, 1,  4900),                           -- Jellybrain order 1
(95, 65, 2, 1,  9900),                                                   -- Jellybrain order 2
(96, 66, 8, 1, 29900), (97, 66, 4, 1, 19900),                           -- Kablooey order 1
(98, 67, 8, 1, 29900),                                                   -- Kablooey order 2
(99, 68, 3, 1,  4900),                                                   -- Lumpkin order
(100, 69, 2, 1, 9900), (101, 69, 5, 1, 1900),                           -- Mucusoid order

-- Banned aliens' orders
(102, 70, 2, 1,  9900),                                                  -- Putridpeel order
(103, 71, 3, 1,  4900),                                                  -- Rancidclaw order
(104, 72, 2, 1,  9900), (105, 72, 3, 1,  4900),                         -- Toxicrust order 1
(106, 73, 2, 1,  9900),                                                  -- Toxicrust order 2
(107, 74, 3, 1,  4900),                                                  -- Ulcersnout order

-- Noodlearm (pending), Oozemaster
(108, 75, 1, 1,  2900),                                                  -- Noodlearm order (pending)
(109, 76, 1, 1,  2900), (110, 76, 3, 1, 4900),                          -- Oozemaster order

-- Extra time-series orders
(111, 77, 2, 1,  9900), (112, 77, 3, 1, 4900),                          -- Zyx extra
(113, 78, 2, 1,  9900), (114, 78, 8, 1, 29900),                         -- Omnomnom extra
(115, 79, 2, 1,  9900), (116, 79, 5, 1, 1900),                          -- Sprocket extra
(117, 80, 8, 1, 29900), (118, 80, 4, 1, 19900);                         -- Lord Pepperoncini extra

SELECT setval('theme_silly.order_items_id_seq', 118);

-- ============================================================
-- SUBSCRIPTIONS (60 rows) — maps to subscriptions
-- monthly_credits = same values as mrr_cents
-- alien_id maps to user_id, pizza_id maps to product_id
-- ============================================================
INSERT INTO theme_silly.subscriptions (id, alien_id, pizza_id, status, started_at, cancelled_at, monthly_credits) VALUES
-- Active subscriptions
( 1,  1, 2, 'active',    '2023-02-10', NULL,          9900),  -- Zyx: Pepperoni Pulsar
( 2,  1, 4, 'active',    '2023-09-15', NULL,         19900),  -- Zyx: Black Hole Burrito
( 3,  2, 1, 'active',    '2023-02-20', NULL,          2900),  -- Blurp: Margherita Meteor
( 4,  3, 2, 'active',    '2023-02-15', NULL,          9900),  -- Omnomnom: Pepperoni Pulsar
( 5,  3, 8, 'active',    '2023-02-15', NULL,         29900),  -- Omnomnom: Cosmic Oblivion
( 6,  3, 4, 'active',    '2023-07-12', NULL,         19900),  -- Omnomnom: Black Hole Burrito
( 7,  4, 2, 'active',    '2023-03-10', NULL,          9900),  -- Gnarfle: Pepperoni Pulsar
( 8,  6, 1, 'active',    '2023-04-20', NULL,          2900),  -- Drizzle: Margherita Meteor
( 9,  7, 2, 'active',    '2023-04-25', NULL,          9900),  -- Sprocket: Pepperoni Pulsar
(10,  8, 2, 'active',    '2023-05-10', NULL,          9900),  -- Lord Pepperoncini: Pepperoni
(11,  8, 8, 'active',    '2023-05-10', NULL,         29900),  -- Lord Pepperoncini: Cosmic Oblivion
(12, 10, 2, 'active',    '2023-06-10', NULL,          9900),  -- Captain Crustacean: Pepperoni
(13, 16, 2, 'active',    '2023-06-25', NULL,          9900),  -- Quantum Quesadilla: Pepperoni
(14, 17, 2, 'active',    '2023-07-10', NULL,          9900),  -- Overlord Olivepit: Pepperoni
(15, 17, 8, 'active',    '2023-07-10', NULL,         29900),  -- Overlord Olivepit: Cosmic Oblivion
(16, 20, 2, 'active',    '2023-08-25', NULL,          9900),  -- Tizzy: Pepperoni Pulsar
(17, 27, 2, 'active',    '2023-08-10', NULL,          9900),  -- Blastoid: Pepperoni Pulsar
(18, 29, 2, 'active',    '2023-10-10', NULL,          9900),  -- Deathcrust: Pepperoni Pulsar
(19, 29, 8, 'active',    '2023-10-10', NULL,         29900),  -- Deathcrust: Cosmic Oblivion
(20, 30, 2, 'active',    '2023-11-10', NULL,          9900),  -- Electroslice: Pepperoni Pulsar
(21, 32, 2, 'active',    '2023-12-10', NULL,          9900),  -- Goopstreak: Pepperoni Pulsar
(22, 35, 2, 'active',    '2024-02-10', NULL,          9900),  -- Jellybrain: Pepperoni Pulsar
(23, 36, 8, 'active',    '2024-02-20', NULL,         29900),  -- Kablooey: Cosmic Oblivion
(24, 36, 4, 'active',    '2024-02-20', NULL,         19900),  -- Kablooey: Black Hole Burrito
(25, 38, 2, 'active',    '2024-03-25', NULL,          9900),  -- Mucusoid: Pepperoni Pulsar

-- Cancelled subscriptions (banned aliens)
(26, 11, 1, 'cancelled', '2023-02-25', '2023-06-20',  0),     -- Sludgeclaw: Margherita (banned)
(27, 12, 2, 'cancelled', '2023-03-20', '2023-08-10',  0),     -- Greasefang: Pepperoni (banned)
(28, 13, 1, 'cancelled', '2023-04-01', '2023-05-05',  0),     -- Moldspore: Margherita (banned)
(29, 14, 1, 'cancelled', '2023-05-10', '2023-09-01',  0),     -- Scumtooth: Margherita (banned)
(30, 15, 2, 'cancelled', '2023-06-20', '2023-11-15',  0),     -- Rottenshell: Pepperoni (banned)
(31, 41, 2, 'cancelled', '2023-04-10', '2023-09-01',  0),     -- Putridpeel: Pepperoni (banned)
(32, 42, 3, 'cancelled', '2023-05-25', '2023-10-15',  0),     -- Rancidclaw: Nachos (banned)
(33, 43, 1, 'cancelled', '2023-05-01', '2023-07-01',  0),     -- Stenchblob: Margherita (banned)
(34, 44, 2, 'cancelled', '2023-07-25', '2024-01-15',  0),     -- Toxicrust: Pepperoni (banned)
(35, 45, 3, 'cancelled', '2023-08-15', '2024-02-01',  0),     -- Ulcersnout: Nachos (banned)

-- Trialing subscriptions (newer aliens)
(36, 37, 1, 'trialing',  '2024-03-10', NULL,          0),     -- Lumpkin: Margherita (trial)
(37, 39, 1, 'trialing',  '2024-04-10', NULL,          0),     -- Noodlearm: Margherita (trial)
(38, 40, 1, 'trialing',  '2024-04-20', NULL,          0),     -- Oozemaster: Margherita (trial)

-- Past due
(39,  9, 1, 'past_due',  '2023-05-20', NULL,          2900),  -- Wobbleflop: Margherita (past due)
(40, 18, 3, 'past_due',  '2023-07-20', NULL,          4900),  -- Ripple: Nachos (past due)

-- More active subs for data volume
(41,  1, 5, 'active',    '2023-05-22', NULL,          1900),  -- Zyx: Uranium Thin Crust
(42,  7, 3, 'active',    '2023-04-25', NULL,          4900),  -- Sprocket: Nachos
(43, 10, 5, 'active',    '2023-06-10', NULL,          1900),  -- Captain Crustacean: Uranium
(44,  2, 5, 'active',    '2023-07-10', NULL,          1900),  -- Blurp: Uranium Thin Crust
(45,  6, 3, 'active',    '2023-04-20', NULL,          4900),  -- Drizzle: Nachos
(46, 20, 5, 'active',    '2023-08-25', NULL,          1900),  -- Tizzy: Uranium Thin Crust
(47, 26, 3, 'active',    '2023-07-15', NULL,          4900),  -- Ankleblaster: Nachos
(48, 28, 3, 'active',    '2023-09-15', NULL,          4900),  -- Clamjaw: Nachos
(49, 31, 3, 'active',    '2023-11-25', NULL,          4900),  -- Fizzbucket: Nachos
(50, 34, 1, 'active',    '2024-01-20', NULL,          2900),  -- Islandcheese: Margherita

-- Upgraded subscriptions (had basic, now pulsar)
(51,  4, 1, 'cancelled', '2023-03-10', '2023-06-25',  0),     -- Gnarfle: had Margherita, cancelled on upgrade
(52,  4, 3, 'active',    '2023-06-25', NULL,          4900),  -- Gnarfle: Nachos
(53, 16, 4, 'active',    '2023-10-15', NULL,         19900),  -- Quantum Quesadilla: Black Hole (added later)
(54,  8, 4, 'active',    '2023-11-15', NULL,         19900),  -- Lord Pepperoncini: Black Hole (added later)
(55, 32, 5, 'active',    '2023-12-10', NULL,          1900),  -- Goopstreak: Uranium
(56, 35, 3, 'active',    '2024-02-10', NULL,          4900),  -- Jellybrain: Nachos
(57, 38, 5, 'active',    '2024-03-25', NULL,          1900),  -- Mucusoid: Uranium
(58, 27, 5, 'active',    '2023-08-10', NULL,          1900),  -- Blastoid: Uranium
(59, 30, 3, 'active',    '2023-11-10', NULL,          4900),  -- Electroslice: Nachos
(60, 17, 4, 'active',    '2023-10-20', NULL,         19900);  -- Overlord Olivepit: Black Hole

SELECT setval('theme_silly.subscriptions_id_seq', 60);

-- ============================================================
-- INCIDENTS (200 rows) — maps to events
-- incident_type mapping: login->complaint, feature_used->abduction,
--   export->food_fight, api_call->teleport_fail, upgrade_prompt_shown->tip
-- SAME JSONB keys: device->pizza_page, feature->pizza_page, format->format,
--   rows->duration_seconds, endpoint->endpoint, from/to->from/to
-- ============================================================
INSERT INTO theme_silly.incidents (id, alien_id, incident_type, properties, occurred_at) VALUES
-- Zyx incidents (alien 1)
( 1,  1, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-02-10 10:05:00+00'),
( 2,  1, 'abduction',     '{"pizza_page": "dashboard"}',                       '2023-02-10 10:15:00+00'),
( 3,  1, 'abduction',     '{"pizza_page": "reports"}',                         '2023-02-10 11:00:00+00'),
( 4,  1, 'food_fight',    '{"format": "csv", "duration_seconds": 1500}',       '2023-02-10 11:30:00+00'),
( 5,  1, 'complaint',     '{"pizza_page": "mobile"}',                          '2023-03-15 08:00:00+00'),
( 6,  1, 'abduction',     '{"pizza_page": "dashboard"}',                       '2023-03-15 08:10:00+00'),
( 7,  1, 'teleport_fail', '{"endpoint": "/v1/analytics"}',                     '2023-04-20 14:00:00+00'),
( 8,  1, 'teleport_fail', '{"endpoint": "/v1/reports"}',                       '2023-04-20 14:30:00+00'),
( 9,  1, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-05-22 09:00:00+00'),
(10,  1, 'tip',           '{"from": "starter", "to": "pro"}',                  '2023-05-22 09:15:00+00'),

-- Blurp incidents (alien 2)
(11,  2, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-02-20 09:00:00+00'),
(12,  2, 'abduction',     '{"pizza_page": "dashboard"}',                       '2023-02-20 09:10:00+00'),
(13,  2, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-03-10 10:00:00+00'),
(14,  2, 'abduction',     '{"pizza_page": "reports"}',                         '2023-03-10 10:30:00+00'),
(15,  2, 'food_fight',    '{"format": "pdf", "duration_seconds": 200}',        '2023-03-10 11:00:00+00'),

-- Omnomnom incidents (alien 3 — heavy user)
(16,  3, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-02-15 09:00:00+00'),
(17,  3, 'abduction',     '{"pizza_page": "dashboard"}',                       '2023-02-15 09:10:00+00'),
(18,  3, 'teleport_fail', '{"endpoint": "/v1/analytics"}',                     '2023-02-15 10:00:00+00'),
(19,  3, 'teleport_fail', '{"endpoint": "/v1/reports"}',                       '2023-02-15 10:30:00+00'),
(20,  3, 'teleport_fail', '{"endpoint": "/v1/export"}',                        '2023-02-15 11:00:00+00'),
(21,  3, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-03-20 09:00:00+00'),
(22,  3, 'abduction',     '{"pizza_page": "integrations"}',                    '2023-03-20 09:30:00+00'),
(23,  3, 'complaint',     '{"pizza_page": "mobile"}',                          '2023-04-20 08:00:00+00'),
(24,  3, 'teleport_fail', '{"endpoint": "/v1/analytics"}',                     '2023-05-10 14:00:00+00'),
(25,  3, 'food_fight',    '{"format": "csv", "duration_seconds": 5000}',       '2023-05-10 14:30:00+00'),

-- Gnarfle incidents (alien 4)
(26,  4, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-03-10 11:00:00+00'),
(27,  4, 'abduction',     '{"pizza_page": "dashboard"}',                       '2023-03-10 11:15:00+00'),
(28,  4, 'tip',           '{"from": "starter", "to": "pro"}',                  '2023-03-10 11:30:00+00'),
(29,  4, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-06-25 09:00:00+00'),
(30,  4, 'abduction',     '{"pizza_page": "reports"}',                         '2023-06-25 09:30:00+00'),

-- Squeaky incidents (alien 5 — light user)
(31,  5, 'complaint',     '{"pizza_page": "mobile"}',                          '2023-04-15 08:00:00+00'),
(32,  5, 'abduction',     '{"pizza_page": "dashboard"}',                       '2023-04-15 08:10:00+00'),

-- Drizzle incidents (alien 6)
(33,  6, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-04-20 16:00:00+00'),
(34,  6, 'abduction',     '{"pizza_page": "dashboard"}',                       '2023-04-20 16:15:00+00'),
(35,  6, 'abduction',     '{"pizza_page": "storage"}',                         '2023-04-20 16:30:00+00'),
(36,  6, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-08-10 09:00:00+00'),

-- Sprocket incidents (alien 7)
(37,  7, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-04-25 12:00:00+00'),
(38,  7, 'abduction',     '{"pizza_page": "dashboard"}',                       '2023-04-25 12:10:00+00'),
(39,  7, 'abduction',     '{"pizza_page": "reports"}',                         '2023-04-25 12:30:00+00'),
(40,  7, 'food_fight',    '{"format": "csv", "duration_seconds": 800}',        '2023-04-25 13:00:00+00'),
(41,  7, 'complaint',     '{"pizza_page": "mobile"}',                          '2023-08-15 07:00:00+00'),
(42,  7, 'teleport_fail', '{"endpoint": "/v1/analytics"}',                     '2023-08-15 07:30:00+00'),

-- Lord Pepperoncini incidents (alien 8 — bottomless, heavy teleport_fail)
(43,  8, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-05-10 10:00:00+00'),
(44,  8, 'teleport_fail', '{"endpoint": "/v1/analytics"}',                     '2023-05-10 10:15:00+00'),
(45,  8, 'teleport_fail', '{"endpoint": "/v1/reports"}',                       '2023-05-10 10:30:00+00'),
(46,  8, 'teleport_fail', '{"endpoint": "/v1/export"}',                        '2023-05-10 11:00:00+00'),
(47,  8, 'teleport_fail', '{"endpoint": "/v1/analytics"}',                     '2023-06-15 09:00:00+00'),
(48,  8, 'teleport_fail', '{"endpoint": "/v1/analytics"}',                     '2023-07-20 14:00:00+00'),
(49,  8, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-08-20 10:00:00+00'),
(50,  8, 'food_fight',    '{"format": "json", "duration_seconds": 10000}',     '2023-08-20 10:30:00+00'),

-- Wobbleflop incidents (alien 9)
(51,  9, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-05-20 09:00:00+00'),
(52,  9, 'abduction',     '{"pizza_page": "dashboard"}',                       '2023-05-20 09:15:00+00'),
(53,  9, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-09-25 10:00:00+00'),

-- Captain Crustacean incidents (alien 10)
(54, 10, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-06-10 11:00:00+00'),
(55, 10, 'abduction',     '{"pizza_page": "dashboard"}',                       '2023-06-10 11:10:00+00'),
(56, 10, 'abduction',     '{"pizza_page": "reports"}',                         '2023-06-10 11:30:00+00'),
(57, 10, 'complaint',     '{"pizza_page": "mobile"}',                          '2023-09-20 08:00:00+00'),
(58, 10, 'food_fight',    '{"format": "csv", "duration_seconds": 500}',        '2023-09-20 08:30:00+00'),

-- Sludgeclaw incidents (alien 11, banned)
(59, 11, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-02-25 10:00:00+00'),
(60, 11, 'abduction',     '{"pizza_page": "dashboard"}',                       '2023-02-25 10:10:00+00'),
(61, 11, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-05-15 09:00:00+00'),
(62, 11, 'tip',           '{"from": "starter", "to": "pro"}',                  '2023-05-15 09:30:00+00'),

-- Greasefang incidents (alien 12, banned)
(63, 12, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-03-20 14:00:00+00'),
(64, 12, 'abduction',     '{"pizza_page": "reports"}',                         '2023-03-20 14:30:00+00'),
(65, 12, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-06-10 09:00:00+00'),
(66, 12, 'abduction',     '{"pizza_page": "dashboard"}',                       '2023-06-10 09:15:00+00'),

-- More aliens' incidents
(67, 13, 'complaint',     '{"pizza_page": "mobile"}',                          '2023-04-01 09:00:00+00'),
(68, 14, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-05-10 10:00:00+00'),
(69, 14, 'abduction',     '{"pizza_page": "dashboard"}',                       '2023-05-10 10:15:00+00'),
(70, 15, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-06-20 11:00:00+00'),
(71, 15, 'abduction',     '{"pizza_page": "reports"}',                         '2023-06-20 11:30:00+00'),
(72, 15, 'food_fight',    '{"format": "csv", "duration_seconds": 300}',        '2023-06-20 12:00:00+00'),

-- Quantum Quesadilla incidents (alien 16)
(73, 16, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-06-25 08:00:00+00'),
(74, 16, 'abduction',     '{"pizza_page": "dashboard"}',                       '2023-06-25 08:10:00+00'),
(75, 16, 'teleport_fail', '{"endpoint": "/v1/analytics"}',                     '2023-10-15 09:00:00+00'),

-- Overlord Olivepit incidents (alien 17 — bottomless)
(76, 17, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-07-10 10:00:00+00'),
(77, 17, 'teleport_fail', '{"endpoint": "/v1/analytics"}',                     '2023-07-10 10:30:00+00'),
(78, 17, 'teleport_fail', '{"endpoint": "/v1/reports"}',                       '2023-07-10 11:00:00+00'),
(79, 17, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-10-20 09:00:00+00'),
(80, 17, 'food_fight',    '{"format": "json", "duration_seconds": 8000}',      '2023-10-20 09:30:00+00'),

-- Ripple, Sploop, Tizzy incidents
(81, 18, 'complaint',     '{"pizza_page": "mobile"}',                          '2023-07-20 14:00:00+00'),
(82, 19, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-08-10 09:00:00+00'),
(83, 19, 'abduction',     '{"pizza_page": "dashboard"}',                       '2023-08-10 09:10:00+00'),
(84, 20, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-08-25 11:00:00+00'),
(85, 20, 'abduction',     '{"pizza_page": "reports"}',                         '2023-08-25 11:15:00+00'),
(86, 20, 'complaint',     '{"pizza_page": "mobile"}',                          '2023-12-10 08:00:00+00'),

-- Aliens 21-25 (no orders, light activity)
(87, 21, 'complaint',     '{"pizza_page": "mobile"}',                          '2023-08-01 10:00:00+00'),
(88, 22, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-08-15 09:00:00+00'),
(89, 23, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-09-01 11:00:00+00'),
(90, 23, 'abduction',     '{"pizza_page": "dashboard"}',                       '2023-09-01 11:10:00+00'),
(91, 24, 'complaint',     '{"pizza_page": "mobile"}',                          '2023-09-15 14:00:00+00'),
(92, 25, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-10-01 08:00:00+00'),

-- Ankleblaster, Blastoid, Clamjaw, Deathcrust incidents
(93, 26, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-07-15 10:00:00+00'),
(94, 26, 'abduction',     '{"pizza_page": "storage"}',                         '2023-07-15 10:15:00+00'),
(95, 27, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-08-10 09:00:00+00'),
(96, 27, 'abduction',     '{"pizza_page": "dashboard"}',                       '2023-08-10 09:15:00+00'),
(97, 27, 'teleport_fail', '{"endpoint": "/v1/analytics"}',                     '2023-08-10 10:00:00+00'),
(98, 28, 'complaint',     '{"pizza_page": "mobile"}',                          '2023-09-15 10:00:00+00'),
(99, 29, 'complaint',     '{"pizza_page": "desktop"}',                         '2023-10-10 11:00:00+00'),
(100, 29, 'teleport_fail','{"endpoint": "/v1/analytics"}',                     '2023-10-10 11:30:00+00'),
(101, 29, 'teleport_fail','{"endpoint": "/v1/reports"}',                       '2023-10-10 12:00:00+00'),
(102, 29, 'food_fight',   '{"format": "csv", "duration_seconds": 3000}',       '2023-10-10 12:30:00+00'),

-- Electroslice, Fizzbucket, Goopstreak incidents
(103, 30, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-11-10 08:00:00+00'),
(104, 30, 'abduction',    '{"pizza_page": "reports"}',                         '2023-11-10 08:15:00+00'),
(105, 31, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-11-25 09:00:00+00'),
(106, 32, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-12-10 10:00:00+00'),
(107, 32, 'abduction',    '{"pizza_page": "dashboard"}',                       '2023-12-10 10:10:00+00'),
(108, 32, 'food_fight',   '{"format": "csv", "duration_seconds": 600}',        '2023-12-10 10:30:00+00'),

-- More incidents for time-series patterns (monthly complaints for window function exercises)
(109,  1, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-06-15 10:00:00+00'),
(110,  1, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-07-20 10:00:00+00'),
(111,  1, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-08-18 10:00:00+00'),
(112,  1, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-09-15 10:00:00+00'),
(113,  1, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-10-20 10:00:00+00'),
(114,  1, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-11-15 10:00:00+00'),
(115,  1, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-12-18 10:00:00+00'),
(116,  1, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-01-15 10:00:00+00'),
(117,  1, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-02-20 10:00:00+00'),
(118,  1, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-03-18 10:00:00+00'),

(119,  3, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-06-20 09:00:00+00'),
(120,  3, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-07-15 09:00:00+00'),
(121,  3, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-08-22 09:00:00+00'),
(122,  3, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-09-18 09:00:00+00'),
(123,  3, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-10-16 09:00:00+00'),
(124,  3, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-11-20 09:00:00+00'),
(125,  3, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-12-15 09:00:00+00'),
(126,  3, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-01-22 09:00:00+00'),

-- Banned aliens' late incidents
(127, 41, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-04-10 09:00:00+00'),
(128, 41, 'abduction',    '{"pizza_page": "dashboard"}',                       '2023-04-10 09:10:00+00'),
(129, 42, 'complaint',    '{"pizza_page": "mobile"}',                          '2023-05-25 09:00:00+00'),
(130, 43, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-05-01 11:00:00+00'),
(131, 44, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-07-25 14:00:00+00'),
(132, 44, 'abduction',    '{"pizza_page": "reports"}',                         '2023-07-25 14:15:00+00'),
(133, 45, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-08-15 09:00:00+00'),

-- Jellybrain, Kablooey, Lumpkin, Mucusoid incidents
(134, 35, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-02-10 08:00:00+00'),
(135, 35, 'abduction',    '{"pizza_page": "dashboard"}',                       '2024-02-10 08:10:00+00'),
(136, 35, 'teleport_fail','{"endpoint": "/v1/analytics"}',                     '2024-02-10 09:00:00+00'),
(137, 36, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-02-20 10:00:00+00'),
(138, 36, 'teleport_fail','{"endpoint": "/v1/analytics"}',                     '2024-02-20 10:15:00+00'),
(139, 36, 'teleport_fail','{"endpoint": "/v1/reports"}',                       '2024-02-20 10:30:00+00'),
(140, 36, 'teleport_fail','{"endpoint": "/v1/export"}',                        '2024-02-20 11:00:00+00'),
(141, 37, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-03-10 09:00:00+00'),
(142, 38, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-03-25 11:00:00+00'),
(143, 38, 'abduction',    '{"pizza_page": "dashboard"}',                       '2024-03-25 11:10:00+00'),

-- Snacker aliens' minimal activity
(144, 33, 'complaint',    '{"pizza_page": "mobile"}',                          '2024-01-05 11:00:00+00'),
(145, 34, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-01-20 14:00:00+00'),
(146, 34, 'abduction',    '{"pizza_page": "dashboard"}',                       '2024-01-20 14:10:00+00'),
(147, 39, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-04-10 14:00:00+00'),
(148, 40, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-04-20 10:00:00+00'),
(149, 40, 'abduction',    '{"pizza_page": "dashboard"}',                       '2024-04-20 10:10:00+00'),

-- Extra abduction incidents for analytics
(150,  1, 'abduction',    '{"pizza_page": "integrations"}',                    '2023-05-22 10:00:00+00'),
(151,  3, 'abduction',    '{"pizza_page": "api_keys"}',                        '2023-04-20 09:00:00+00'),
(152,  7, 'abduction',    '{"pizza_page": "integrations"}',                    '2023-08-15 08:00:00+00'),
(153,  8, 'abduction',    '{"pizza_page": "api_keys"}',                        '2023-06-15 09:15:00+00'),
(154, 10, 'abduction',    '{"pizza_page": "integrations"}',                    '2023-06-10 12:00:00+00'),
(155, 17, 'abduction',    '{"pizza_page": "api_keys"}',                        '2023-07-10 11:15:00+00'),
(156, 29, 'abduction',    '{"pizza_page": "api_keys"}',                        '2023-10-10 13:00:00+00'),
(157, 36, 'abduction',    '{"pizza_page": "api_keys"}',                        '2024-02-20 11:30:00+00'),

-- Tip incidents (for conversion analysis)
(158,  5, 'tip',           '{"from": "free", "to": "starter"}',                '2023-04-15 08:15:00+00'),
(159,  6, 'tip',           '{"from": "free", "to": "starter"}',                '2023-04-20 16:20:00+00'),
(160, 13, 'tip',           '{"from": "free", "to": "starter"}',                '2023-04-01 09:15:00+00'),
(161, 19, 'tip',           '{"from": "free", "to": "starter"}',                '2023-08-10 09:15:00+00'),
(162, 21, 'tip',           '{"from": "free", "to": "starter"}',                '2023-08-01 10:15:00+00'),
(163, 22, 'tip',           '{"from": "free", "to": "starter"}',                '2023-08-15 09:15:00+00'),
(164, 23, 'tip',           '{"from": "free", "to": "starter"}',                '2023-09-01 11:15:00+00'),
(165, 33, 'tip',           '{"from": "free", "to": "starter"}',                '2024-01-05 11:15:00+00'),

-- Additional teleport_fail incidents for heavy users
(166,  3, 'teleport_fail','{"endpoint": "/v1/analytics"}',                     '2023-08-22 10:00:00+00'),
(167,  3, 'teleport_fail','{"endpoint": "/v1/reports"}',                       '2023-09-18 10:00:00+00'),
(168,  8, 'teleport_fail','{"endpoint": "/v1/analytics"}',                     '2023-08-20 11:00:00+00'),
(169,  8, 'teleport_fail','{"endpoint": "/v1/reports"}',                       '2023-11-15 09:00:00+00'),
(170, 17, 'teleport_fail','{"endpoint": "/v1/analytics"}',                     '2023-10-20 10:00:00+00'),
(171, 29, 'teleport_fail','{"endpoint": "/v1/export"}',                        '2024-01-25 10:00:00+00'),

-- Late 2024 incidents
(172,  1, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-04-15 10:00:00+00'),
(173,  1, 'abduction',    '{"pizza_page": "dashboard"}',                       '2024-04-15 10:10:00+00'),
(174,  3, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-04-15 09:00:00+00'),
(175,  3, 'teleport_fail','{"endpoint": "/v1/analytics"}',                     '2024-04-15 09:30:00+00'),
(176,  7, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-04-20 12:00:00+00'),
(177,  8, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-05-10 10:00:00+00'),
(178,  8, 'teleport_fail','{"endpoint": "/v1/analytics"}',                     '2024-05-10 10:15:00+00'),
(179, 17, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-02-05 09:00:00+00'),
(180, 17, 'teleport_fail','{"endpoint": "/v1/analytics"}',                     '2024-02-05 09:30:00+00'),

-- Fill to 200 with misc incidents
(181, 46, 'complaint',    '{"pizza_page": "mobile"}',                          '2024-04-01 10:00:00+00'),
(182, 47, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-04-15 11:00:00+00'),
(183, 48, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-05-01 09:00:00+00'),
(184, 49, 'complaint',    '{"pizza_page": "mobile"}',                          '2024-05-15 14:00:00+00'),
(185, 50, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-06-01 08:00:00+00'),
(186,  2, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-07-10 09:00:00+00'),
(187,  2, 'abduction',    '{"pizza_page": "storage"}',                         '2023-07-10 09:15:00+00'),
(188,  4, 'complaint',    '{"pizza_page": "desktop"}',                         '2023-11-20 10:00:00+00'),
(189,  4, 'abduction',    '{"pizza_page": "storage"}',                         '2023-11-20 10:15:00+00'),
(190,  6, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-01-10 09:00:00+00'),
(191,  9, 'abduction',    '{"pizza_page": "dashboard"}',                       '2023-09-25 10:15:00+00'),
(192, 10, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-01-05 09:00:00+00'),
(193, 16, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-03-10 08:00:00+00'),
(194, 18, 'abduction',    '{"pizza_page": "storage"}',                         '2023-07-20 14:15:00+00'),
(195, 20, 'abduction',    '{"pizza_page": "dashboard"}',                       '2023-12-10 08:10:00+00'),
(196, 27, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-01-20 09:00:00+00'),
(197, 30, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-02-20 08:00:00+00'),
(198, 32, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-03-15 09:00:00+00'),
(199, 35, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-04-05 08:00:00+00'),
(200, 38, 'complaint',    '{"pizza_page": "desktop"}',                         '2024-05-10 11:00:00+00');

SELECT setval('theme_silly.incidents_id_seq', 200);
