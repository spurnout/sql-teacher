-- ============================================================
-- Fantasy Theme Seed Data — Kingdom of Eldoria
-- All data mirrors 03-seed.sql with identical numeric values,
-- FK patterns, timestamps, and NULL distributions.
-- ============================================================

-- ============================================================
-- ARTIFACTS (8 rows) — maps to products
-- Categories: weapons, armor, potions, scrolls
-- ============================================================
INSERT INTO theme_fantasy.artifacts (id, name, category, value_gold, created_at) VALUES
(1, 'Iron Shortsword',       'weapons',  2900, '2023-01-01'),
(2, 'Flamebrand Claymore',   'weapons',  9900, '2023-01-01'),
(3, 'Leather Vest',          'armor',    4900, '2023-01-01'),
(4, 'Dragonscale Plate',     'armor',   19900, '2023-01-01'),
(5, 'Minor Healing Potion',  'potions',  1900, '2023-03-15'),
(6, 'Elixir of Power',       'potions',  4900, '2023-03-15'),
(7, 'Scroll of Fireball',    'scrolls',  9900, '2023-06-01'),
(8, 'Tome of Ancient Wisdom','scrolls', 29900, '2023-06-01');

SELECT setval('theme_fantasy.artifacts_id_seq', 8);

-- ============================================================
-- ADVENTURERS (50 rows) — maps to users
-- Classes: warrior(free), mage(starter), rogue(pro), healer(enterprise)
-- Kingdoms: Eldoria(US), Ironhold(UK), Thornvale(DE), Crystalshore(FR),
--   Sunspire(IN), Frostmere(JP), Sandrift(AU), Stormreach(BR),
--   Ashenvale(CA), Mistpeak(CN), Greenhollow(IE), Duskwood(SE),
--   Ravencrest(RU), Goldleaf(TW), Silverkeep(IT), Emberpeak(MX),
--   Stonegate(PL), Willowhaven(NG), Moonvale(KR), Nighthaven(VN),
--   Crimsonfort(ES), Coralshore(AR), Windmere(PK), Brightwater(GR),
--   Starfall(NO), Deephollow(CH), Shadowfen(BG), Clearspring(CY),
--   Highgarden(GH)
-- IDs 1-10 active, 11-15 exiled, 21-25 no quests, 46-50 warriors
-- ============================================================
INSERT INTO theme_fantasy.adventurers (id, name, title, class, kingdom, created_at, exiled_at) VALUES
-- Active adventurers, various classes
( 1, 'Alice Martin',       'Sir',         'rogue',      'Eldoria',      '2023-01-15 10:00:00+00', NULL),
( 2, 'Bob Chen',           'Apprentice',  'mage',       'Ironhold',     '2023-01-15 14:30:00+00', NULL),
( 3, 'Carol Davis',        'Priestess',   'healer',     'Eldoria',      '2023-02-01 09:00:00+00', NULL),
( 4, 'David Kim',          'Shadow',      'rogue',      'Thornvale',    '2023-02-14 11:00:00+00', NULL),
( 5, 'Emma Wilson',        'Squire',      'warrior',    'Crystalshore', '2023-03-01 08:00:00+00', NULL),
( 6, 'Frank Lopez',        'Apprentice',  'mage',       'Eldoria',      '2023-03-01 16:00:00+00', NULL),
( 7, 'Grace Patel',        'Shadow',      'rogue',      'Sunspire',     '2023-03-15 12:00:00+00', NULL),
( 8, 'Henry Brown',        'Priestess',   'healer',     'Ironhold',     '2023-04-01 10:00:00+00', NULL),
( 9, 'Iris Nakamura',      'Apprentice',  'mage',       'Frostmere',    '2023-04-15 09:00:00+00', NULL),
(10, 'Jack Thompson',      'Shadow',      'rogue',      'Sandrift',     '2023-05-01 11:00:00+00', NULL),

-- Exiled adventurers (maps to churned users)
(11, 'Karen Miller',       'Apprentice',  'mage',       'Eldoria',      '2023-01-20 10:00:00+00', '2023-06-20 10:00:00+00'),
(12, 'Leo Garcia',         'Shadow',      'rogue',      'Stormreach',   '2023-02-10 14:00:00+00', '2023-08-10 14:00:00+00'),
(13, 'Mia Anderson',       'Squire',      'warrior',    'Ashenvale',    '2023-03-05 09:00:00+00', '2023-05-05 09:00:00+00'),
(14, 'Noah Taylor',        'Apprentice',  'mage',       'Ironhold',     '2023-04-01 10:00:00+00', '2023-09-01 10:00:00+00'),
(15, 'Olivia Martinez',    'Shadow',      'rogue',      'Eldoria',      '2023-05-15 11:00:00+00', '2023-11-15 11:00:00+00'),

-- More active adventurers
(16, 'Peter Zhang',        'Shadow',      'rogue',      'Mistpeak',     '2023-05-20 08:00:00+00', NULL),
(17, 'Quinn O''Brien',     'Priestess',   'healer',     'Greenhollow',  '2023-06-01 10:00:00+00', NULL),
(18, 'Rachel Santos',      'Apprentice',  'mage',       'Stormreach',   '2023-06-15 14:00:00+00', NULL),
(19, 'Sam Johansson',      'Squire',      'warrior',    'Duskwood',     '2023-07-01 09:00:00+00', NULL),
(20, 'Tina Dubois',        'Shadow',      'rogue',      'Crystalshore', '2023-07-15 11:00:00+00', NULL),

-- Adventurers with NO quests (for LEFT JOIN IS NULL exercise)
(21, 'Uma Krishnan',       'Squire',      'warrior',    'Sunspire',     '2023-08-01 10:00:00+00', NULL),
(22, 'Victor Petrov',      'Squire',      'warrior',    'Ravencrest',   '2023-08-15 09:00:00+00', NULL),
(23, 'Wendy Chang',        'Squire',      'warrior',    'Goldleaf',     '2023-09-01 11:00:00+00', NULL),
(24, 'Xander Muller',      'Squire',      'warrior',    'Thornvale',    '2023-09-15 14:00:00+00', NULL),
(25, 'Yuki Tanaka',        'Squire',      'warrior',    'Frostmere',    '2023-10-01 08:00:00+00', NULL),

-- Adventurers who share joined dates (for self-join exercise)
-- Same date as adventurer 1 and 2: Jan 15
-- Same date as adventurer 5 and 6: Mar 1
-- Same date as adventurer 8 and 14: Apr 1

-- More adventurers for volume
(26, 'Anna Kowalski',      'Apprentice',  'mage',       'Stonegate',    '2023-06-01 10:00:00+00', NULL),
(27, 'Ben Okafor',         'Shadow',      'rogue',      'Willowhaven',  '2023-07-01 09:00:00+00', NULL),
(28, 'Clara Rivera',       'Apprentice',  'mage',       'Emberpeak',    '2023-08-01 10:00:00+00', NULL),
(29, 'Derek Singh',        'Priestess',   'healer',     'Sunspire',     '2023-09-01 11:00:00+00', NULL),
(30, 'Elena Volkov',       'Shadow',      'rogue',      'Ravencrest',   '2023-10-01 08:00:00+00', NULL),

(31, 'Finn Larsson',       'Apprentice',  'mage',       'Duskwood',     '2023-10-15 09:00:00+00', NULL),
(32, 'Gina Rossi',         'Shadow',      'rogue',      'Silverkeep',   '2023-11-01 10:00:00+00', NULL),
(33, 'Hector Morales',     'Squire',      'warrior',    'Coralshore',   '2023-11-15 11:00:00+00', NULL),
(34, 'Isla MacLeod',       'Apprentice',  'mage',       'Ironhold',     '2023-12-01 14:00:00+00', NULL),
(35, 'James Park',         'Shadow',      'rogue',      'Moonvale',     '2024-01-01 08:00:00+00', NULL),

