-- ============================================================
-- Sci-Fi Theme: Starfleet Command — Seed Data
-- MUST mirror 03-seed.sql exactly (same IDs, FKs, values, NULLs)
-- ============================================================

-- ============================================================
-- STARSHIPS (8 rows) — maps to products
-- class: fighter=analytics, cruiser=storage, freighter=integrations, explorer=support
-- cost_credits = price_cents
-- ============================================================
INSERT INTO theme_scifi.starships (id, name, class, cost_credits, created_at) VALUES
(1, 'Viper Mark I',           'fighter',    2900, '2023-01-01'),
(2, 'Viper Mark VII',         'fighter',    9900, '2023-01-01'),
(3, 'Sentinel',               'cruiser',    4900, '2023-01-01'),
(4, 'Dreadnought',            'cruiser',   19900, '2023-01-01'),
(5, 'Mule Runner',            'freighter',  1900, '2023-03-15'),
(6, 'Atlas Hauler',           'freighter',  4900, '2023-03-15'),
(7, 'Pathfinder',             'explorer',   9900, '2023-06-01'),
(8, 'Odyssey Prime',          'explorer',  29900, '2023-06-01');

SELECT setval('theme_scifi.starships_id_seq', 8);

-- ============================================================
-- CREW_MEMBERS (50 rows) — maps to users
-- rank: free=ensign, starter=lieutenant, pro=commander, enterprise=admiral
-- homeworld: US=Terra, UK=Nova Prime, DE=Kronos VII, FR=Centauri,
--   IN=Andoria, JP=Risa, AU=Bajor, BR=Vulcan, CA=Betazed, CN=Qo'noS,
--   IE=Trill, SE=Ferenginar, RU=Romulus, TW=Cardassia, PL=Denobula,
--   NG=Tellar, MX=Orion, KR=Rigel, VN=Bolarus, PK=Talax,
--   GR=Breen, NO=Xindus, ES=Rolor, CH=Benzar, BG=Argelius,
--   CY=Gideon, GH=Zakdorn, IT=Cait
-- callsign = military-style
-- ============================================================
INSERT INTO theme_scifi.crew_members (id, name, callsign, rank, homeworld, created_at, discharged_at) VALUES
-- Active crew, various ranks
( 1, 'Alice Martin',       'Phoenix-1',    'commander', 'Terra',       '2023-01-15 10:00:00+00', NULL),
( 2, 'Bob Chen',           'Raven-2',      'lieutenant','Nova Prime',  '2023-01-15 14:30:00+00', NULL),
( 3, 'Carol Davis',        'Valkyrie-3',   'admiral',   'Terra',       '2023-02-01 09:00:00+00', NULL),
( 4, 'David Kim',          'Falcon-4',     'commander', 'Kronos VII',  '2023-02-14 11:00:00+00', NULL),
( 5, 'Emma Wilson',        'Sparrow-5',    'ensign',    'Centauri',    '2023-03-01 08:00:00+00', NULL),
( 6, 'Frank Lopez',        'Hawk-6',       'lieutenant','Terra',       '2023-03-01 16:00:00+00', NULL),
( 7, 'Grace Patel',        'Eagle-7',      'commander', 'Andoria',     '2023-03-15 12:00:00+00', NULL),
( 8, 'Henry Brown',        'Condor-8',     'admiral',   'Nova Prime',  '2023-04-01 10:00:00+00', NULL),
( 9, 'Iris Nakamura',      'Wren-9',       'lieutenant','Risa',        '2023-04-15 09:00:00+00', NULL),
(10, 'Jack Thompson',      'Osprey-10',    'commander', 'Bajor',       '2023-05-01 11:00:00+00', NULL),

-- Discharged crew (churned)
(11, 'Karen Miller',       'Kestrel-11',   'lieutenant','Terra',       '2023-01-20 10:00:00+00', '2023-06-20 10:00:00+00'),
(12, 'Leo Garcia',         'Harrier-12',   'commander', 'Vulcan',      '2023-02-10 14:00:00+00', '2023-08-10 14:00:00+00'),
(13, 'Mia Anderson',       'Finch-13',     'ensign',    'Betazed',     '2023-03-05 09:00:00+00', '2023-05-05 09:00:00+00'),
(14, 'Noah Taylor',        'Tern-14',      'lieutenant','Nova Prime',  '2023-04-01 10:00:00+00', '2023-09-01 10:00:00+00'),
(15, 'Olivia Martinez',    'Starling-15',  'commander', 'Terra',       '2023-05-15 11:00:00+00', '2023-11-15 11:00:00+00'),

-- More active crew
(16, 'Peter Zhang',        'Merlin-16',    'commander', 'Qo''noS',    '2023-05-20 08:00:00+00', NULL),
(17, 'Quinn O''Brien',     'Raptor-17',    'admiral',   'Trill',       '2023-06-01 10:00:00+00', NULL),
(18, 'Rachel Santos',      'Swift-18',     'lieutenant','Vulcan',      '2023-06-15 14:00:00+00', NULL),
(19, 'Sam Johansson',      'Albatross-19', 'ensign',    'Ferenginar',  '2023-07-01 09:00:00+00', NULL),
(20, 'Tina Dubois',        'Pelican-20',   'commander', 'Centauri',    '2023-07-15 11:00:00+00', NULL),

-- Crew with NO missions (for LEFT JOIN IS NULL exercise)
(21, 'Uma Krishnan',       'Crane-21',     'ensign',    'Andoria',     '2023-08-01 10:00:00+00', NULL),
(22, 'Victor Petrov',      'Heron-22',     'ensign',    'Romulus',     '2023-08-15 09:00:00+00', NULL),
(23, 'Wendy Chang',        'Lark-23',      'ensign',    'Cardassia',   '2023-09-01 11:00:00+00', NULL),
(24, 'Xander Muller',      'Robin-24',     'ensign',    'Kronos VII',  '2023-09-15 14:00:00+00', NULL),
(25, 'Yuki Tanaka',        'Dove-25',      'ensign',    'Risa',        '2023-10-01 08:00:00+00', NULL),

-- Crew who share enlistment dates (for self-join exercise)
-- Same date as crew 1 and 2: Jan 15
-- Same date as crew 5 and 6: Mar 1
-- Same date as crew 8 and 14: Apr 1

-- More crew for volume
(26, 'Anna Kowalski',      'Magpie-26',    'lieutenant','Denobula',    '2023-06-01 10:00:00+00', NULL),
(27, 'Ben Okafor',         'Vulture-27',   'commander', 'Tellar',      '2023-07-01 09:00:00+00', NULL),
(28, 'Clara Rivera',       'Ibis-28',      'lieutenant','Orion',       '2023-08-01 10:00:00+00', NULL),
(29, 'Derek Singh',        'Griffin-29',   'admiral',   'Andoria',     '2023-09-01 11:00:00+00', NULL),
(30, 'Elena Volkov',       'Peregrine-30', 'commander', 'Romulus',     '2023-10-01 08:00:00+00', NULL),

(31, 'Finn Larsson',       'Jay-31',       'lieutenant','Ferenginar',  '2023-10-15 09:00:00+00', NULL),
(32, 'Gina Rossi',         'Oriole-32',    'commander', 'Cait',        '2023-11-01 10:00:00+00', NULL),
(33, 'Hector Morales',     'Thrush-33',    'ensign',    'Argelius',    '2023-11-15 11:00:00+00', NULL),
(34, 'Isla MacLeod',       'Plover-34',    'lieutenant','Nova Prime',  '2023-12-01 14:00:00+00', NULL),
(35, 'James Park',         'Gannet-35',    'commander', 'Rigel',       '2024-01-01 08:00:00+00', NULL),