(36, 'Kate Nguyen',        'Priestess',   'healer',     'Nighthaven',   '2024-01-15 10:00:00+00', NULL),
(37, 'Liam Fischer',       'Apprentice',  'mage',       'Thornvale',    '2024-02-01 09:00:00+00', NULL),
(38, 'Maya Ali',           'Shadow',      'rogue',      'Windmere',     '2024-02-15 11:00:00+00', NULL),
(39, 'Nick Papadopoulos',  'Squire',      'warrior',    'Brightwater',  '2024-03-01 14:00:00+00', NULL),
(40, 'Olivia Bjork',       'Apprentice',  'mage',       'Starfall',     '2024-03-15 10:00:00+00', NULL),

-- Exiled adventurers (more)
(41, 'Paula Fernandez',    'Shadow',      'rogue',      'Crimsonfort',  '2023-03-01 09:00:00+00', '2023-09-01 09:00:00+00'),
(42, 'Raj Gupta',          'Apprentice',  'mage',       'Sunspire',     '2023-04-15 09:00:00+00', '2023-10-15 09:00:00+00'),
(43, 'Sara Eriksson',      'Squire',      'warrior',    'Duskwood',     '2023-05-01 11:00:00+00', '2023-07-01 11:00:00+00'),
(44, 'Tom Williams',       'Shadow',      'rogue',      'Sandrift',     '2023-06-15 14:00:00+00', '2024-01-15 14:00:00+00'),
(45, 'Ursula Weber',       'Apprentice',  'mage',       'Deephollow',   '2023-07-01 09:00:00+00', '2024-02-01 09:00:00+00'),

-- Warriors who never advanced (no enrollments or quests)
(46, 'Val Antonov',        'Squire',      'warrior',    'Shadowfen',    '2024-04-01 10:00:00+00', NULL),
(47, 'Wes Hoffman',        'Squire',      'warrior',    'Eldoria',      '2024-04-15 11:00:00+00', NULL),
(48, 'Xena Christou',      'Squire',      'warrior',    'Clearspring',  '2024-05-01 09:00:00+00', NULL),
(49, 'Yves Dupont',        'Squire',      'warrior',    'Crystalshore', '2024-05-15 14:00:00+00', NULL),
(50, 'Zara Osei',          'Squire',      'warrior',    'Highgarden',   '2024-06-01 08:00:00+00', NULL);

SELECT setval('theme_fantasy.adventurers_id_seq', 50);

-- ============================================================
-- QUESTS (80 rows) — maps to orders
-- Status: completed|failed|pending (maps to completed|refunded|pending)
-- reward_gold = total_cents, started_at = created_at
-- Adventurers 21-25 and 46-50 have NO quests (for LEFT JOIN exercise)
-- ============================================================
INSERT INTO theme_fantasy.quests (id, adventurer_id, reward_gold, status, created_at) VALUES
-- Alice (adventurer 1) — 4 quests
( 1,  1, 12800, 'completed', '2023-02-10 10:00:00+00'),
( 2,  1,  9900, 'completed', '2023-05-22 14:00:00+00'),
( 3,  1, 24800, 'completed', '2023-09-15 11:00:00+00'),
( 4,  1,  4900, 'failed',    '2023-12-01 09:00:00+00'),

-- Bob (adventurer 2) — 2 quests
( 5,  2,  2900, 'completed', '2023-02-20 09:00:00+00'),
( 6,  2,  6800, 'completed', '2023-07-10 15:00:00+00'),

-- Carol (adventurer 3) — 5 quests (high-value healer)
( 7,  3, 39800, 'completed', '2023-02-15 10:00:00+00'),
( 8,  3, 29900, 'completed', '2023-04-20 11:00:00+00'),
( 9,  3, 34800, 'completed', '2023-07-12 14:00:00+00'),
(10,  3, 49800, 'completed', '2023-10-05 09:00:00+00'),
(11,  3, 29900, 'completed', '2024-01-15 10:00:00+00'),

-- David (adventurer 4) — 3 quests
(12,  4,  9900, 'completed', '2023-03-10 11:00:00+00'),
(13,  4, 14800, 'completed', '2023-06-25 14:00:00+00'),
(14,  4,  4900, 'pending',   '2023-11-20 09:00:00+00'),

-- Emma (adventurer 5) — 1 quest
(15,  5,  2900, 'completed', '2023-04-15 08:00:00+00'),

-- Frank (adventurer 6) — 2 quests
(16,  6,  7800, 'completed', '2023-04-20 16:00:00+00'),
(17,  6,  4900, 'completed', '2023-08-10 10:00:00+00'),

-- Grace (adventurer 7) — 3 quests
(18,  7, 14800, 'completed', '2023-04-25 12:00:00+00'),
(19,  7,  9900, 'completed', '2023-08-15 09:00:00+00'),
(20,  7, 19800, 'completed', '2024-01-10 14:00:00+00'),

-- Henry (adventurer 8) — 4 quests
(21,  8, 39800, 'completed', '2023-05-10 10:00:00+00'),
(22,  8, 29900, 'completed', '2023-08-20 11:00:00+00'),
(23,  8, 49800, 'completed', '2023-11-15 14:00:00+00'),
(24,  8, 29900, 'failed',    '2024-02-10 09:00:00+00'),

-- Iris (adventurer 9) — 2 quests
(25,  9,  4900, 'completed', '2023-05-20 09:00:00+00'),
(26,  9,  2900, 'completed', '2023-09-25 14:00:00+00'),

-- Jack (adventurer 10) — 3 quests
(27, 10, 12800, 'completed', '2023-06-10 11:00:00+00'),
(28, 10,  9900, 'completed', '2023-09-20 10:00:00+00'),
(29, 10,  4900, 'completed', '2024-01-05 14:00:00+00'),

-- Karen (adventurer 11, exiled) — 2 quests before exile
(30, 11,  2900, 'completed', '2023-02-25 10:00:00+00'),
(31, 11,  4900, 'completed', '2023-05-15 11:00:00+00'),

-- Leo (adventurer 12, exiled) — 3 quests
(32, 12, 14800, 'completed', '2023-03-20 14:00:00+00'),
(33, 12,  9900, 'completed', '2023-06-10 09:00:00+00'),
(34, 12,  4900, 'failed',    '2023-07-25 11:00:00+00'),

-- Mia (adventurer 13, exiled) — 1 quest
(35, 13,  2900, 'completed', '2023-04-01 09:00:00+00'),

-- Noah (adventurer 14, exiled) — 2 quests
(36, 14,  7800, 'completed', '2023-05-10 10:00:00+00'),
(37, 14,  4900, 'completed', '2023-08-01 14:00:00+00'),

-- Olivia (adventurer 15, exiled) — 2 quests
(38, 15, 14800, 'completed', '2023-06-20 11:00:00+00'),
(39, 15,  9900, 'completed', '2023-09-15 09:00:00+00'),

-- Peter (adventurer 16) — 2 quests
(40, 16,  9900, 'completed', '2023-06-25 08:00:00+00'),
(41, 16, 19800, 'completed', '2023-10-15 14:00:00+00'),

-- Quinn (adventurer 17) — 3 quests
(42, 17, 39800, 'completed', '2023-07-10 10:00:00+00'),
(43, 17, 29900, 'completed', '2023-10-20 11:00:00+00'),
(44, 17, 49800, 'completed', '2024-02-05 09:00:00+00'),

-- Rachel (adventurer 18) — 1 quest
(45, 18,  4900, 'completed', '2023-07-20 14:00:00+00'),

-- Sam (adventurer 19) — 1 quest
(46, 19,  2900, 'completed', '2023-08-10 09:00:00+00'),

-- Tina (adventurer 20) — 2 quests
(47, 20, 14800, 'completed', '2023-08-25 11:00:00+00'),
(48, 20,  9900, 'completed', '2023-12-10 14:00:00+00'),

-- Anna (adventurer 26) — 2 quests
(49, 26,  4900, 'completed', '2023-07-15 10:00:00+00'),
(50, 26,  7800, 'completed', '2023-11-20 09:00:00+00'),

-- Ben (adventurer 27) — 2 quests
(51, 27, 12800, 'completed', '2023-08-10 09:00:00+00'),
(52, 27,  9900, 'completed', '2024-01-20 14:00:00+00'),

-- Clara (adventurer 28) — 1 quest
(53, 28,  4900, 'completed', '2023-09-15 10:00:00+00'),

-- Derek (adventurer 29) — 3 quests
(54, 29, 39800, 'completed', '2023-10-10 11:00:00+00'),
(55, 29, 29900, 'completed', '2024-01-25 09:00:00+00'),
(56, 29, 19800, 'completed', '2024-03-10 14:00:00+00'),

-- Elena (adventurer 30) — 2 quests
(57, 30,  9900, 'completed', '2023-11-10 08:00:00+00'),
(58, 30, 14800, 'completed', '2024-02-20 10:00:00+00'),

-- Finn (adventurer 31) — 1 quest
(59, 31,  4900, 'completed', '2023-11-25 09:00:00+00'),

-- Gina (adventurer 32) — 2 quests
(60, 32, 12800, 'completed', '2023-12-10 10:00:00+00'),
(61, 32,  9900, 'completed', '2024-03-15 11:00:00+00'),

-- Hector (adventurer 33) — 1 quest
(62, 33,  2900, 'completed', '2024-01-05 11:00:00+00'),

-- Isla (adventurer 34) — 1 quest
(63, 34,  7800, 'completed', '2024-01-20 14:00:00+00'),

-- James (adventurer 35) — 2 quests
(64, 35, 14800, 'completed', '2024-02-10 08:00:00+00'),
(65, 35,  9900, 'completed', '2024-04-05 10:00:00+00'),

-- Kate (adventurer 36) — 2 quests
(66, 36, 49800, 'completed', '2024-02-20 10:00:00+00'),
(67, 36, 29900, 'completed', '2024-05-10 09:00:00+00'),

-- Liam (adventurer 37) — 1 quest
(68, 37,  4900, 'completed', '2024-03-10 09:00:00+00'),

-- Maya (adventurer 38) — 1 quest
(69, 38, 12800, 'completed', '2024-03-25 11:00:00+00'),

-- Paula (adventurer 41, exiled) — 1 quest
(70, 41,  9900, 'completed', '2023-04-10 09:00:00+00'),

-- Raj (adventurer 42, exiled) — 1 quest
(71, 42,  4900, 'completed', '2023-05-25 09:00:00+00'),

-- Tom (adventurer 44, exiled) — 2 quests
(72, 44, 14800, 'completed', '2023-07-25 14:00:00+00'),
(73, 44,  9900, 'completed', '2023-11-10 10:00:00+00'),

-- Ursula (adventurer 45, exiled) — 1 quest
(74, 45,  4900, 'completed', '2023-08-15 09:00:00+00'),

-- Nick (adventurer 39) — 1 small quest
(75, 39,  2900, 'pending',   '2024-04-10 14:00:00+00'),

-- Olivia B (adventurer 40) — 1 quest
(76, 40,  7800, 'completed', '2024-04-20 10:00:00+00'),

-- Extra quests for time-series analysis
(77,  1, 14800, 'completed', '2024-03-10 10:00:00+00'),
(78,  3, 39800, 'completed', '2024-04-15 11:00:00+00'),
(79,  7, 12800, 'completed', '2024-04-20 14:00:00+00'),
(80,  8, 49800, 'completed', '2024-05-10 09:00:00+00');

SELECT setval('theme_fantasy.quests_id_seq', 80);

-- ============================================================
-- QUEST_LOOT (118 rows) — maps to order_items
-- appraisal_gold = unit_price_cents, SAME artifact_id = product_id
-- ============================================================
INSERT INTO theme_fantasy.quest_loot (id, quest_id, artifact_id, quantity, appraisal_gold) VALUES
-- Alice quests
( 1,  1, 1, 1,  2900), ( 2,  1, 3, 1,  4900), ( 3,  1, 5, 1,  1900),  -- quest 1: shortsword + vest + potion
( 4,  2, 2, 1,  9900),                                                   -- quest 2: claymore
( 5,  3, 2, 1,  9900), ( 6,  3, 4, 1, 19900),                           -- quest 3: claymore + dragonscale
( 7,  4, 3, 1,  4900),                                                   -- quest 4: vest (failed)

-- Bob quests
( 8,  5, 1, 1,  2900),                                                   -- quest 5: shortsword
( 9,  6, 1, 1,  2900), (10,  6, 5, 1,  1900),                           -- quest 6: shortsword + potion

-- Carol quests (healer, high-value)
(11,  7, 2, 1,  9900), (12,  7, 4, 1, 19900), (13,  7, 8, 1, 29900),   -- quest 7: claymore + dragonscale + tome
(14,  8, 8, 1, 29900),                                                   -- quest 8: tome renewal
(15,  9, 2, 1,  9900), (16,  9, 6, 1,  4900), (17,  9, 4, 1, 19900),   -- quest 9: claymore + elixir + dragonscale
(18, 10, 8, 1, 29900), (19, 10, 4, 1, 19900),                           -- quest 10: tome + dragonscale
(20, 11, 8, 1, 29900),                                                   -- quest 11: tome renewal

-- David quests
(21, 12, 2, 1,  9900),                                                   -- quest 12: claymore
(22, 13, 2, 1,  9900), (23, 13, 3, 1,  4900),                           -- quest 13: claymore + vest
(24, 14, 3, 1,  4900),                                                   -- quest 14: vest (pending)

-- Emma quest
(25, 15, 1, 1,  2900),                                                   -- quest 15: shortsword

-- Frank quests
(26, 16, 1, 1,  2900), (27, 16, 3, 1,  4900),                           -- quest 16: shortsword + vest
(28, 17, 3, 1,  4900),                                                   -- quest 17: vest

-- Grace quests
(29, 18, 2, 1,  9900), (30, 18, 3, 1,  4900),                           -- quest 18: claymore + vest
(31, 19, 2, 1,  9900),                                                   -- quest 19: claymore
(32, 20, 2, 1,  9900), (33, 20, 4, 1, 19900),                           -- quest 20: claymore + dragonscale

-- Henry quests (healer)
(34, 21, 2, 1,  9900), (35, 21, 8, 1, 29900),                           -- quest 21: claymore + tome
(36, 22, 8, 1, 29900),                                                   -- quest 22: tome
(37, 23, 8, 1, 29900), (38, 23, 4, 1, 19900),                           -- quest 23: tome + dragonscale
(39, 24, 8, 1, 29900),                                                   -- quest 24: tome (failed)

-- Iris quests
(40, 25, 3, 1,  4900),                                                   -- quest 25: vest
(41, 26, 1, 1,  2900),                                                   -- quest 26: shortsword