(36, 'Kate Nguyen',        'Stork-36',     'admiral',   'Bolarus',     '2024-01-15 10:00:00+00', NULL),
(37, 'Liam Fischer',       'Sandpiper-37', 'lieutenant','Kronos VII',  '2024-02-01 09:00:00+00', NULL),
(38, 'Maya Ali',           'Kingfisher-38','commander', 'Talax',       '2024-02-15 11:00:00+00', NULL),
(39, 'Nick Papadopoulos',  'Cormorant-39', 'ensign',    'Breen',       '2024-03-01 14:00:00+00', NULL),
(40, 'Olivia Bjork',       'Curlew-40',    'lieutenant','Xindus',      '2024-03-15 10:00:00+00', NULL),

-- Discharged crew (more)
(41, 'Paula Fernandez',    'Nighthawk-41', 'commander', 'Rolor',       '2023-03-01 09:00:00+00', '2023-09-01 09:00:00+00'),
(42, 'Raj Gupta',          'Partridge-42', 'lieutenant','Andoria',     '2023-04-15 09:00:00+00', '2023-10-15 09:00:00+00'),
(43, 'Sara Eriksson',      'Swallow-43',   'ensign',    'Ferenginar',  '2023-05-01 11:00:00+00', '2023-07-01 11:00:00+00'),
(44, 'Tom Williams',       'Buzzard-44',   'commander', 'Bajor',       '2023-06-15 14:00:00+00', '2024-01-15 14:00:00+00'),
(45, 'Ursula Weber',       'Bittern-45',   'lieutenant','Benzar',      '2023-07-01 09:00:00+00', '2024-02-01 09:00:00+00'),

-- Ensigns who never got deployed (no deployments or missions)
(46, 'Val Antonov',        'Pipit-46',     'ensign',    'Argelius',    '2024-04-01 10:00:00+00', NULL),
(47, 'Wes Hoffman',        'Dunlin-47',    'ensign',    'Terra',       '2024-04-15 11:00:00+00', NULL),
(48, 'Xena Christou',      'Avocet-48',    'ensign',    'Gideon',      '2024-05-01 09:00:00+00', NULL),
(49, 'Yves Dupont',        'Dotterel-49',  'ensign',    'Centauri',    '2024-05-15 14:00:00+00', NULL),
(50, 'Zara Osei',          'Lapwing-50',   'ensign',    'Zakdorn',     '2024-06-01 08:00:00+00', NULL);

SELECT setval('theme_scifi.crew_members_id_seq', 50);

-- ============================================================
-- MISSIONS (80 rows) — maps to orders
-- status: completed=success, refunded=failed, pending=pending
-- total_cents = reward_credits, created_at = created_at
-- Crew 21-25 and 46-50 have NO missions (for LEFT JOIN exercise)
-- ============================================================
INSERT INTO theme_scifi.missions (id, crew_id, reward_credits, status, created_at) VALUES
-- Alice / crew 1 — 4 missions
( 1,  1, 12800, 'success', '2023-02-10 10:00:00+00'),
( 2,  1,  9900, 'success', '2023-05-22 14:00:00+00'),
( 3,  1, 24800, 'success', '2023-09-15 11:00:00+00'),
( 4,  1,  4900, 'failed',  '2023-12-01 09:00:00+00'),

-- Bob / crew 2 — 2 missions
( 5,  2,  2900, 'success', '2023-02-20 09:00:00+00'),
( 6,  2,  6800, 'success', '2023-07-10 15:00:00+00'),

-- Carol / crew 3 — 5 missions (high-value admiral)
( 7,  3, 39800, 'success', '2023-02-15 10:00:00+00'),
( 8,  3, 29900, 'success', '2023-04-20 11:00:00+00'),
( 9,  3, 34800, 'success', '2023-07-12 14:00:00+00'),
(10,  3, 49800, 'success', '2023-10-05 09:00:00+00'),
(11,  3, 29900, 'success', '2024-01-15 10:00:00+00'),

-- David / crew 4 — 3 missions
(12,  4,  9900, 'success', '2023-03-10 11:00:00+00'),
(13,  4, 14800, 'success', '2023-06-25 14:00:00+00'),
(14,  4,  4900, 'pending', '2023-11-20 09:00:00+00'),

-- Emma / crew 5 — 1 mission
(15,  5,  2900, 'success', '2023-04-15 08:00:00+00'),

-- Frank / crew 6 — 2 missions
(16,  6,  7800, 'success', '2023-04-20 16:00:00+00'),
(17,  6,  4900, 'success', '2023-08-10 10:00:00+00'),

-- Grace / crew 7 — 3 missions
(18,  7, 14800, 'success', '2023-04-25 12:00:00+00'),
(19,  7,  9900, 'success', '2023-08-15 09:00:00+00'),
(20,  7, 19800, 'success', '2024-01-10 14:00:00+00'),

-- Henry / crew 8 — 4 missions
(21,  8, 39800, 'success', '2023-05-10 10:00:00+00'),
(22,  8, 29900, 'success', '2023-08-20 11:00:00+00'),
(23,  8, 49800, 'success', '2023-11-15 14:00:00+00'),
(24,  8, 29900, 'failed',  '2024-02-10 09:00:00+00'),

-- Iris / crew 9 — 2 missions
(25,  9,  4900, 'success', '2023-05-20 09:00:00+00'),
(26,  9,  2900, 'success', '2023-09-25 14:00:00+00'),

-- Jack / crew 10 — 3 missions
(27, 10, 12800, 'success', '2023-06-10 11:00:00+00'),
(28, 10,  9900, 'success', '2023-09-20 10:00:00+00'),
(29, 10,  4900, 'success', '2024-01-05 14:00:00+00'),

-- Karen / crew 11 (discharged) — 2 missions before discharge
(30, 11,  2900, 'success', '2023-02-25 10:00:00+00'),
(31, 11,  4900, 'success', '2023-05-15 11:00:00+00'),

-- Leo / crew 12 (discharged) — 3 missions
(32, 12, 14800, 'success', '2023-03-20 14:00:00+00'),
(33, 12,  9900, 'success', '2023-06-10 09:00:00+00'),
(34, 12,  4900, 'failed',  '2023-07-25 11:00:00+00'),

-- Mia / crew 13 (discharged) — 1 mission
(35, 13,  2900, 'success', '2023-04-01 09:00:00+00'),

-- Noah / crew 14 (discharged) — 2 missions
(36, 14,  7800, 'success', '2023-05-10 10:00:00+00'),
(37, 14,  4900, 'success', '2023-08-01 14:00:00+00'),

-- Olivia / crew 15 (discharged) — 2 missions
(38, 15, 14800, 'success', '2023-06-20 11:00:00+00'),
(39, 15,  9900, 'success', '2023-09-15 09:00:00+00'),

-- Peter / crew 16 — 2 missions
(40, 16,  9900, 'success', '2023-06-25 08:00:00+00'),
(41, 16, 19800, 'success', '2023-10-15 14:00:00+00'),

-- Quinn / crew 17 — 3 missions
(42, 17, 39800, 'success', '2023-07-10 10:00:00+00'),
(43, 17, 29900, 'success', '2023-10-20 11:00:00+00'),
(44, 17, 49800, 'success', '2024-02-05 09:00:00+00'),

-- Rachel / crew 18 — 1 mission
(45, 18,  4900, 'success', '2023-07-20 14:00:00+00'),