-- Jack quests
(42, 27, 2, 1,  9900), (43, 27, 5, 1,  1900),                           -- quest 27: claymore + potion
(44, 28, 2, 1,  9900),                                                   -- quest 28: claymore
(45, 29, 3, 1,  4900),                                                   -- quest 29: vest

-- Karen (exiled) quests
(46, 30, 1, 1,  2900),                                                   -- quest 30: shortsword
(47, 31, 3, 1,  4900),                                                   -- quest 31: vest

-- Leo (exiled) quests
(48, 32, 2, 1,  9900), (49, 32, 3, 1,  4900),                           -- quest 32: claymore + vest
(50, 33, 2, 1,  9900),                                                   -- quest 33: claymore
(51, 34, 3, 1,  4900),                                                   -- quest 34: vest (failed)

-- Mia (exiled) quest
(52, 35, 1, 1,  2900),                                                   -- quest 35: shortsword

-- Noah (exiled) quests
(53, 36, 1, 1,  2900), (54, 36, 3, 1,  4900),                           -- quest 36: shortsword + vest
(55, 37, 3, 1,  4900),                                                   -- quest 37: vest

-- Olivia (exiled) quests
(56, 38, 2, 1,  9900), (57, 38, 3, 1,  4900),                           -- quest 38: claymore + vest
(58, 39, 2, 1,  9900),                                                   -- quest 39: claymore

-- Peter quests
(59, 40, 2, 1,  9900),                                                   -- quest 40: claymore
(60, 41, 2, 1,  9900), (61, 41, 4, 1, 19900),                           -- quest 41: claymore + dragonscale

-- Quinn quests (healer)
(62, 42, 2, 1,  9900), (63, 42, 8, 1, 29900),                           -- quest 42: claymore + tome
(64, 43, 8, 1, 29900),                                                   -- quest 43: tome
(65, 44, 8, 1, 29900), (66, 44, 4, 1, 19900),                           -- quest 44: tome + dragonscale

-- Rachel, Sam, Tina
(67, 45, 3, 1,  4900),                                                   -- quest 45: vest
(68, 46, 1, 1,  2900),                                                   -- quest 46: shortsword
(69, 47, 2, 1,  9900), (70, 47, 5, 1,  1900),                           -- quest 47: claymore + potion
(71, 48, 2, 1,  9900),                                                   -- quest 48: claymore

-- Anna, Ben, Clara, Derek, Elena, Finn, Gina, Hector, Isla, James, Kate, Liam, Maya
(72, 49, 3, 1,  4900),                                                   -- Anna quest 1
(73, 50, 1, 1,  2900), (74, 50, 3, 1,  4900),                           -- Anna quest 2
(75, 51, 2, 1,  9900), (76, 51, 5, 1,  1900),                           -- Ben quest 1
(77, 52, 2, 1,  9900),                                                   -- Ben quest 2
(78, 53, 3, 1,  4900),                                                   -- Clara quest
(79, 54, 2, 1,  9900), (80, 54, 8, 1, 29900),                           -- Derek quest 1
(81, 55, 8, 1, 29900),                                                   -- Derek quest 2
(82, 56, 4, 1, 19900),                                                   -- Derek quest 3
(83, 57, 2, 1,  9900),                                                   -- Elena quest 1
(84, 58, 2, 1,  9900), (85, 58, 3, 1,  4900),                           -- Elena quest 2
(86, 59, 3, 1,  4900),                                                   -- Finn quest
(87, 60, 2, 1,  9900), (88, 60, 5, 1,  1900),                           -- Gina quest 1
(89, 61, 2, 1,  9900),                                                   -- Gina quest 2
(90, 62, 1, 1,  2900),                                                   -- Hector quest
(91, 63, 1, 1,  2900), (92, 63, 3, 1,  4900),                           -- Isla quest
(93, 64, 2, 1,  9900), (94, 64, 3, 1,  4900),                           -- James quest 1
(95, 65, 2, 1,  9900),                                                   -- James quest 2
(96, 66, 8, 1, 29900), (97, 66, 4, 1, 19900),                           -- Kate quest 1
(98, 67, 8, 1, 29900),                                                   -- Kate quest 2
(99, 68, 3, 1,  4900),                                                   -- Liam quest
(100, 69, 2, 1, 9900), (101, 69, 5, 1, 1900),                           -- Maya quest

-- Exiled adventurers' quests
(102, 70, 2, 1,  9900),                                                  -- Paula quest
(103, 71, 3, 1,  4900),                                                  -- Raj quest
(104, 72, 2, 1,  9900), (105, 72, 3, 1,  4900),                         -- Tom quest 1
(106, 73, 2, 1,  9900),                                                  -- Tom quest 2
(107, 74, 3, 1,  4900),                                                  -- Ursula quest

-- Nick (pending), Olivia B
(108, 75, 1, 1,  2900),                                                  -- Nick quest (pending)
(109, 76, 1, 1,  2900), (110, 76, 3, 1, 4900),                          -- Olivia B quest

-- Extra time-series quests
(111, 77, 2, 1,  9900), (112, 77, 3, 1, 4900),                          -- Alice extra
(113, 78, 2, 1,  9900), (114, 78, 8, 1, 29900),                         -- Carol extra
(115, 79, 2, 1,  9900), (116, 79, 5, 1, 1900),                          -- Grace extra
(117, 80, 8, 1, 29900), (118, 80, 4, 1, 19900);                         -- Henry extra

SELECT setval('theme_fantasy.quest_loot_id_seq', 118);

-- ============================================================
-- ENROLLMENTS (60 rows) — maps to subscriptions
-- Status: equipped(active)|stored(cancelled)|cursed(past_due)|broken(trialing)
-- upkeep_gold = mrr_cents, acquired_at = started_at, lost_at = cancelled_at
-- ============================================================
INSERT INTO theme_fantasy.enrollments (id, adventurer_id, artifact_id, status, acquired_at, lost_at, upkeep_gold) VALUES
-- Equipped enrollments (active)
( 1,  1, 2, 'equipped',  '2023-02-10', NULL,          9900),  -- Alice: Claymore
( 2,  1, 4, 'equipped',  '2023-09-15', NULL,         19900),  -- Alice: Dragonscale
( 3,  2, 1, 'equipped',  '2023-02-20', NULL,          2900),  -- Bob: Shortsword
( 4,  3, 2, 'equipped',  '2023-02-15', NULL,          9900),  -- Carol: Claymore
( 5,  3, 8, 'equipped',  '2023-02-15', NULL,         29900),  -- Carol: Tome
( 6,  3, 4, 'equipped',  '2023-07-12', NULL,         19900),  -- Carol: Dragonscale
( 7,  4, 2, 'equipped',  '2023-03-10', NULL,          9900),  -- David: Claymore
( 8,  6, 1, 'equipped',  '2023-04-20', NULL,          2900),  -- Frank: Shortsword
( 9,  7, 2, 'equipped',  '2023-04-25', NULL,          9900),  -- Grace: Claymore
(10,  8, 2, 'equipped',  '2023-05-10', NULL,          9900),  -- Henry: Claymore
(11,  8, 8, 'equipped',  '2023-05-10', NULL,         29900),  -- Henry: Tome
(12, 10, 2, 'equipped',  '2023-06-10', NULL,          9900),  -- Jack: Claymore
(13, 16, 2, 'equipped',  '2023-06-25', NULL,          9900),  -- Peter: Claymore
(14, 17, 2, 'equipped',  '2023-07-10', NULL,          9900),  -- Quinn: Claymore
(15, 17, 8, 'equipped',  '2023-07-10', NULL,         29900),  -- Quinn: Tome
(16, 20, 2, 'equipped',  '2023-08-25', NULL,          9900),  -- Tina: Claymore
(17, 27, 2, 'equipped',  '2023-08-10', NULL,          9900),  -- Ben: Claymore
(18, 29, 2, 'equipped',  '2023-10-10', NULL,          9900),  -- Derek: Claymore
(19, 29, 8, 'equipped',  '2023-10-10', NULL,         29900),  -- Derek: Tome
(20, 30, 2, 'equipped',  '2023-11-10', NULL,          9900),  -- Elena: Claymore
(21, 32, 2, 'equipped',  '2023-12-10', NULL,          9900),  -- Gina: Claymore
(22, 35, 2, 'equipped',  '2024-02-10', NULL,          9900),  -- James: Claymore
(23, 36, 8, 'equipped',  '2024-02-20', NULL,         29900),  -- Kate: Tome
(24, 36, 4, 'equipped',  '2024-02-20', NULL,         19900),  -- Kate: Dragonscale
(25, 38, 2, 'equipped',  '2024-03-25', NULL,          9900),  -- Maya: Claymore