-- Sam / crew 19 — 1 mission
(46, 19,  2900, 'success', '2023-08-10 09:00:00+00'),

-- Tina / crew 20 — 2 missions
(47, 20, 14800, 'success', '2023-08-25 11:00:00+00'),
(48, 20,  9900, 'success', '2023-12-10 14:00:00+00'),

-- Anna / crew 26 — 2 missions
(49, 26,  4900, 'success', '2023-07-15 10:00:00+00'),
(50, 26,  7800, 'success', '2023-11-20 09:00:00+00'),

-- Ben / crew 27 — 2 missions
(51, 27, 12800, 'success', '2023-08-10 09:00:00+00'),
(52, 27,  9900, 'success', '2024-01-20 14:00:00+00'),

-- Clara / crew 28 — 1 mission
(53, 28,  4900, 'success', '2023-09-15 10:00:00+00'),

-- Derek / crew 29 — 3 missions
(54, 29, 39800, 'success', '2023-10-10 11:00:00+00'),
(55, 29, 29900, 'success', '2024-01-25 09:00:00+00'),
(56, 29, 19800, 'success', '2024-03-10 14:00:00+00'),

-- Elena / crew 30 — 2 missions
(57, 30,  9900, 'success', '2023-11-10 08:00:00+00'),
(58, 30, 14800, 'success', '2024-02-20 10:00:00+00'),

-- Finn / crew 31 — 1 mission
(59, 31,  4900, 'success', '2023-11-25 09:00:00+00'),

-- Gina / crew 32 — 2 missions
(60, 32, 12800, 'success', '2023-12-10 10:00:00+00'),
(61, 32,  9900, 'success', '2024-03-15 11:00:00+00'),

-- Hector / crew 33 — 1 mission
(62, 33,  2900, 'success', '2024-01-05 11:00:00+00'),

-- Isla / crew 34 — 1 mission
(63, 34,  7800, 'success', '2024-01-20 14:00:00+00'),

-- James / crew 35 — 2 missions
(64, 35, 14800, 'success', '2024-02-10 08:00:00+00'),
(65, 35,  9900, 'success', '2024-04-05 10:00:00+00'),

-- Kate / crew 36 — 2 missions
(66, 36, 49800, 'success', '2024-02-20 10:00:00+00'),
(67, 36, 29900, 'success', '2024-05-10 09:00:00+00'),

-- Liam / crew 37 — 1 mission
(68, 37,  4900, 'success', '2024-03-10 09:00:00+00'),

-- Maya / crew 38 — 1 mission
(69, 38, 12800, 'success', '2024-03-25 11:00:00+00'),

-- Paula / crew 41 (discharged) — 1 mission
(70, 41,  9900, 'success', '2023-04-10 09:00:00+00'),

-- Raj / crew 42 (discharged) — 1 mission
(71, 42,  4900, 'success', '2023-05-25 09:00:00+00'),

-- Tom / crew 44 (discharged) — 2 missions
(72, 44, 14800, 'success', '2023-07-25 14:00:00+00'),
(73, 44,  9900, 'success', '2023-11-10 10:00:00+00'),

-- Ursula / crew 45 (discharged) — 1 mission
(74, 45,  4900, 'success', '2023-08-15 09:00:00+00'),

-- Nick / crew 39 — 1 small mission
(75, 39,  2900, 'pending', '2024-04-10 14:00:00+00'),

-- Olivia B / crew 40 — 1 mission
(76, 40,  7800, 'success', '2024-04-20 10:00:00+00'),

-- Extra missions for time-series analysis
(77,  1, 14800, 'success', '2024-03-10 10:00:00+00'),
(78,  3, 39800, 'success', '2024-04-15 11:00:00+00'),
(79,  7, 12800, 'success', '2024-04-20 14:00:00+00'),
(80,  8, 49800, 'success', '2024-05-10 09:00:00+00');

SELECT setval('theme_scifi.missions_id_seq', 80);

-- ============================================================
-- MISSION_OBJECTIVES (118 rows) — maps to order_items
-- mission_id = order_id, starship_id = product_id
-- bounty_credits = unit_price_cents
-- ============================================================
INSERT INTO theme_scifi.mission_objectives (id, mission_id, starship_id, quantity, bounty_credits) VALUES
-- Alice missions
( 1,  1, 1, 1,  2900), ( 2,  1, 3, 1,  4900), ( 3,  1, 5, 1,  1900),  -- mission 1: viper I + sentinel + mule runner
( 4,  2, 2, 1,  9900),                                                   -- mission 2: viper VII
( 5,  3, 2, 1,  9900), ( 6,  3, 4, 1, 19900),                           -- mission 3: viper VII + dreadnought
( 7,  4, 3, 1,  4900),                                                   -- mission 4: sentinel (failed)

-- Bob missions
( 8,  5, 1, 1,  2900),                                                   -- mission 5: viper I
( 9,  6, 1, 1,  2900), (10,  6, 5, 1,  1900),                           -- mission 6: viper I + mule runner

-- Carol missions (admiral, high-value)
(11,  7, 2, 1,  9900), (12,  7, 4, 1, 19900), (13,  7, 8, 1, 29900),   -- mission 7: viper VII + dreadnought + odyssey prime
(14,  8, 8, 1, 29900),                                                   -- mission 8: odyssey prime renewal
(15,  9, 2, 1,  9900), (16,  9, 6, 1,  4900), (17,  9, 4, 1, 19900),   -- mission 9: viper VII + atlas hauler + dreadnought
(18, 10, 8, 1, 29900), (19, 10, 4, 1, 19900),                           -- mission 10: odyssey prime + dreadnought
(20, 11, 8, 1, 29900),                                                   -- mission 11: odyssey prime renewal

-- David missions
(21, 12, 2, 1,  9900),                                                   -- mission 12: viper VII
(22, 13, 2, 1,  9900), (23, 13, 3, 1,  4900),                           -- mission 13: viper VII + sentinel
(24, 14, 3, 1,  4900),                                                   -- mission 14: sentinel (pending)

-- Emma mission
(25, 15, 1, 1,  2900),                                                   -- mission 15: viper I

-- Frank missions
(26, 16, 1, 1,  2900), (27, 16, 3, 1,  4900),                           -- mission 16: viper I + sentinel
(28, 17, 3, 1,  4900),                                                   -- mission 17: sentinel

-- Grace missions
(29, 18, 2, 1,  9900), (30, 18, 3, 1,  4900),                           -- mission 18: viper VII + sentinel
(31, 19, 2, 1,  9900),                                                   -- mission 19: viper VII
(32, 20, 2, 1,  9900), (33, 20, 4, 1, 19900),                           -- mission 20: viper VII + dreadnought

-- Henry missions (admiral)
(34, 21, 2, 1,  9900), (35, 21, 8, 1, 29900),                           -- mission 21: viper VII + odyssey prime
(36, 22, 8, 1, 29900),                                                   -- mission 22: odyssey prime
(37, 23, 8, 1, 29900), (38, 23, 4, 1, 19900),                           -- mission 23: odyssey prime + dreadnought
(39, 24, 8, 1, 29900),                                                   -- mission 24: odyssey prime (failed)

-- Iris missions
(40, 25, 3, 1,  4900),                                                   -- mission 25: sentinel
(41, 26, 1, 1,  2900),                                                   -- mission 26: viper I

-- Jack missions
(42, 27, 2, 1,  9900), (43, 27, 5, 1,  1900),                           -- mission 27: viper VII + mule runner
(44, 28, 2, 1,  9900),                                                   -- mission 28: viper VII
(45, 29, 3, 1,  4900),                                                   -- mission 29: sentinel