-- Stored enrollments (cancelled/exiled adventurers)
(26, 11, 1, 'stored',    '2023-02-25', '2023-06-20',  0),     -- Karen: Shortsword (exiled)
(27, 12, 2, 'stored',    '2023-03-20', '2023-08-10',  0),     -- Leo: Claymore (exiled)
(28, 13, 1, 'stored',    '2023-04-01', '2023-05-05',  0),     -- Mia: Shortsword (exiled)
(29, 14, 1, 'stored',    '2023-05-10', '2023-09-01',  0),     -- Noah: Shortsword (exiled)
(30, 15, 2, 'stored',    '2023-06-20', '2023-11-15',  0),     -- Olivia: Claymore (exiled)
(31, 41, 2, 'stored',    '2023-04-10', '2023-09-01',  0),     -- Paula: Claymore (exiled)
(32, 42, 3, 'stored',    '2023-05-25', '2023-10-15',  0),     -- Raj: Vest (exiled)
(33, 43, 1, 'stored',    '2023-05-01', '2023-07-01',  0),     -- Sara: Shortsword (exiled)
(34, 44, 2, 'stored',    '2023-07-25', '2024-01-15',  0),     -- Tom: Claymore (exiled)
(35, 45, 3, 'stored',    '2023-08-15', '2024-02-01',  0),     -- Ursula: Vest (exiled)

-- Broken enrollments (trialing — newer adventurers)
(36, 37, 1, 'broken',    '2024-03-10', NULL,          0),     -- Liam: Shortsword (trial)
(37, 39, 1, 'broken',    '2024-04-10', NULL,          0),     -- Nick: Shortsword (trial)
(38, 40, 1, 'broken',    '2024-04-20', NULL,          0),     -- Olivia B: Shortsword (trial)

-- Cursed (past due)
(39,  9, 1, 'cursed',    '2023-05-20', NULL,          2900),  -- Iris: Shortsword (cursed)
(40, 18, 3, 'cursed',    '2023-07-20', NULL,          4900),  -- Rachel: Vest (cursed)

-- More equipped enrollments for data volume
(41,  1, 5, 'equipped',  '2023-05-22', NULL,          1900),  -- Alice: Potion
(42,  7, 3, 'equipped',  '2023-04-25', NULL,          4900),  -- Grace: Vest
(43, 10, 5, 'equipped',  '2023-06-10', NULL,          1900),  -- Jack: Potion
(44,  2, 5, 'equipped',  '2023-07-10', NULL,          1900),  -- Bob: Potion
(45,  6, 3, 'equipped',  '2023-04-20', NULL,          4900),  -- Frank: Vest
(46, 20, 5, 'equipped',  '2023-08-25', NULL,          1900),  -- Tina: Potion
(47, 26, 3, 'equipped',  '2023-07-15', NULL,          4900),  -- Anna: Vest
(48, 28, 3, 'equipped',  '2023-09-15', NULL,          4900),  -- Clara: Vest
(49, 31, 3, 'equipped',  '2023-11-25', NULL,          4900),  -- Finn: Vest
(50, 34, 1, 'equipped',  '2024-01-20', NULL,          2900),  -- Isla: Shortsword

-- Upgraded enrollments (had basic, now advanced)
(51,  4, 1, 'stored',    '2023-03-10', '2023-06-25',  0),     -- David: had Shortsword, stored when upgraded
(52,  4, 3, 'equipped',  '2023-06-25', NULL,          4900),  -- David: Vest
(53, 16, 4, 'equipped',  '2023-10-15', NULL,         19900),  -- Peter: Dragonscale (added later)
(54,  8, 4, 'equipped',  '2023-11-15', NULL,         19900),  -- Henry: Dragonscale (added later)
(55, 32, 5, 'equipped',  '2023-12-10', NULL,          1900),  -- Gina: Potion
(56, 35, 3, 'equipped',  '2024-02-10', NULL,          4900),  -- James: Vest
(57, 38, 5, 'equipped',  '2024-03-25', NULL,          1900),  -- Maya: Potion
(58, 27, 5, 'equipped',  '2023-08-10', NULL,          1900),  -- Ben: Potion
(59, 30, 3, 'equipped',  '2023-11-10', NULL,          4900),  -- Elena: Vest
(60, 17, 4, 'equipped',  '2023-10-20', NULL,         19900);  -- Quinn: Dragonscale

SELECT setval('theme_fantasy.enrollments_id_seq', 60);

-- ============================================================
-- TAVERN_LOGS (200 rows) — maps to events
-- event_type: brawl(login)|feast(feature_used)|rumor(export)|quest_posted(api_call)|duel(upgrade_prompt_shown)
-- SAME timestamps, SAME JSONB structure, SAME user_id patterns
-- ============================================================
INSERT INTO theme_fantasy.tavern_logs (id, adventurer_id, event_type, properties, occurred_at) VALUES
-- Alice events (adventurer 1)
( 1,  1, 'brawl',        '{"device": "desktop"}',                   '2023-02-10 10:05:00+00'),
( 2,  1, 'feast',        '{"feature": "dashboard"}',                '2023-02-10 10:15:00+00'),
( 3,  1, 'feast',        '{"feature": "reports"}',                  '2023-02-10 11:00:00+00'),
( 4,  1, 'rumor',        '{"format": "csv", "rows": 1500}',        '2023-02-10 11:30:00+00'),
( 5,  1, 'brawl',        '{"device": "mobile"}',                    '2023-03-15 08:00:00+00'),
( 6,  1, 'feast',        '{"feature": "dashboard"}',                '2023-03-15 08:10:00+00'),
( 7,  1, 'quest_posted', '{"endpoint": "/v1/analytics"}',           '2023-04-20 14:00:00+00'),
( 8,  1, 'quest_posted', '{"endpoint": "/v1/reports"}',             '2023-04-20 14:30:00+00'),
( 9,  1, 'brawl',        '{"device": "desktop"}',                   '2023-05-22 09:00:00+00'),
(10,  1, 'duel',         '{"from": "starter", "to": "pro"}',       '2023-05-22 09:15:00+00'),

-- Bob events (adventurer 2)
(11,  2, 'brawl',        '{"device": "desktop"}',                   '2023-02-20 09:00:00+00'),
(12,  2, 'feast',        '{"feature": "dashboard"}',                '2023-02-20 09:10:00+00'),
(13,  2, 'brawl',        '{"device": "desktop"}',                   '2023-03-10 10:00:00+00'),
(14,  2, 'feast',        '{"feature": "reports"}',                  '2023-03-10 10:30:00+00'),
(15,  2, 'rumor',        '{"format": "pdf", "rows": 200}',         '2023-03-10 11:00:00+00'),

-- Carol events (adventurer 3 — heavy user)
(16,  3, 'brawl',        '{"device": "desktop"}',                   '2023-02-15 09:00:00+00'),
(17,  3, 'feast',        '{"feature": "dashboard"}',                '2023-02-15 09:10:00+00'),
(18,  3, 'quest_posted', '{"endpoint": "/v1/analytics"}',           '2023-02-15 10:00:00+00'),
(19,  3, 'quest_posted', '{"endpoint": "/v1/reports"}',             '2023-02-15 10:30:00+00'),
(20,  3, 'quest_posted', '{"endpoint": "/v1/export"}',              '2023-02-15 11:00:00+00'),
(21,  3, 'brawl',        '{"device": "desktop"}',                   '2023-03-20 09:00:00+00'),
(22,  3, 'feast',        '{"feature": "integrations"}',             '2023-03-20 09:30:00+00'),
(23,  3, 'brawl',        '{"device": "mobile"}',                    '2023-04-20 08:00:00+00'),
(24,  3, 'quest_posted', '{"endpoint": "/v1/analytics"}',           '2023-05-10 14:00:00+00'),
(25,  3, 'rumor',        '{"format": "csv", "rows": 5000}',        '2023-05-10 14:30:00+00'),

-- David events (adventurer 4)
(26,  4, 'brawl',        '{"device": "desktop"}',                   '2023-03-10 11:00:00+00'),
(27,  4, 'feast',        '{"feature": "dashboard"}',                '2023-03-10 11:15:00+00'),
(28,  4, 'duel',         '{"from": "starter", "to": "pro"}',       '2023-03-10 11:30:00+00'),
(29,  4, 'brawl',        '{"device": "desktop"}',                   '2023-06-25 09:00:00+00'),
(30,  4, 'feast',        '{"feature": "reports"}',                  '2023-06-25 09:30:00+00'),

-- Emma events (adventurer 5 — light user)
(31,  5, 'brawl',        '{"device": "mobile"}',                    '2023-04-15 08:00:00+00'),
(32,  5, 'feast',        '{"feature": "dashboard"}',                '2023-04-15 08:10:00+00'),

-- Frank events (adventurer 6)
(33,  6, 'brawl',        '{"device": "desktop"}',                   '2023-04-20 16:00:00+00'),
(34,  6, 'feast',        '{"feature": "dashboard"}',                '2023-04-20 16:15:00+00'),
(35,  6, 'feast',        '{"feature": "storage"}',                  '2023-04-20 16:30:00+00'),
(36,  6, 'brawl',        '{"device": "desktop"}',                   '2023-08-10 09:00:00+00'),

-- Grace events (adventurer 7)
(37,  7, 'brawl',        '{"device": "desktop"}',                   '2023-04-25 12:00:00+00'),
(38,  7, 'feast',        '{"feature": "dashboard"}',                '2023-04-25 12:10:00+00'),
(39,  7, 'feast',        '{"feature": "reports"}',                  '2023-04-25 12:30:00+00'),
(40,  7, 'rumor',        '{"format": "csv", "rows": 800}',         '2023-04-25 13:00:00+00'),
(41,  7, 'brawl',        '{"device": "mobile"}',                    '2023-08-15 07:00:00+00'),
(42,  7, 'quest_posted', '{"endpoint": "/v1/analytics"}',           '2023-08-15 07:30:00+00'),

-- Henry events (adventurer 8 — healer, heavy quest_posted)
(43,  8, 'brawl',        '{"device": "desktop"}',                   '2023-05-10 10:00:00+00'),
(44,  8, 'quest_posted', '{"endpoint": "/v1/analytics"}',           '2023-05-10 10:15:00+00'),
(45,  8, 'quest_posted', '{"endpoint": "/v1/reports"}',             '2023-05-10 10:30:00+00'),
(46,  8, 'quest_posted', '{"endpoint": "/v1/export"}',              '2023-05-10 11:00:00+00'),
(47,  8, 'quest_posted', '{"endpoint": "/v1/analytics"}',           '2023-06-15 09:00:00+00'),
(48,  8, 'quest_posted', '{"endpoint": "/v1/analytics"}',           '2023-07-20 14:00:00+00'),
(49,  8, 'brawl',        '{"device": "desktop"}',                   '2023-08-20 10:00:00+00'),
(50,  8, 'rumor',        '{"format": "json", "rows": 10000}',      '2023-08-20 10:30:00+00'),

-- Iris events (adventurer 9)
(51,  9, 'brawl',        '{"device": "desktop"}',                   '2023-05-20 09:00:00+00'),
(52,  9, 'feast',        '{"feature": "dashboard"}',                '2023-05-20 09:15:00+00'),
(53,  9, 'brawl',        '{"device": "desktop"}',                   '2023-09-25 10:00:00+00'),

-- Jack events (adventurer 10)
(54, 10, 'brawl',        '{"device": "desktop"}',                   '2023-06-10 11:00:00+00'),
(55, 10, 'feast',        '{"feature": "dashboard"}',                '2023-06-10 11:10:00+00'),
(56, 10, 'feast',        '{"feature": "reports"}',                  '2023-06-10 11:30:00+00'),
(57, 10, 'brawl',        '{"device": "mobile"}',                    '2023-09-20 08:00:00+00'),
(58, 10, 'rumor',        '{"format": "csv", "rows": 500}',         '2023-09-20 08:30:00+00'),

-- Karen events (adventurer 11, exiled)
(59, 11, 'brawl',        '{"device": "desktop"}',                   '2023-02-25 10:00:00+00'),
(60, 11, 'feast',        '{"feature": "dashboard"}',                '2023-02-25 10:10:00+00'),
(61, 11, 'brawl',        '{"device": "desktop"}',                   '2023-05-15 09:00:00+00'),
(62, 11, 'duel',         '{"from": "starter", "to": "pro"}',       '2023-05-15 09:30:00+00'),

-- Leo events (adventurer 12, exiled)
(63, 12, 'brawl',        '{"device": "desktop"}',                   '2023-03-20 14:00:00+00'),
(64, 12, 'feast',        '{"feature": "reports"}',                  '2023-03-20 14:30:00+00'),
(65, 12, 'brawl',        '{"device": "desktop"}',                   '2023-06-10 09:00:00+00'),
(66, 12, 'feast',        '{"feature": "dashboard"}',                '2023-06-10 09:15:00+00'),

-- More adventurers' events
(67, 13, 'brawl',        '{"device": "mobile"}',                    '2023-04-01 09:00:00+00'),
(68, 14, 'brawl',        '{"device": "desktop"}',                   '2023-05-10 10:00:00+00'),
(69, 14, 'feast',        '{"feature": "dashboard"}',                '2023-05-10 10:15:00+00'),
(70, 15, 'brawl',        '{"device": "desktop"}',                   '2023-06-20 11:00:00+00'),
(71, 15, 'feast',        '{"feature": "reports"}',                  '2023-06-20 11:30:00+00'),
(72, 15, 'rumor',        '{"format": "csv", "rows": 300}',         '2023-06-20 12:00:00+00'),

-- Peter events (adventurer 16)
(73, 16, 'brawl',        '{"device": "desktop"}',                   '2023-06-25 08:00:00+00'),
(74, 16, 'feast',        '{"feature": "dashboard"}',                '2023-06-25 08:10:00+00'),
(75, 16, 'quest_posted', '{"endpoint": "/v1/analytics"}',           '2023-10-15 09:00:00+00'),