-- Karen (discharged) missions
(46, 30, 1, 1,  2900),                                                   -- mission 30: viper I
(47, 31, 3, 1,  4900),                                                   -- mission 31: sentinel

-- Leo (discharged) missions
(48, 32, 2, 1,  9900), (49, 32, 3, 1,  4900),                           -- mission 32: viper VII + sentinel
(50, 33, 2, 1,  9900),                                                   -- mission 33: viper VII
(51, 34, 3, 1,  4900),                                                   -- mission 34: sentinel (failed)

-- Mia (discharged) mission
(52, 35, 1, 1,  2900),                                                   -- mission 35: viper I

-- Noah (discharged) missions
(53, 36, 1, 1,  2900), (54, 36, 3, 1,  4900),                           -- mission 36: viper I + sentinel
(55, 37, 3, 1,  4900),                                                   -- mission 37: sentinel

-- Olivia (discharged) missions
(56, 38, 2, 1,  9900), (57, 38, 3, 1,  4900),                           -- mission 38: viper VII + sentinel
(58, 39, 2, 1,  9900),                                                   -- mission 39: viper VII

-- Peter missions
(59, 40, 2, 1,  9900),                                                   -- mission 40: viper VII
(60, 41, 2, 1,  9900), (61, 41, 4, 1, 19900),                           -- mission 41: viper VII + dreadnought

-- Quinn missions (admiral)
(62, 42, 2, 1,  9900), (63, 42, 8, 1, 29900),                           -- mission 42: viper VII + odyssey prime
(64, 43, 8, 1, 29900),                                                   -- mission 43: odyssey prime
(65, 44, 8, 1, 29900), (66, 44, 4, 1, 19900),                           -- mission 44: odyssey prime + dreadnought

-- Rachel, Sam, Tina
(67, 45, 3, 1,  4900),                                                   -- mission 45: sentinel
(68, 46, 1, 1,  2900),                                                   -- mission 46: viper I
(69, 47, 2, 1,  9900), (70, 47, 5, 1,  1900),                           -- mission 47: viper VII + mule runner
(71, 48, 2, 1,  9900),                                                   -- mission 48: viper VII

-- Anna, Ben, Clara, Derek, Elena, Finn, Gina, Hector, Isla, James, Kate, Liam, Maya
(72, 49, 3, 1,  4900),                                                   -- Anna mission 1
(73, 50, 1, 1,  2900), (74, 50, 3, 1,  4900),                           -- Anna mission 2
(75, 51, 2, 1,  9900), (76, 51, 5, 1,  1900),                           -- Ben mission 1
(77, 52, 2, 1,  9900),                                                   -- Ben mission 2
(78, 53, 3, 1,  4900),                                                   -- Clara mission
(79, 54, 2, 1,  9900), (80, 54, 8, 1, 29900),                           -- Derek mission 1
(81, 55, 8, 1, 29900),                                                   -- Derek mission 2
(82, 56, 4, 1, 19900),                                                   -- Derek mission 3
(83, 57, 2, 1,  9900),                                                   -- Elena mission 1
(84, 58, 2, 1,  9900), (85, 58, 3, 1,  4900),                           -- Elena mission 2
(86, 59, 3, 1,  4900),                                                   -- Finn mission
(87, 60, 2, 1,  9900), (88, 60, 5, 1,  1900),                           -- Gina mission 1
(89, 61, 2, 1,  9900),                                                   -- Gina mission 2
(90, 62, 1, 1,  2900),                                                   -- Hector mission
(91, 63, 1, 1,  2900), (92, 63, 3, 1,  4900),                           -- Isla mission
(93, 64, 2, 1,  9900), (94, 64, 3, 1,  4900),                           -- James mission 1
(95, 65, 2, 1,  9900),                                                   -- James mission 2
(96, 66, 8, 1, 29900), (97, 66, 4, 1, 19900),                           -- Kate mission 1
(98, 67, 8, 1, 29900),                                                   -- Kate mission 2
(99, 68, 3, 1,  4900),                                                   -- Liam mission
(100, 69, 2, 1, 9900), (101, 69, 5, 1, 1900),                           -- Maya mission

-- Discharged crew missions
(102, 70, 2, 1,  9900),                                                  -- Paula mission
(103, 71, 3, 1,  4900),                                                  -- Raj mission
(104, 72, 2, 1,  9900), (105, 72, 3, 1,  4900),                         -- Tom mission 1
(106, 73, 2, 1,  9900),                                                  -- Tom mission 2
(107, 74, 3, 1,  4900),                                                  -- Ursula mission

-- Nick (pending), Olivia B
(108, 75, 1, 1,  2900),                                                  -- Nick mission (pending)
(109, 76, 1, 1,  2900), (110, 76, 3, 1, 4900),                          -- Olivia B mission

-- Extra time-series missions
(111, 77, 2, 1,  9900), (112, 77, 3, 1, 4900),                          -- Alice extra
(113, 78, 2, 1,  9900), (114, 78, 8, 1, 29900),                         -- Carol extra
(115, 79, 2, 1,  9900), (116, 79, 5, 1, 1900),                          -- Grace extra
(117, 80, 8, 1, 29900), (118, 80, 4, 1, 19900);                         -- Henry extra

SELECT setval('theme_scifi.mission_objectives_id_seq', 118);

-- ============================================================
-- DEPLOYMENTS (60 rows) — maps to subscriptions
-- status: active=active, cancelled=completed, trialing=standby, past_due=aborted
-- crew_id = user_id, starship_id = product_id
-- daily_pay = mrr_cents, ended_at = cancelled_at
-- ============================================================
INSERT INTO theme_scifi.deployments (id, crew_id, starship_id, status, started_at, ended_at, daily_pay) VALUES
-- Active deployments
( 1,  1, 2, 'active',    '2023-02-10', NULL,          9900),  -- Alice: Viper VII
( 2,  1, 4, 'active',    '2023-09-15', NULL,         19900),  -- Alice: Dreadnought
( 3,  2, 1, 'active',    '2023-02-20', NULL,          2900),  -- Bob: Viper I
( 4,  3, 2, 'active',    '2023-02-15', NULL,          9900),  -- Carol: Viper VII
( 5,  3, 8, 'active',    '2023-02-15', NULL,         29900),  -- Carol: Odyssey Prime
( 6,  3, 4, 'active',    '2023-07-12', NULL,         19900),  -- Carol: Dreadnought
( 7,  4, 2, 'active',    '2023-03-10', NULL,          9900),  -- David: Viper VII
( 8,  6, 1, 'active',    '2023-04-20', NULL,          2900),  -- Frank: Viper I
( 9,  7, 2, 'active',    '2023-04-25', NULL,          9900),  -- Grace: Viper VII
(10,  8, 2, 'active',    '2023-05-10', NULL,          9900),  -- Henry: Viper VII
(11,  8, 8, 'active',    '2023-05-10', NULL,         29900),  -- Henry: Odyssey Prime
(12, 10, 2, 'active',    '2023-06-10', NULL,          9900),  -- Jack: Viper VII
(13, 16, 2, 'active',    '2023-06-25', NULL,          9900),  -- Peter: Viper VII
(14, 17, 2, 'active',    '2023-07-10', NULL,          9900),  -- Quinn: Viper VII
(15, 17, 8, 'active',    '2023-07-10', NULL,         29900),  -- Quinn: Odyssey Prime
(16, 20, 2, 'active',    '2023-08-25', NULL,          9900),  -- Tina: Viper VII
(17, 27, 2, 'active',    '2023-08-10', NULL,          9900),  -- Ben: Viper VII
(18, 29, 2, 'active',    '2023-10-10', NULL,          9900),  -- Derek: Viper VII
(19, 29, 8, 'active',    '2023-10-10', NULL,         29900),  -- Derek: Odyssey Prime
(20, 30, 2, 'active',    '2023-11-10', NULL,          9900),  -- Elena: Viper VII
(21, 32, 2, 'active',    '2023-12-10', NULL,          9900),  -- Gina: Viper VII
(22, 35, 2, 'active',    '2024-02-10', NULL,          9900),  -- James: Viper VII
(23, 36, 8, 'active',    '2024-02-20', NULL,         29900),  -- Kate: Odyssey Prime
(24, 36, 4, 'active',    '2024-02-20', NULL,         19900),  -- Kate: Dreadnought
(25, 38, 2, 'active',    '2024-03-25', NULL,          9900),  -- Maya: Viper VII