-- Quinn events (adventurer 17 — healer)
(76, 17, 'brawl',        '{"device": "desktop"}',                   '2023-07-10 10:00:00+00'),
(77, 17, 'quest_posted', '{"endpoint": "/v1/analytics"}',           '2023-07-10 10:30:00+00'),
(78, 17, 'quest_posted', '{"endpoint": "/v1/reports"}',             '2023-07-10 11:00:00+00'),
(79, 17, 'brawl',        '{"device": "desktop"}',                   '2023-10-20 09:00:00+00'),
(80, 17, 'rumor',        '{"format": "json", "rows": 8000}',       '2023-10-20 09:30:00+00'),

-- Rachel, Sam, Tina events
(81, 18, 'brawl',        '{"device": "mobile"}',                    '2023-07-20 14:00:00+00'),
(82, 19, 'brawl',        '{"device": "desktop"}',                   '2023-08-10 09:00:00+00'),
(83, 19, 'feast',        '{"feature": "dashboard"}',                '2023-08-10 09:10:00+00'),
(84, 20, 'brawl',        '{"device": "desktop"}',                   '2023-08-25 11:00:00+00'),
(85, 20, 'feast',        '{"feature": "reports"}',                  '2023-08-25 11:15:00+00'),
(86, 20, 'brawl',        '{"device": "mobile"}',                    '2023-12-10 08:00:00+00'),

-- Adventurers 21-25 (no quests, light activity)
(87, 21, 'brawl',        '{"device": "mobile"}',                    '2023-08-01 10:00:00+00'),
(88, 22, 'brawl',        '{"device": "desktop"}',                   '2023-08-15 09:00:00+00'),
(89, 23, 'brawl',        '{"device": "desktop"}',                   '2023-09-01 11:00:00+00'),
(90, 23, 'feast',        '{"feature": "dashboard"}',                '2023-09-01 11:10:00+00'),
(91, 24, 'brawl',        '{"device": "mobile"}',                    '2023-09-15 14:00:00+00'),
(92, 25, 'brawl',        '{"device": "desktop"}',                   '2023-10-01 08:00:00+00'),

-- Anna, Ben, Clara, Derek events
(93, 26, 'brawl',        '{"device": "desktop"}',                   '2023-07-15 10:00:00+00'),
(94, 26, 'feast',        '{"feature": "storage"}',                  '2023-07-15 10:15:00+00'),
(95, 27, 'brawl',        '{"device": "desktop"}',                   '2023-08-10 09:00:00+00'),
(96, 27, 'feast',        '{"feature": "dashboard"}',                '2023-08-10 09:15:00+00'),
(97, 27, 'quest_posted', '{"endpoint": "/v1/analytics"}',           '2023-08-10 10:00:00+00'),
(98, 28, 'brawl',        '{"device": "mobile"}',                    '2023-09-15 10:00:00+00'),
(99, 29, 'brawl',        '{"device": "desktop"}',                   '2023-10-10 11:00:00+00'),
(100, 29, 'quest_posted','{"endpoint": "/v1/analytics"}',           '2023-10-10 11:30:00+00'),
(101, 29, 'quest_posted','{"endpoint": "/v1/reports"}',             '2023-10-10 12:00:00+00'),
(102, 29, 'rumor',       '{"format": "csv", "rows": 3000}',        '2023-10-10 12:30:00+00'),

-- Elena, Finn, Gina events
(103, 30, 'brawl',       '{"device": "desktop"}',                   '2023-11-10 08:00:00+00'),
(104, 30, 'feast',       '{"feature": "reports"}',                  '2023-11-10 08:15:00+00'),
(105, 31, 'brawl',       '{"device": "desktop"}',                   '2023-11-25 09:00:00+00'),
(106, 32, 'brawl',       '{"device": "desktop"}',                   '2023-12-10 10:00:00+00'),
(107, 32, 'feast',       '{"feature": "dashboard"}',                '2023-12-10 10:10:00+00'),
(108, 32, 'rumor',       '{"format": "csv", "rows": 600}',         '2023-12-10 10:30:00+00'),

-- More events for time-series patterns (monthly brawls for window function exercises)
(109,  1, 'brawl',       '{"device": "desktop"}',                   '2023-06-15 10:00:00+00'),
(110,  1, 'brawl',       '{"device": "desktop"}',                   '2023-07-20 10:00:00+00'),
(111,  1, 'brawl',       '{"device": "desktop"}',                   '2023-08-18 10:00:00+00'),
(112,  1, 'brawl',       '{"device": "desktop"}',                   '2023-09-15 10:00:00+00'),
(113,  1, 'brawl',       '{"device": "desktop"}',                   '2023-10-20 10:00:00+00'),
(114,  1, 'brawl',       '{"device": "desktop"}',                   '2023-11-15 10:00:00+00'),
(115,  1, 'brawl',       '{"device": "desktop"}',                   '2023-12-18 10:00:00+00'),
(116,  1, 'brawl',       '{"device": "desktop"}',                   '2024-01-15 10:00:00+00'),
(117,  1, 'brawl',       '{"device": "desktop"}',                   '2024-02-20 10:00:00+00'),
(118,  1, 'brawl',       '{"device": "desktop"}',                   '2024-03-18 10:00:00+00'),

(119,  3, 'brawl',       '{"device": "desktop"}',                   '2023-06-20 09:00:00+00'),
(120,  3, 'brawl',       '{"device": "desktop"}',                   '2023-07-15 09:00:00+00'),
(121,  3, 'brawl',       '{"device": "desktop"}',                   '2023-08-22 09:00:00+00'),
(122,  3, 'brawl',       '{"device": "desktop"}',                   '2023-09-18 09:00:00+00'),
(123,  3, 'brawl',       '{"device": "desktop"}',                   '2023-10-16 09:00:00+00'),
(124,  3, 'brawl',       '{"device": "desktop"}',                   '2023-11-20 09:00:00+00'),
(125,  3, 'brawl',       '{"device": "desktop"}',                   '2023-12-15 09:00:00+00'),
(126,  3, 'brawl',       '{"device": "desktop"}',                   '2024-01-22 09:00:00+00'),

-- Exiled adventurers' late events
(127, 41, 'brawl',       '{"device": "desktop"}',                   '2023-04-10 09:00:00+00'),
(128, 41, 'feast',       '{"feature": "dashboard"}',                '2023-04-10 09:10:00+00'),
(129, 42, 'brawl',       '{"device": "mobile"}',                    '2023-05-25 09:00:00+00'),
(130, 43, 'brawl',       '{"device": "desktop"}',                   '2023-05-01 11:00:00+00'),
(131, 44, 'brawl',       '{"device": "desktop"}',                   '2023-07-25 14:00:00+00'),
(132, 44, 'feast',       '{"feature": "reports"}',                  '2023-07-25 14:15:00+00'),
(133, 45, 'brawl',       '{"device": "desktop"}',                   '2023-08-15 09:00:00+00'),

-- James, Kate, Liam, Maya events
(134, 35, 'brawl',       '{"device": "desktop"}',                   '2024-02-10 08:00:00+00'),
(135, 35, 'feast',       '{"feature": "dashboard"}',                '2024-02-10 08:10:00+00'),
(136, 35, 'quest_posted','{"endpoint": "/v1/analytics"}',           '2024-02-10 09:00:00+00'),
(137, 36, 'brawl',       '{"device": "desktop"}',                   '2024-02-20 10:00:00+00'),
(138, 36, 'quest_posted','{"endpoint": "/v1/analytics"}',           '2024-02-20 10:15:00+00'),
(139, 36, 'quest_posted','{"endpoint": "/v1/reports"}',             '2024-02-20 10:30:00+00'),
(140, 36, 'quest_posted','{"endpoint": "/v1/export"}',              '2024-02-20 11:00:00+00'),
(141, 37, 'brawl',       '{"device": "desktop"}',                   '2024-03-10 09:00:00+00'),
(142, 38, 'brawl',       '{"device": "desktop"}',                   '2024-03-25 11:00:00+00'),
(143, 38, 'feast',       '{"feature": "dashboard"}',                '2024-03-25 11:10:00+00'),

-- Warriors' minimal activity
(144, 33, 'brawl',       '{"device": "mobile"}',                    '2024-01-05 11:00:00+00'),
(145, 34, 'brawl',       '{"device": "desktop"}',                   '2024-01-20 14:00:00+00'),
(146, 34, 'feast',       '{"feature": "dashboard"}',                '2024-01-20 14:10:00+00'),
(147, 39, 'brawl',       '{"device": "desktop"}',                   '2024-04-10 14:00:00+00'),
(148, 40, 'brawl',       '{"device": "desktop"}',                   '2024-04-20 10:00:00+00'),
(149, 40, 'feast',       '{"feature": "dashboard"}',                '2024-04-20 10:10:00+00'),

-- Extra feast events for analytics
(150,  1, 'feast',       '{"feature": "integrations"}',             '2023-05-22 10:00:00+00'),
(151,  3, 'feast',       '{"feature": "api_keys"}',                 '2023-04-20 09:00:00+00'),
(152,  7, 'feast',       '{"feature": "integrations"}',             '2023-08-15 08:00:00+00'),
(153,  8, 'feast',       '{"feature": "api_keys"}',                 '2023-06-15 09:15:00+00'),
(154, 10, 'feast',       '{"feature": "integrations"}',             '2023-06-10 12:00:00+00'),
(155, 17, 'feast',       '{"feature": "api_keys"}',                 '2023-07-10 11:15:00+00'),
(156, 29, 'feast',       '{"feature": "api_keys"}',                 '2023-10-10 13:00:00+00'),
(157, 36, 'feast',       '{"feature": "api_keys"}',                 '2024-02-20 11:30:00+00'),

-- Duel prompts (for conversion analysis)
(158,  5, 'duel',        '{"from": "free", "to": "starter"}',      '2023-04-15 08:15:00+00'),
(159,  6, 'duel',        '{"from": "free", "to": "starter"}',      '2023-04-20 16:20:00+00'),
(160, 13, 'duel',        '{"from": "free", "to": "starter"}',      '2023-04-01 09:15:00+00'),
(161, 19, 'duel',        '{"from": "free", "to": "starter"}',      '2023-08-10 09:15:00+00'),
(162, 21, 'duel',        '{"from": "free", "to": "starter"}',      '2023-08-01 10:15:00+00'),
(163, 22, 'duel',        '{"from": "free", "to": "starter"}',      '2023-08-15 09:15:00+00'),
(164, 23, 'duel',        '{"from": "free", "to": "starter"}',      '2023-09-01 11:15:00+00'),
(165, 33, 'duel',        '{"from": "free", "to": "starter"}',      '2024-01-05 11:15:00+00'),

-- Additional quest_posted events for heavy users
(166,  3, 'quest_posted','{"endpoint": "/v1/analytics"}',           '2023-08-22 10:00:00+00'),
(167,  3, 'quest_posted','{"endpoint": "/v1/reports"}',             '2023-09-18 10:00:00+00'),
(168,  8, 'quest_posted','{"endpoint": "/v1/analytics"}',           '2023-08-20 11:00:00+00'),
(169,  8, 'quest_posted','{"endpoint": "/v1/reports"}',             '2023-11-15 09:00:00+00'),
(170, 17, 'quest_posted','{"endpoint": "/v1/analytics"}',           '2023-10-20 10:00:00+00'),
(171, 29, 'quest_posted','{"endpoint": "/v1/export"}',              '2024-01-25 10:00:00+00'),

-- Late 2024 events
(172,  1, 'brawl',       '{"device": "desktop"}',                   '2024-04-15 10:00:00+00'),
(173,  1, 'feast',       '{"feature": "dashboard"}',                '2024-04-15 10:10:00+00'),
(174,  3, 'brawl',       '{"device": "desktop"}',                   '2024-04-15 09:00:00+00'),
(175,  3, 'quest_posted','{"endpoint": "/v1/analytics"}',           '2024-04-15 09:30:00+00'),
(176,  7, 'brawl',       '{"device": "desktop"}',                   '2024-04-20 12:00:00+00'),
(177,  8, 'brawl',       '{"device": "desktop"}',                   '2024-05-10 10:00:00+00'),
(178,  8, 'quest_posted','{"endpoint": "/v1/analytics"}',           '2024-05-10 10:15:00+00'),
(179, 17, 'brawl',       '{"device": "desktop"}',                   '2024-02-05 09:00:00+00'),
(180, 17, 'quest_posted','{"endpoint": "/v1/analytics"}',           '2024-02-05 09:30:00+00'),

-- Fill to 200 with misc events
(181, 46, 'brawl',       '{"device": "mobile"}',                    '2024-04-01 10:00:00+00'),
(182, 47, 'brawl',       '{"device": "desktop"}',                   '2024-04-15 11:00:00+00'),
(183, 48, 'brawl',       '{"device": "desktop"}',                   '2024-05-01 09:00:00+00'),
(184, 49, 'brawl',       '{"device": "mobile"}',                    '2024-05-15 14:00:00+00'),
(185, 50, 'brawl',       '{"device": "desktop"}',                   '2024-06-01 08:00:00+00'),
(186,  2, 'brawl',       '{"device": "desktop"}',                   '2023-07-10 09:00:00+00'),
(187,  2, 'feast',       '{"feature": "storage"}',                  '2023-07-10 09:15:00+00'),
(188,  4, 'brawl',       '{"device": "desktop"}',                   '2023-11-20 10:00:00+00'),
(189,  4, 'feast',       '{"feature": "storage"}',                  '2023-11-20 10:15:00+00'),
(190,  6, 'brawl',       '{"device": "desktop"}',                   '2024-01-10 09:00:00+00'),
(191,  9, 'feast',       '{"feature": "dashboard"}',                '2023-09-25 10:15:00+00'),
(192, 10, 'brawl',       '{"device": "desktop"}',                   '2024-01-05 09:00:00+00'),
(193, 16, 'brawl',       '{"device": "desktop"}',                   '2024-03-10 08:00:00+00'),
(194, 18, 'feast',       '{"feature": "storage"}',                  '2023-07-20 14:15:00+00'),
(195, 20, 'feast',       '{"feature": "dashboard"}',                '2023-12-10 08:10:00+00'),
(196, 27, 'brawl',       '{"device": "desktop"}',                   '2024-01-20 09:00:00+00'),
(197, 30, 'brawl',       '{"device": "desktop"}',                   '2024-02-20 08:00:00+00'),
(198, 32, 'brawl',       '{"device": "desktop"}',                   '2024-03-15 09:00:00+00'),
(199, 35, 'brawl',       '{"device": "desktop"}',                   '2024-04-05 08:00:00+00'),
(200, 38, 'brawl',       '{"device": "desktop"}',                   '2024-05-10 11:00:00+00');

SELECT setval('theme_fantasy.tavern_logs_id_seq', 200);