-- Completed deployments (discharged crew)
(26, 11, 1, 'completed', '2023-02-25', '2023-06-20',  0),     -- Karen: Viper I (discharged)
(27, 12, 2, 'completed', '2023-03-20', '2023-08-10',  0),     -- Leo: Viper VII (discharged)
(28, 13, 1, 'completed', '2023-04-01', '2023-05-05',  0),     -- Mia: Viper I (discharged)
(29, 14, 1, 'completed', '2023-05-10', '2023-09-01',  0),     -- Noah: Viper I (discharged)
(30, 15, 2, 'completed', '2023-06-20', '2023-11-15',  0),     -- Olivia: Viper VII (discharged)
(31, 41, 2, 'completed', '2023-04-10', '2023-09-01',  0),     -- Paula: Viper VII (discharged)
(32, 42, 3, 'completed', '2023-05-25', '2023-10-15',  0),     -- Raj: Sentinel (discharged)
(33, 43, 1, 'completed', '2023-05-01', '2023-07-01',  0),     -- Sara: Viper I (discharged)
(34, 44, 2, 'completed', '2023-07-25', '2024-01-15',  0),     -- Tom: Viper VII (discharged)
(35, 45, 3, 'completed', '2023-08-15', '2024-02-01',  0),     -- Ursula: Sentinel (discharged)

-- Standby deployments (newer crew)
(36, 37, 1, 'standby',   '2024-03-10', NULL,          0),     -- Liam: Viper I (standby)
(37, 39, 1, 'standby',   '2024-04-10', NULL,          0),     -- Nick: Viper I (standby)
(38, 40, 1, 'standby',   '2024-04-20', NULL,          0),     -- Olivia B: Viper I (standby)

-- Aborted
(39,  9, 1, 'aborted',   '2023-05-20', NULL,          2900),  -- Iris: Viper I (aborted)
(40, 18, 3, 'aborted',   '2023-07-20', NULL,          4900),  -- Rachel: Sentinel (aborted)

-- More active deployments for data volume
(41,  1, 5, 'active',    '2023-05-22', NULL,          1900),  -- Alice: Mule Runner
(42,  7, 3, 'active',    '2023-04-25', NULL,          4900),  -- Grace: Sentinel
(43, 10, 5, 'active',    '2023-06-10', NULL,          1900),  -- Jack: Mule Runner
(44,  2, 5, 'active',    '2023-07-10', NULL,          1900),  -- Bob: Mule Runner
(45,  6, 3, 'active',    '2023-04-20', NULL,          4900),  -- Frank: Sentinel
(46, 20, 5, 'active',    '2023-08-25', NULL,          1900),  -- Tina: Mule Runner
(47, 26, 3, 'active',    '2023-07-15', NULL,          4900),  -- Anna: Sentinel
(48, 28, 3, 'active',    '2023-09-15', NULL,          4900),  -- Clara: Sentinel
(49, 31, 3, 'active',    '2023-11-25', NULL,          4900),  -- Finn: Sentinel
(50, 34, 1, 'active',    '2024-01-20', NULL,          2900),  -- Isla: Viper I

-- Upgraded deployments (had basic, now advanced)
(51,  4, 1, 'completed', '2023-03-10', '2023-06-25',  0),     -- David: had Viper I, completed when upgraded
(52,  4, 3, 'active',    '2023-06-25', NULL,          4900),  -- David: Sentinel
(53, 16, 4, 'active',    '2023-10-15', NULL,         19900),  -- Peter: Dreadnought (added later)
(54,  8, 4, 'active',    '2023-11-15', NULL,         19900),  -- Henry: Dreadnought (added later)
(55, 32, 5, 'active',    '2023-12-10', NULL,          1900),  -- Gina: Mule Runner
(56, 35, 3, 'active',    '2024-02-10', NULL,          4900),  -- James: Sentinel
(57, 38, 5, 'active',    '2024-03-25', NULL,          1900),  -- Maya: Mule Runner
(58, 27, 5, 'active',    '2023-08-10', NULL,          1900),  -- Ben: Mule Runner
(59, 30, 3, 'active',    '2023-11-10', NULL,          4900),  -- Elena: Sentinel
(60, 17, 4, 'active',    '2023-10-20', NULL,         19900);  -- Quinn: Dreadnought

SELECT setval('theme_scifi.deployments_id_seq', 60);

-- ============================================================
-- SENSOR_LOGS (200 rows) — maps to events
-- log_type: login=scan, feature_used=combat, export=repair, api_call=warp_jump, upgrade_prompt_shown=anomaly
-- crew_id = user_id, recorded_at = occurred_at
-- SAME JSONB structure and timestamps
-- ============================================================
INSERT INTO theme_scifi.sensor_logs (id, crew_id, log_type, properties, recorded_at) VALUES
-- Alice sensor logs (crew 1)
( 1,  1, 'scan',        '{"device": "desktop"}',                   '2023-02-10 10:05:00+00'),
( 2,  1, 'combat',      '{"feature": "dashboard"}',                '2023-02-10 10:15:00+00'),
( 3,  1, 'combat',      '{"feature": "reports"}',                  '2023-02-10 11:00:00+00'),
( 4,  1, 'repair',      '{"format": "csv", "rows": 1500}',        '2023-02-10 11:30:00+00'),
( 5,  1, 'scan',        '{"device": "mobile"}',                    '2023-03-15 08:00:00+00'),
( 6,  1, 'combat',      '{"feature": "dashboard"}',                '2023-03-15 08:10:00+00'),
( 7,  1, 'warp_jump',   '{"endpoint": "/v1/analytics"}',           '2023-04-20 14:00:00+00'),
( 8,  1, 'warp_jump',   '{"endpoint": "/v1/reports"}',             '2023-04-20 14:30:00+00'),
( 9,  1, 'scan',        '{"device": "desktop"}',                   '2023-05-22 09:00:00+00'),
(10,  1, 'anomaly',     '{"from": "starter", "to": "pro"}',       '2023-05-22 09:15:00+00'),

-- Bob sensor logs (crew 2)
(11,  2, 'scan',        '{"device": "desktop"}',                   '2023-02-20 09:00:00+00'),
(12,  2, 'combat',      '{"feature": "dashboard"}',                '2023-02-20 09:10:00+00'),
(13,  2, 'scan',        '{"device": "desktop"}',                   '2023-03-10 10:00:00+00'),
(14,  2, 'combat',      '{"feature": "reports"}',                  '2023-03-10 10:30:00+00'),
(15,  2, 'repair',      '{"format": "pdf", "rows": 200}',         '2023-03-10 11:00:00+00'),

-- Carol sensor logs (crew 3 — heavy user)
(16,  3, 'scan',        '{"device": "desktop"}',                   '2023-02-15 09:00:00+00'),
(17,  3, 'combat',      '{"feature": "dashboard"}',                '2023-02-15 09:10:00+00'),
(18,  3, 'warp_jump',   '{"endpoint": "/v1/analytics"}',           '2023-02-15 10:00:00+00'),
(19,  3, 'warp_jump',   '{"endpoint": "/v1/reports"}',             '2023-02-15 10:30:00+00'),
(20,  3, 'warp_jump',   '{"endpoint": "/v1/export"}',              '2023-02-15 11:00:00+00'),
(21,  3, 'scan',        '{"device": "desktop"}',                   '2023-03-20 09:00:00+00'),
(22,  3, 'combat',      '{"feature": "integrations"}',             '2023-03-20 09:30:00+00'),
(23,  3, 'scan',        '{"device": "mobile"}',                    '2023-04-20 08:00:00+00'),
(24,  3, 'warp_jump',   '{"endpoint": "/v1/analytics"}',           '2023-05-10 14:00:00+00'),
(25,  3, 'repair',      '{"format": "csv", "rows": 5000}',        '2023-05-10 14:30:00+00'),

-- David sensor logs (crew 4)
(26,  4, 'scan',        '{"device": "desktop"}',                   '2023-03-10 11:00:00+00'),
(27,  4, 'combat',      '{"feature": "dashboard"}',                '2023-03-10 11:15:00+00'),
(28,  4, 'anomaly',     '{"from": "starter", "to": "pro"}',       '2023-03-10 11:30:00+00'),
(29,  4, 'scan',        '{"device": "desktop"}',                   '2023-06-25 09:00:00+00'),
(30,  4, 'combat',      '{"feature": "reports"}',                  '2023-06-25 09:30:00+00'),

-- Emma sensor logs (crew 5 — light user)
(31,  5, 'scan',        '{"device": "mobile"}',                    '2023-04-15 08:00:00+00'),
(32,  5, 'combat',      '{"feature": "dashboard"}',                '2023-04-15 08:10:00+00'),

-- Frank sensor logs (crew 6)
(33,  6, 'scan',        '{"device": "desktop"}',                   '2023-04-20 16:00:00+00'),
(34,  6, 'combat',      '{"feature": "dashboard"}',                '2023-04-20 16:15:00+00'),
(35,  6, 'combat',      '{"feature": "storage"}',                  '2023-04-20 16:30:00+00'),
(36,  6, 'scan',        '{"device": "desktop"}',                   '2023-08-10 09:00:00+00'),

-- Grace sensor logs (crew 7)
(37,  7, 'scan',        '{"device": "desktop"}',                   '2023-04-25 12:00:00+00'),
(38,  7, 'combat',      '{"feature": "dashboard"}',                '2023-04-25 12:10:00+00'),
(39,  7, 'combat',      '{"feature": "reports"}',                  '2023-04-25 12:30:00+00'),
(40,  7, 'repair',      '{"format": "csv", "rows": 800}',         '2023-04-25 13:00:00+00'),
(41,  7, 'scan',        '{"device": "mobile"}',                    '2023-08-15 07:00:00+00'),
(42,  7, 'warp_jump',   '{"endpoint": "/v1/analytics"}',           '2023-08-15 07:30:00+00'),

-- Henry sensor logs (crew 8 — admiral, heavy warp_jump)
(43,  8, 'scan',        '{"device": "desktop"}',                   '2023-05-10 10:00:00+00'),
(44,  8, 'warp_jump',   '{"endpoint": "/v1/analytics"}',           '2023-05-10 10:15:00+00'),
(45,  8, 'warp_jump',   '{"endpoint": "/v1/reports"}',             '2023-05-10 10:30:00+00'),
(46,  8, 'warp_jump',   '{"endpoint": "/v1/export"}',              '2023-05-10 11:00:00+00'),
(47,  8, 'warp_jump',   '{"endpoint": "/v1/analytics"}',           '2023-06-15 09:00:00+00'),
(48,  8, 'warp_jump',   '{"endpoint": "/v1/analytics"}',           '2023-07-20 14:00:00+00'),
(49,  8, 'scan',        '{"device": "desktop"}',                   '2023-08-20 10:00:00+00'),
(50,  8, 'repair',      '{"format": "json", "rows": 10000}',      '2023-08-20 10:30:00+00'),

-- Iris sensor logs (crew 9)
(51,  9, 'scan',        '{"device": "desktop"}',                   '2023-05-20 09:00:00+00'),
(52,  9, 'combat',      '{"feature": "dashboard"}',                '2023-05-20 09:15:00+00'),
(53,  9, 'scan',        '{"device": "desktop"}',                   '2023-09-25 10:00:00+00'),

-- Jack sensor logs (crew 10)
(54, 10, 'scan',        '{"device": "desktop"}',                   '2023-06-10 11:00:00+00'),
(55, 10, 'combat',      '{"feature": "dashboard"}',                '2023-06-10 11:10:00+00'),
(56, 10, 'combat',      '{"feature": "reports"}',                  '2023-06-10 11:30:00+00'),
(57, 10, 'scan',        '{"device": "mobile"}',                    '2023-09-20 08:00:00+00'),
(58, 10, 'repair',      '{"format": "csv", "rows": 500}',         '2023-09-20 08:30:00+00'),

-- Karen sensor logs (crew 11, discharged)
(59, 11, 'scan',        '{"device": "desktop"}',                   '2023-02-25 10:00:00+00'),
(60, 11, 'combat',      '{"feature": "dashboard"}',                '2023-02-25 10:10:00+00'),
(61, 11, 'scan',        '{"device": "desktop"}',                   '2023-05-15 09:00:00+00'),
(62, 11, 'anomaly',     '{"from": "starter", "to": "pro"}',       '2023-05-15 09:30:00+00'),

-- Leo sensor logs (crew 12, discharged)
(63, 12, 'scan',        '{"device": "desktop"}',                   '2023-03-20 14:00:00+00'),
(64, 12, 'combat',      '{"feature": "reports"}',                  '2023-03-20 14:30:00+00'),
(65, 12, 'scan',        '{"device": "desktop"}',                   '2023-06-10 09:00:00+00'),
(66, 12, 'combat',      '{"feature": "dashboard"}',                '2023-06-10 09:15:00+00'),

-- More crew sensor logs
(67, 13, 'scan',        '{"device": "mobile"}',                    '2023-04-01 09:00:00+00'),
(68, 14, 'scan',        '{"device": "desktop"}',                   '2023-05-10 10:00:00+00'),
(69, 14, 'combat',      '{"feature": "dashboard"}',                '2023-05-10 10:15:00+00'),
(70, 15, 'scan',        '{"device": "desktop"}',                   '2023-06-20 11:00:00+00'),
(71, 15, 'combat',      '{"feature": "reports"}',                  '2023-06-20 11:30:00+00'),
(72, 15, 'repair',      '{"format": "csv", "rows": 300}',         '2023-06-20 12:00:00+00'),

-- Peter sensor logs (crew 16)
(73, 16, 'scan',        '{"device": "desktop"}',                   '2023-06-25 08:00:00+00'),
(74, 16, 'combat',      '{"feature": "dashboard"}',                '2023-06-25 08:10:00+00'),
(75, 16, 'warp_jump',   '{"endpoint": "/v1/analytics"}',           '2023-10-15 09:00:00+00'),

-- Quinn sensor logs (crew 17 — admiral)
(76, 17, 'scan',        '{"device": "desktop"}',                   '2023-07-10 10:00:00+00'),
(77, 17, 'warp_jump',   '{"endpoint": "/v1/analytics"}',           '2023-07-10 10:30:00+00'),
(78, 17, 'warp_jump',   '{"endpoint": "/v1/reports"}',             '2023-07-10 11:00:00+00'),
(79, 17, 'scan',        '{"device": "desktop"}',                   '2023-10-20 09:00:00+00'),
(80, 17, 'repair',      '{"format": "json", "rows": 8000}',       '2023-10-20 09:30:00+00'),

-- Rachel, Sam, Tina sensor logs
(81, 18, 'scan',        '{"device": "mobile"}',                    '2023-07-20 14:00:00+00'),
(82, 19, 'scan',        '{"device": "desktop"}',                   '2023-08-10 09:00:00+00'),
(83, 19, 'combat',      '{"feature": "dashboard"}',                '2023-08-10 09:10:00+00'),
(84, 20, 'scan',        '{"device": "desktop"}',                   '2023-08-25 11:00:00+00'),
(85, 20, 'combat',      '{"feature": "reports"}',                  '2023-08-25 11:15:00+00'),
(86, 20, 'scan',        '{"device": "mobile"}',                    '2023-12-10 08:00:00+00'),

-- Crew 21-25 (no missions, light activity)
(87, 21, 'scan',        '{"device": "mobile"}',                    '2023-08-01 10:00:00+00'),
(88, 22, 'scan',        '{"device": "desktop"}',                   '2023-08-15 09:00:00+00'),
(89, 23, 'scan',        '{"device": "desktop"}',                   '2023-09-01 11:00:00+00'),
(90, 23, 'combat',      '{"feature": "dashboard"}',                '2023-09-01 11:10:00+00'),
(91, 24, 'scan',        '{"device": "mobile"}',                    '2023-09-15 14:00:00+00'),
(92, 25, 'scan',        '{"device": "desktop"}',                   '2023-10-01 08:00:00+00'),

-- Anna, Ben, Clara, Derek sensor logs
(93, 26, 'scan',        '{"device": "desktop"}',                   '2023-07-15 10:00:00+00'),
(94, 26, 'combat',      '{"feature": "storage"}',                  '2023-07-15 10:15:00+00'),
(95, 27, 'scan',        '{"device": "desktop"}',                   '2023-08-10 09:00:00+00'),
(96, 27, 'combat',      '{"feature": "dashboard"}',                '2023-08-10 09:15:00+00'),
(97, 27, 'warp_jump',   '{"endpoint": "/v1/analytics"}',           '2023-08-10 10:00:00+00'),
(98, 28, 'scan',        '{"device": "mobile"}',                    '2023-09-15 10:00:00+00'),
(99, 29, 'scan',        '{"device": "desktop"}',                   '2023-10-10 11:00:00+00'),
(100, 29, 'warp_jump',  '{"endpoint": "/v1/analytics"}',           '2023-10-10 11:30:00+00'),
(101, 29, 'warp_jump',  '{"endpoint": "/v1/reports"}',             '2023-10-10 12:00:00+00'),
(102, 29, 'repair',     '{"format": "csv", "rows": 3000}',        '2023-10-10 12:30:00+00'),

-- Elena, Finn, Gina sensor logs
(103, 30, 'scan',       '{"device": "desktop"}',                   '2023-11-10 08:00:00+00'),
(104, 30, 'combat',     '{"feature": "reports"}',                  '2023-11-10 08:15:00+00'),
(105, 31, 'scan',       '{"device": "desktop"}',                   '2023-11-25 09:00:00+00'),
(106, 32, 'scan',       '{"device": "desktop"}',                   '2023-12-10 10:00:00+00'),
(107, 32, 'combat',     '{"feature": "dashboard"}',                '2023-12-10 10:10:00+00'),
(108, 32, 'repair',     '{"format": "csv", "rows": 600}',         '2023-12-10 10:30:00+00'),

-- More sensor logs for time-series patterns (monthly scans for window function exercises)
(109,  1, 'scan',       '{"device": "desktop"}',                   '2023-06-15 10:00:00+00'),
(110,  1, 'scan',       '{"device": "desktop"}',                   '2023-07-20 10:00:00+00'),
(111,  1, 'scan',       '{"device": "desktop"}',                   '2023-08-18 10:00:00+00'),
(112,  1, 'scan',       '{"device": "desktop"}',                   '2023-09-15 10:00:00+00'),
(113,  1, 'scan',       '{"device": "desktop"}',                   '2023-10-20 10:00:00+00'),
(114,  1, 'scan',       '{"device": "desktop"}',                   '2023-11-15 10:00:00+00'),
(115,  1, 'scan',       '{"device": "desktop"}',                   '2023-12-18 10:00:00+00'),
(116,  1, 'scan',       '{"device": "desktop"}',                   '2024-01-15 10:00:00+00'),
(117,  1, 'scan',       '{"device": "desktop"}',                   '2024-02-20 10:00:00+00'),
(118,  1, 'scan',       '{"device": "desktop"}',                   '2024-03-18 10:00:00+00'),

(119,  3, 'scan',       '{"device": "desktop"}',                   '2023-06-20 09:00:00+00'),
(120,  3, 'scan',       '{"device": "desktop"}',                   '2023-07-15 09:00:00+00'),
(121,  3, 'scan',       '{"device": "desktop"}',                   '2023-08-22 09:00:00+00'),
(122,  3, 'scan',       '{"device": "desktop"}',                   '2023-09-18 09:00:00+00'),
(123,  3, 'scan',       '{"device": "desktop"}',                   '2023-10-16 09:00:00+00'),
(124,  3, 'scan',       '{"device": "desktop"}',                   '2023-11-20 09:00:00+00'),
(125,  3, 'scan',       '{"device": "desktop"}',                   '2023-12-15 09:00:00+00'),
(126,  3, 'scan',       '{"device": "desktop"}',                   '2024-01-22 09:00:00+00'),

-- Discharged crew late sensor logs
(127, 41, 'scan',       '{"device": "desktop"}',                   '2023-04-10 09:00:00+00'),
(128, 41, 'combat',     '{"feature": "dashboard"}',                '2023-04-10 09:10:00+00'),
(129, 42, 'scan',       '{"device": "mobile"}',                    '2023-05-25 09:00:00+00'),
(130, 43, 'scan',       '{"device": "desktop"}',                   '2023-05-01 11:00:00+00'),
(131, 44, 'scan',       '{"device": "desktop"}',                   '2023-07-25 14:00:00+00'),
(132, 44, 'combat',     '{"feature": "reports"}',                  '2023-07-25 14:15:00+00'),
(133, 45, 'scan',       '{"device": "desktop"}',                   '2023-08-15 09:00:00+00'),

-- James, Kate, Liam, Maya sensor logs
(134, 35, 'scan',       '{"device": "desktop"}',                   '2024-02-10 08:00:00+00'),
(135, 35, 'combat',     '{"feature": "dashboard"}',                '2024-02-10 08:10:00+00'),
(136, 35, 'warp_jump',  '{"endpoint": "/v1/analytics"}',           '2024-02-10 09:00:00+00'),
(137, 36, 'scan',       '{"device": "desktop"}',                   '2024-02-20 10:00:00+00'),
(138, 36, 'warp_jump',  '{"endpoint": "/v1/analytics"}',           '2024-02-20 10:15:00+00'),
(139, 36, 'warp_jump',  '{"endpoint": "/v1/reports"}',             '2024-02-20 10:30:00+00'),
(140, 36, 'warp_jump',  '{"endpoint": "/v1/export"}',              '2024-02-20 11:00:00+00'),
(141, 37, 'scan',       '{"device": "desktop"}',                   '2024-03-10 09:00:00+00'),
(142, 38, 'scan',       '{"device": "desktop"}',                   '2024-03-25 11:00:00+00'),
(143, 38, 'combat',     '{"feature": "dashboard"}',                '2024-03-25 11:10:00+00'),

-- Ensign minimal activity
(144, 33, 'scan',       '{"device": "mobile"}',                    '2024-01-05 11:00:00+00'),
(145, 34, 'scan',       '{"device": "desktop"}',                   '2024-01-20 14:00:00+00'),
(146, 34, 'combat',     '{"feature": "dashboard"}',                '2024-01-20 14:10:00+00'),
(147, 39, 'scan',       '{"device": "desktop"}',                   '2024-04-10 14:00:00+00'),
(148, 40, 'scan',       '{"device": "desktop"}',                   '2024-04-20 10:00:00+00'),
(149, 40, 'combat',     '{"feature": "dashboard"}',                '2024-04-20 10:10:00+00'),

-- Extra combat sensor logs for analytics
(150,  1, 'combat',     '{"feature": "integrations"}',             '2023-05-22 10:00:00+00'),
(151,  3, 'combat',     '{"feature": "api_keys"}',                 '2023-04-20 09:00:00+00'),
(152,  7, 'combat',     '{"feature": "integrations"}',             '2023-08-15 08:00:00+00'),
(153,  8, 'combat',     '{"feature": "api_keys"}',                 '2023-06-15 09:15:00+00'),
(154, 10, 'combat',     '{"feature": "integrations"}',             '2023-06-10 12:00:00+00'),
(155, 17, 'combat',     '{"feature": "api_keys"}',                 '2023-07-10 11:15:00+00'),
(156, 29, 'combat',     '{"feature": "api_keys"}',                 '2023-10-10 13:00:00+00'),
(157, 36, 'combat',     '{"feature": "api_keys"}',                 '2024-02-20 11:30:00+00'),

-- Anomaly detections (for conversion analysis)
(158,  5, 'anomaly',    '{"from": "free", "to": "starter"}',      '2023-04-15 08:15:00+00'),
(159,  6, 'anomaly',    '{"from": "free", "to": "starter"}',      '2023-04-20 16:20:00+00'),
(160, 13, 'anomaly',    '{"from": "free", "to": "starter"}',      '2023-04-01 09:15:00+00'),
(161, 19, 'anomaly',    '{"from": "free", "to": "starter"}',      '2023-08-10 09:15:00+00'),
(162, 21, 'anomaly',    '{"from": "free", "to": "starter"}',      '2023-08-01 10:15:00+00'),
(163, 22, 'anomaly',    '{"from": "free", "to": "starter"}',      '2023-08-15 09:15:00+00'),
(164, 23, 'anomaly',    '{"from": "free", "to": "starter"}',      '2023-09-01 11:15:00+00'),
(165, 33, 'anomaly',    '{"from": "free", "to": "starter"}',      '2024-01-05 11:15:00+00'),

-- Additional warp_jump sensor logs for heavy users
(166,  3, 'warp_jump',  '{"endpoint": "/v1/analytics"}',           '2023-08-22 10:00:00+00'),
(167,  3, 'warp_jump',  '{"endpoint": "/v1/reports"}',             '2023-09-18 10:00:00+00'),
(168,  8, 'warp_jump',  '{"endpoint": "/v1/analytics"}',           '2023-08-20 11:00:00+00'),
(169,  8, 'warp_jump',  '{"endpoint": "/v1/reports"}',             '2023-11-15 09:00:00+00'),
(170, 17, 'warp_jump',  '{"endpoint": "/v1/analytics"}',           '2023-10-20 10:00:00+00'),
(171, 29, 'warp_jump',  '{"endpoint": "/v1/export"}',              '2024-01-25 10:00:00+00'),

-- Late 2024 sensor logs
(172,  1, 'scan',       '{"device": "desktop"}',                   '2024-04-15 10:00:00+00'),
(173,  1, 'combat',     '{"feature": "dashboard"}',                '2024-04-15 10:10:00+00'),
(174,  3, 'scan',       '{"device": "desktop"}',                   '2024-04-15 09:00:00+00'),
(175,  3, 'warp_jump',  '{"endpoint": "/v1/analytics"}',           '2024-04-15 09:30:00+00'),
(176,  7, 'scan',       '{"device": "desktop"}',                   '2024-04-20 12:00:00+00'),
(177,  8, 'scan',       '{"device": "desktop"}',                   '2024-05-10 10:00:00+00'),
(178,  8, 'warp_jump',  '{"endpoint": "/v1/analytics"}',           '2024-05-10 10:15:00+00'),
(179, 17, 'scan',       '{"device": "desktop"}',                   '2024-02-05 09:00:00+00'),
(180, 17, 'warp_jump',  '{"endpoint": "/v1/analytics"}',           '2024-02-05 09:30:00+00'),

-- Fill to 200 with misc sensor logs
(181, 46, 'scan',       '{"device": "mobile"}',                    '2024-04-01 10:00:00+00'),
(182, 47, 'scan',       '{"device": "desktop"}',                   '2024-04-15 11:00:00+00'),
(183, 48, 'scan',       '{"device": "desktop"}',                   '2024-05-01 09:00:00+00'),
(184, 49, 'scan',       '{"device": "mobile"}',                    '2024-05-15 14:00:00+00'),
(185, 50, 'scan',       '{"device": "desktop"}',                   '2024-06-01 08:00:00+00'),
(186,  2, 'scan',       '{"device": "desktop"}',                   '2023-07-10 09:00:00+00'),
(187,  2, 'combat',     '{"feature": "storage"}',                  '2023-07-10 09:15:00+00'),
(188,  4, 'scan',       '{"device": "desktop"}',                   '2023-11-20 10:00:00+00'),
(189,  4, 'combat',     '{"feature": "storage"}',                  '2023-11-20 10:15:00+00'),
(190,  6, 'scan',       '{"device": "desktop"}',                   '2024-01-10 09:00:00+00'),
(191,  9, 'combat',     '{"feature": "dashboard"}',                '2023-09-25 10:15:00+00'),
(192, 10, 'scan',       '{"device": "desktop"}',                   '2024-01-05 09:00:00+00'),
(193, 16, 'scan',       '{"device": "desktop"}',                   '2024-03-10 08:00:00+00'),
(194, 18, 'combat',     '{"feature": "storage"}',                  '2023-07-20 14:15:00+00'),
(195, 20, 'combat',     '{"feature": "dashboard"}',                '2023-12-10 08:10:00+00'),
(196, 27, 'scan',       '{"device": "desktop"}',                   '2024-01-20 09:00:00+00'),
(197, 30, 'scan',       '{"device": "desktop"}',                   '2024-02-20 08:00:00+00'),
(198, 32, 'scan',       '{"device": "desktop"}',                   '2024-03-15 09:00:00+00'),
(199, 35, 'scan',       '{"device": "desktop"}',                   '2024-04-05 08:00:00+00'),
(200, 38, 'scan',       '{"device": "desktop"}',                   '2024-05-10 11:00:00+00');

SELECT setval('theme_scifi.sensor_logs_id_seq', 200);
