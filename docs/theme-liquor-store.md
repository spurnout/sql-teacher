# Liquor Store Theme — "Cresql Spirits"

> Master SQL by running the data behind a multi-location liquor store chain

## Theme Overview

| Field | Value |
|-------|-------|
| **Name** | Cresql Spirits |
| **Tagline** | Pour through your data — master SQL with a real liquor store database |
| **Icon** | `\ud83c\udf7e` |
| **Domain** | Multi-location retail liquor chain |
| **Source** | Real SQL Server POS system (cresql.sql, 253 tables) |
| **Dialect** | SQL Server → PostgreSQL (auto-converted) |

---

## Core Teaching Tables (10 tables)

The full database has 253 tables. For teaching, we focus on the 10 most interconnected and query-rich tables:

### 1. `inventory` — Products on the shelves

| Column | Type | Notes |
|--------|------|-------|
| itemnum | varchar(20) | PK (SKU) |
| itemname | varchar(30) | Product name |
| store_id | varchar(10) | PK (multi-store) |
| cat_id | varchar(8) | FK → categories |
| dept_id | varchar(8) | FK → departments |
| cost | numeric(19,4) | Wholesale cost |
| price | numeric(19,4) | Selling price |
| in_stock | decimal(18,2) | Current quantity |
| reorder_level | decimal(18,2) | Min stock before reorder |
| reorder_quantity | decimal(18,2) | How much to reorder |
| tax_1 | boolean | Subject to tax type 1 |
| tax_2 | boolean | Subject to tax type 2 |
| tax_3 | boolean | Subject to tax type 3 |
| active | boolean | Currently sold |
| vendor_id | varchar(15) | FK → vendors |
| upc | varchar(20) | Barcode |

### 2. `customer` — Regulars and account holders

| Column | Type | Notes |
|--------|------|-------|
| custnum | varchar(12) | PK |
| store_id | varchar(10) | PK |
| first_name | varchar(20) | |
| last_name | varchar(30) | |
| city | varchar(25) | |
| state | varchar(2) | |
| zip_code | varchar(10) | |
| phone_1 | varchar(20) | |
| email | varchar(75) | |
| acct_balance | numeric(19,4) | Outstanding balance |
| acct_max_balance | numeric(19,4) | Credit limit |
| bonus_points | integer | Loyalty points |
| discount_percent | real | Customer discount |
| license_num | varchar(30) | Age verification |
| license_expdate | timestamp | ID expiration |
| created | timestamp | Account creation date |

### 3. `invoice_totals` — Every sale (header)

| Column | Type | Notes |
|--------|------|-------|
| invoice_number | bigint | PK |
| store_id | varchar(10) | PK |
| custnum | varchar(12) | FK → customer |
| datetime | timestamp | When the sale happened |
| total_cost | numeric(19,4) | Total wholesale cost |
| total_price | numeric(19,4) | Subtotal before tax |
| total_tax1 | numeric(19,4) | Tax type 1 total |
| total_tax2 | numeric(19,4) | Tax type 2 total |
| total_tax3 | numeric(19,4) | Tax type 3 total |
| grand_total | numeric(19,4) | Customer pays this |
| amt_tendered | numeric(19,4) | Cash given |
| amt_change | numeric(19,4) | Change returned |
| ca_amount | numeric(19,4) | Cash portion |
| cc_amount | numeric(19,4) | Credit card portion |
| ch_amount | numeric(19,4) | Check portion |
| gc_amount | numeric(19,4) | Gift card portion |
| cashier_id | varchar(10) | FK → employee |
| station_id | varchar(10) | Which register |
| status | varchar(1) | C=Complete, V=Void |

### 4. `invoice_itemized` — Every line item

| Column | Type | Notes |
|--------|------|-------|
| invoice_number | bigint | FK → invoice_totals |
| store_id | varchar(10) | FK |
| linenum | integer | Line within invoice |
| itemnum | varchar(20) | FK → inventory |
| quantity | decimal(18,2) | How many sold |
| costper | numeric(19,4) | Wholesale unit cost |
| priceper | numeric(19,4) | Selling unit price |
| linedisc | numeric(19,4) | Line discount amount |
| tax1per | numeric(19,4) | Tax 1 for this line |
| tax2per | numeric(19,4) | Tax 2 for this line |
| tax3per | numeric(19,4) | Tax 3 for this line |

### 5. `categories` — Product categories

| Column | Type | Notes |
|--------|------|-------|
| cat_id | varchar(8) | PK |
| store_id | varchar(10) | PK |
| description | varchar(30) | e.g., BEER, WINE, SPIRITS |

Known values: 1100=BEER, 1200=COUPON, 1250=CRV, 1300=DELI, 1400=WINE, 1500=SPIRITS, plus delivery apps (Postmates, Drizly, DoorDash, etc.)

### 6. `departments` — Store departments

| Column | Type | Notes |
|--------|------|-------|
| dept_id | varchar(8) | PK |
| store_id | varchar(10) | PK |
| description | varchar(30) | |
| cost_markup | real | Default markup % |

### 7. `employee` — Staff (cashiers, managers)

| Column | Type | Notes |
|--------|------|-------|
| cashier_id | varchar(10) | PK |
| store_id | varchar(10) | PK |
| name | varchar(20) | Display name |
| hourly_wage | numeric(19,4) | Pay rate |
| dept_id | varchar(8) | FK → departments |
| active | boolean | Currently employed |

(30+ permission flags omitted for teaching — explored in advanced exercises)

### 8. `cc_trans` — Credit card transactions

| Column | Type | Notes |
|--------|------|-------|
| store_id | varchar(10) | PK |
| datetime | timestamp | PK |
| number | varchar(200) | PK (card reference) |
| type | varchar(50) | Transaction type |
| amount | numeric(19,4) | Charged amount |
| cardtype | smallint | Visa/MC/Amex/etc. |
| truncatedcardnumber | varchar(25) | Last 4 digits |
| tip_applied | boolean | Tip included? |
| tipamount | numeric(19,4) | Tip amount |

### 9. `vendors` — Suppliers / distributors

| Column | Type | Notes |
|--------|------|-------|
| vendor_id | varchar(15) | PK |
| store_id | varchar(10) | PK |
| name | varchar(30) | Company name |
| contact | varchar(30) | Sales rep |
| phone_1 | varchar(20) | |
| city | varchar(25) | |
| state | varchar(2) | |

### 10. `gift_card_trans` — Gift card activity

| Column | Type | Notes |
|--------|------|-------|
| store_id | varchar(10) | PK |
| datetime | timestamp | |
| cardnumber | varchar(30) | Card identifier |
| amount | numeric(19,4) | Transaction amount |
| balance | numeric(19,4) | Remaining balance |
| transtype | varchar(10) | Activate/Redeem/Reload |

---

## Phase 0: SQL Fundamentals

*"Your first day managing the store's data. Start by exploring what's on the shelves."*

### Exercise 0.1 — What's in Stock? (worked-example)
**Concept:** SELECT *
```sql
SELECT * FROM inventory LIMIT 10;
```
*See the full product catalog — every column, every detail.*

### Exercise 0.2 — Product Names and Prices (worked-example)
**Concept:** SELECT specific columns
```sql
SELECT itemname, price FROM inventory LIMIT 20;
```
*Pick just the columns you need — like scanning price tags.*

### Exercise 0.3 — Premium Spirits (scaffolded)
**Concept:** WHERE with comparison
```sql
SELECT itemname, price
FROM inventory
WHERE price > 50.00
ORDER BY price DESC;
```
*Find every bottle over $50. Order from most to least expensive.*

### Exercise 0.4 — Category Browsing (open)
**Concept:** WHERE with text matching
```sql
SELECT itemname, price, cat_id
FROM inventory
WHERE cat_id = '1500'
  AND active = true
ORDER BY itemname;
```
*List all active spirits (category 1500). Alphabetical, please.*

### Exercise 0.5 — Low Stock Alert (open)
**Concept:** WHERE with AND, comparison operators
```sql
SELECT itemname, in_stock, reorder_level
FROM inventory
WHERE in_stock < reorder_level
  AND active = true
ORDER BY in_stock ASC;
```
*Which products need reordering? Stock below their reorder level.*

### Exercise 0.6 — Count the Shelves (scaffolded)
**Concept:** COUNT aggregate
```sql
SELECT COUNT(*) AS total_products
FROM inventory
WHERE active = true;
```
*How many active products do we carry?*

### Exercise 0.7 — Average Bottle Price (open)
**Concept:** AVG, ROUND
```sql
SELECT ROUND(AVG(price)::numeric, 2) AS avg_price
FROM inventory
WHERE active = true AND price > 0;
```
*What's the average selling price across all active products?*

### Exercise 0.8 — Sales by Category (open)
**Concept:** GROUP BY with aggregate
```sql
SELECT c.description AS category, COUNT(*) AS product_count
FROM inventory i
JOIN categories c ON i.cat_id = c.cat_id AND i.store_id = c.store_id
WHERE i.active = true
GROUP BY c.description
ORDER BY product_count DESC;
```
*How many products in each category? Beer vs Wine vs Spirits...*

### Exercise 0.9 — Today's Top Sellers (open)
**Concept:** GROUP BY, SUM, ORDER BY, LIMIT
```sql
SELECT i.itemname,
       SUM(li.quantity) AS units_sold,
       SUM(li.quantity * li.priceper) AS revenue
FROM invoice_itemized li
JOIN inventory i ON li.itemnum = i.itemnum AND li.store_id = i.store_id
GROUP BY i.itemname
ORDER BY revenue DESC
LIMIT 10;
```
*Find the 10 products that generated the most revenue.*

### Exercise 0.10 — Revenue by Payment Method (quiz)
**Concept:** Understanding column meanings
```
Q: Which column in invoice_totals shows how much was paid by credit card?
A) grand_total  B) cc_amount  C) amt_tendered  D) total_price
Answer: B) cc_amount
```

---

## Phase 1: JOIN Mastery

*"Connect the dots. Link sales to products, customers to transactions, employees to registers."*

### Exercise 1.1 — Product Details on Receipts (worked-example)
**Concept:** INNER JOIN
```sql
SELECT it.invoice_number,
       inv.itemname,
       li.quantity,
       li.priceper
FROM invoice_itemized li
INNER JOIN inventory inv ON li.itemnum = inv.itemnum AND li.store_id = inv.store_id
INNER JOIN invoice_totals it ON li.invoice_number = it.invoice_number AND li.store_id = it.store_id
LIMIT 20;
```
*Enrich line items with product names and invoice numbers.*

### Exercise 1.2 — Customers and Their Spending (scaffolded)
**Concept:** LEFT JOIN
```sql
SELECT c.first_name, c.last_name,
       COALESCE(SUM(it.grand_total), 0) AS total_spent
FROM customer c
LEFT JOIN invoice_totals it ON c.custnum = it.custnum AND c.store_id = it.store_id
GROUP BY c.first_name, c.last_name
ORDER BY total_spent DESC
LIMIT 20;
```
*Every customer and what they've spent. Include those with $0.*

### Exercise 1.3 — Which Cashier Rang It Up? (open)
**Concept:** Multi-table JOIN
```sql
SELECT e.name AS cashier,
       COUNT(it.invoice_number) AS transactions,
       SUM(it.grand_total) AS total_sales
FROM invoice_totals it
JOIN employee e ON it.cashier_id = e.cashier_id AND it.store_id = e.store_id
GROUP BY e.name
ORDER BY total_sales DESC;
```
*Sales performance by employee.*

### Exercise 1.4 — Products Never Sold (open)
**Concept:** LEFT JOIN with NULL check (anti-join)
```sql
SELECT inv.itemnum, inv.itemname, inv.price
FROM inventory inv
LEFT JOIN invoice_itemized li ON inv.itemnum = li.itemnum AND inv.store_id = li.store_id
WHERE li.itemnum IS NULL
  AND inv.active = true
ORDER BY inv.price DESC;
```
*Find active products with zero sales. Dead stock.*

### Exercise 1.5 — Vendor Product Portfolio (open)
**Concept:** JOIN with aggregation
```sql
SELECT v.name AS vendor,
       COUNT(inv.itemnum) AS products,
       ROUND(AVG(inv.price)::numeric, 2) AS avg_price
FROM vendors v
JOIN inventory inv ON v.vendor_id = inv.vendor_id AND v.store_id = inv.store_id
WHERE inv.active = true
GROUP BY v.name
ORDER BY products DESC;
```
*How many products does each vendor supply? Average price?*

### Exercise 1.6 — Category Revenue Breakdown (open)
**Concept:** Three-table JOIN
```sql
SELECT c.description AS category,
       SUM(li.quantity * li.priceper) AS revenue,
       SUM(li.quantity) AS units
FROM invoice_itemized li
JOIN inventory inv ON li.itemnum = inv.itemnum AND li.store_id = inv.store_id
JOIN categories c ON inv.cat_id = c.cat_id AND inv.store_id = c.store_id
GROUP BY c.description
ORDER BY revenue DESC;
```
*Revenue breakdown: Beer, Wine, Spirits, Deli, etc.*

### Exercise 1.7 — Self-Join: Products in Same Category (debug)
**Concept:** Self-join
```sql
-- BUG: This query returns each product paired with itself
SELECT a.itemname AS product_1, b.itemname AS product_2, a.price, b.price
FROM inventory a
JOIN inventory b ON a.cat_id = b.cat_id AND a.store_id = b.store_id
WHERE a.itemnum < b.itemnum  -- FIX: exclude self-matches and duplicates
LIMIT 20;
```
*Find product pairs in the same category. The bug: each product matches itself.*

---

## Phase 2: Subqueries

*"Ask questions about questions. Nest your queries like Russian dolls."*

### Exercise 2.1 — Above Average Price (worked-example)
**Concept:** Scalar subquery in WHERE
```sql
SELECT itemname, price
FROM inventory
WHERE price > (SELECT AVG(price) FROM inventory WHERE active = true)
  AND active = true
ORDER BY price DESC;
```
*Products priced above the store average.*

### Exercise 2.2 — Customers Who Spent More Than Average (open)
**Concept:** Subquery with HAVING
```sql
SELECT c.first_name, c.last_name, SUM(it.grand_total) AS total_spent
FROM customer c
JOIN invoice_totals it ON c.custnum = it.custnum AND c.store_id = it.store_id
GROUP BY c.custnum, c.first_name, c.last_name
HAVING SUM(it.grand_total) > (
    SELECT AVG(customer_total)
    FROM (
        SELECT SUM(grand_total) AS customer_total
        FROM invoice_totals
        GROUP BY custnum
    ) sub
)
ORDER BY total_spent DESC;
```

### Exercise 2.3 — Most Expensive Product per Category (open)
**Concept:** Correlated subquery
```sql
SELECT inv.itemname, inv.price, c.description AS category
FROM inventory inv
JOIN categories c ON inv.cat_id = c.cat_id AND inv.store_id = c.store_id
WHERE inv.price = (
    SELECT MAX(i2.price)
    FROM inventory i2
    WHERE i2.cat_id = inv.cat_id AND i2.store_id = inv.store_id
      AND i2.active = true
)
AND inv.active = true;
```
*The priciest bottle in each category.*

### Exercise 2.4 — Categories with No Recent Sales (open)
**Concept:** NOT EXISTS
```sql
SELECT c.cat_id, c.description
FROM categories c
WHERE NOT EXISTS (
    SELECT 1
    FROM invoice_itemized li
    JOIN inventory inv ON li.itemnum = inv.itemnum AND li.store_id = inv.store_id
    WHERE inv.cat_id = c.cat_id AND inv.store_id = c.store_id
);
```
*Which categories haven't moved any product?*

### Exercise 2.5 — Derived Table: Daily Revenue Summary (open)
**Concept:** FROM subquery (derived table)
```sql
SELECT daily.sale_date, daily.revenue, daily.transactions
FROM (
    SELECT DATE(datetime) AS sale_date,
           SUM(grand_total) AS revenue,
           COUNT(*) AS transactions
    FROM invoice_totals
    WHERE status = 'C'
    GROUP BY DATE(datetime)
) daily
WHERE daily.revenue > 1000
ORDER BY daily.sale_date DESC;
```
*Days where revenue exceeded $1,000.*

---

## Phase 3: Common Table Expressions (CTEs)

*"Name your subqueries. Build complex analysis step by step."*

### Exercise 3.1 — Step-by-Step Revenue Analysis (worked-example)
**Concept:** Basic CTE
```sql
WITH daily_sales AS (
    SELECT DATE(datetime) AS sale_date,
           SUM(grand_total) AS revenue,
           COUNT(*) AS transactions
    FROM invoice_totals
    WHERE status = 'C'
    GROUP BY DATE(datetime)
)
SELECT sale_date, revenue, transactions,
       ROUND(revenue / transactions, 2) AS avg_per_transaction
FROM daily_sales
ORDER BY sale_date DESC
LIMIT 30;
```

### Exercise 3.2 — Multi-CTE: Profit Margin by Category (open)
**Concept:** Multiple CTEs
```sql
WITH category_revenue AS (
    SELECT inv.cat_id,
           SUM(li.quantity * li.priceper) AS revenue,
           SUM(li.quantity * li.costper) AS cost
    FROM invoice_itemized li
    JOIN inventory inv ON li.itemnum = inv.itemnum AND li.store_id = inv.store_id
    GROUP BY inv.cat_id
),
category_names AS (
    SELECT DISTINCT cat_id, description
    FROM categories
)
SELECT cn.description AS category,
       cr.revenue,
       cr.cost,
       cr.revenue - cr.cost AS profit,
       ROUND(((cr.revenue - cr.cost) / NULLIF(cr.revenue, 0) * 100)::numeric, 1) AS margin_pct
FROM category_revenue cr
JOIN category_names cn ON cr.cat_id = cn.cat_id
ORDER BY margin_pct DESC;
```
*Which category has the best profit margin?*

### Exercise 3.3 — Inventory Valuation Report (open)
**Concept:** CTE with CASE
```sql
WITH stock_value AS (
    SELECT inv.itemnum, inv.itemname,
           c.description AS category,
           inv.in_stock,
           inv.cost,
           inv.price,
           inv.in_stock * inv.cost AS cost_value,
           inv.in_stock * inv.price AS retail_value,
           CASE
               WHEN inv.in_stock <= 0 THEN 'OUT_OF_STOCK'
               WHEN inv.in_stock < inv.reorder_level THEN 'LOW'
               WHEN inv.in_stock < inv.reorder_level * 2 THEN 'NORMAL'
               ELSE 'OVERSTOCKED'
           END AS stock_status
    FROM inventory inv
    JOIN categories c ON inv.cat_id = c.cat_id AND inv.store_id = c.store_id
    WHERE inv.active = true
)
SELECT category, stock_status,
       COUNT(*) AS products,
       SUM(cost_value) AS total_cost_value,
       SUM(retail_value) AS total_retail_value
FROM stock_value
GROUP BY category, stock_status
ORDER BY category, stock_status;
```
*Inventory valuation grouped by category and stock health.*

### Exercise 3.4 — Recursive CTE: Date Series (scaffolded)
**Concept:** Recursive CTE for generating date ranges
```sql
WITH RECURSIVE date_range AS (
    SELECT DATE('2024-01-01') AS d
    UNION ALL
    SELECT d + INTERVAL '1 day'
    FROM date_range
    WHERE d < DATE('2024-01-31')
)
SELECT dr.d AS sale_date,
       COALESCE(SUM(it.grand_total), 0) AS revenue
FROM date_range dr
LEFT JOIN invoice_totals it ON DATE(it.datetime) = dr.d AND it.status = 'C'
GROUP BY dr.d
ORDER BY dr.d;
```
*Daily revenue for January — including days with zero sales.*

---

## Phase 4: Window Functions

*"Look through windows into your data. Rankings, running totals, and comparisons."*

### Exercise 4.1 — Rank Products by Revenue (worked-example)
**Concept:** RANK()
```sql
SELECT itemname, revenue,
       RANK() OVER (ORDER BY revenue DESC) AS revenue_rank
FROM (
    SELECT inv.itemname,
           SUM(li.quantity * li.priceper) AS revenue
    FROM invoice_itemized li
    JOIN inventory inv ON li.itemnum = inv.itemnum AND li.store_id = inv.store_id
    GROUP BY inv.itemname
) product_revenue
LIMIT 20;
```

### Exercise 4.2 — Running Total of Daily Sales (open)
**Concept:** SUM() OVER with ORDER BY
```sql
SELECT DATE(datetime) AS sale_date,
       SUM(grand_total) AS daily_revenue,
       SUM(SUM(grand_total)) OVER (ORDER BY DATE(datetime)) AS running_total
FROM invoice_totals
WHERE status = 'C'
GROUP BY DATE(datetime)
ORDER BY sale_date;
```
*Cumulative revenue over time.*

### Exercise 4.3 — Day-over-Day Change (open)
**Concept:** LAG()
```sql
WITH daily AS (
    SELECT DATE(datetime) AS sale_date,
           SUM(grand_total) AS revenue
    FROM invoice_totals
    WHERE status = 'C'
    GROUP BY DATE(datetime)
)
SELECT sale_date, revenue,
       LAG(revenue) OVER (ORDER BY sale_date) AS prev_day,
       ROUND(
           ((revenue - LAG(revenue) OVER (ORDER BY sale_date))
            / NULLIF(LAG(revenue) OVER (ORDER BY sale_date), 0) * 100)::numeric,
           1
       ) AS pct_change
FROM daily
ORDER BY sale_date DESC
LIMIT 30;
```
*Day-over-day revenue change percentage.*

### Exercise 4.4 — Top Product per Category (open)
**Concept:** ROW_NUMBER() OVER PARTITION BY
```sql
WITH ranked AS (
    SELECT inv.itemname,
           c.description AS category,
           SUM(li.quantity * li.priceper) AS revenue,
           ROW_NUMBER() OVER (
               PARTITION BY c.description
               ORDER BY SUM(li.quantity * li.priceper) DESC
           ) AS rn
    FROM invoice_itemized li
    JOIN inventory inv ON li.itemnum = inv.itemnum AND li.store_id = inv.store_id
    JOIN categories c ON inv.cat_id = c.cat_id AND inv.store_id = c.store_id
    GROUP BY inv.itemname, c.description
)
SELECT category, itemname, revenue
FROM ranked
WHERE rn = 1
ORDER BY revenue DESC;
```
*The #1 seller in each category.*

### Exercise 4.5 — Moving Average of Sales (open)
**Concept:** Window frame (ROWS BETWEEN)
```sql
SELECT DATE(datetime) AS sale_date,
       SUM(grand_total) AS daily_revenue,
       ROUND(
           AVG(SUM(grand_total)) OVER (
               ORDER BY DATE(datetime)
               ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
           )::numeric, 2
       ) AS seven_day_avg
FROM invoice_totals
WHERE status = 'C'
GROUP BY DATE(datetime)
ORDER BY sale_date DESC
LIMIT 30;
```
*7-day moving average to smooth out daily fluctuations.*

### Exercise 4.6 — Cashier Performance Percentile (open)
**Concept:** PERCENT_RANK()
```sql
WITH cashier_stats AS (
    SELECT e.name AS cashier,
           SUM(it.grand_total) AS total_sales,
           COUNT(*) AS transactions
    FROM invoice_totals it
    JOIN employee e ON it.cashier_id = e.cashier_id AND it.store_id = e.store_id
    WHERE it.status = 'C'
    GROUP BY e.name
)
SELECT cashier, total_sales, transactions,
       ROUND(PERCENT_RANK() OVER (ORDER BY total_sales)::numeric * 100, 0) AS percentile
FROM cashier_stats
ORDER BY total_sales DESC;
```
*Where does each cashier rank in total sales?*

---

## Phase 5: Query Optimization

*"Make it fast. Understand execution plans and indexing."*

### Exercise 5.1 — Read an Execution Plan (worked-example)
**Concept:** EXPLAIN ANALYZE
```sql
EXPLAIN ANALYZE
SELECT inv.itemname, SUM(li.quantity) AS units_sold
FROM invoice_itemized li
JOIN inventory inv ON li.itemnum = inv.itemnum AND li.store_id = inv.store_id
GROUP BY inv.itemname
ORDER BY units_sold DESC
LIMIT 10;
```
*Read the plan: Seq Scan vs Index Scan? Nested Loop vs Hash Join?*

### Exercise 5.2 — Index Strategy for Common Queries (quiz)
```
Q: The store manager runs "SELECT * FROM invoice_totals WHERE datetime > '2024-06-01'"
   daily. Which index would help most?
A) CREATE INDEX ON invoice_totals(invoice_number)
B) CREATE INDEX ON invoice_totals(datetime)
C) CREATE INDEX ON invoice_totals(grand_total)
D) CREATE INDEX ON invoice_totals(store_id, datetime)
Answer: D — composite index matches the implicit store_id filter
         and the datetime range scan
```

### Exercise 5.3 — Before and After Index (open)
**Concept:** Creating index and measuring impact
```sql
-- Step 1: Measure without index
EXPLAIN ANALYZE
SELECT * FROM cc_trans
WHERE datetime > '2024-06-01'
  AND amount > 100;

-- Step 2: Create index
CREATE INDEX idx_cc_trans_datetime_amount
ON cc_trans(datetime, amount);

-- Step 3: Measure again
EXPLAIN ANALYZE
SELECT * FROM cc_trans
WHERE datetime > '2024-06-01'
  AND amount > 100;
```

---

## Phase 6: SQL Patterns

*"Advanced techniques: CASE expressions, string functions, date math, and set operations."*

### Exercise 6.1 — Payment Method Breakdown (worked-example)
**Concept:** CASE WHEN
```sql
SELECT
    CASE
        WHEN cc_amount > 0 AND ca_amount = 0 THEN 'Card Only'
        WHEN ca_amount > 0 AND cc_amount = 0 THEN 'Cash Only'
        WHEN cc_amount > 0 AND ca_amount > 0 THEN 'Split Payment'
        WHEN gc_amount > 0 THEN 'Gift Card'
        ELSE 'Other'
    END AS payment_method,
    COUNT(*) AS transactions,
    SUM(grand_total) AS revenue
FROM invoice_totals
WHERE status = 'C'
GROUP BY 1
ORDER BY revenue DESC;
```

### Exercise 6.2 — Price Tier Analysis (open)
**Concept:** CASE in SELECT and GROUP BY
```sql
SELECT
    CASE
        WHEN price < 10 THEN 'Budget (<$10)'
        WHEN price < 25 THEN 'Mid-Range ($10-$25)'
        WHEN price < 50 THEN 'Premium ($25-$50)'
        WHEN price < 100 THEN 'Top Shelf ($50-$100)'
        ELSE 'Ultra Premium ($100+)'
    END AS price_tier,
    COUNT(*) AS products,
    ROUND(AVG(price)::numeric, 2) AS avg_price,
    SUM(in_stock) AS total_stock
FROM inventory
WHERE active = true AND price > 0
GROUP BY 1
ORDER BY MIN(price);
```

### Exercise 6.3 — Monthly Sales Trend (open)
**Concept:** DATE_TRUNC, EXTRACT
```sql
SELECT DATE_TRUNC('month', datetime) AS month,
       COUNT(*) AS transactions,
       SUM(grand_total) AS revenue,
       ROUND(AVG(grand_total)::numeric, 2) AS avg_ticket
FROM invoice_totals
WHERE status = 'C'
GROUP BY DATE_TRUNC('month', datetime)
ORDER BY month;
```

### Exercise 6.4 — Products Sold in Both Stores (open)
**Concept:** INTERSECT
```sql
SELECT itemnum, itemname
FROM inventory
WHERE store_id = '1001' AND active = true
INTERSECT
SELECT itemnum, itemname
FROM inventory
WHERE store_id = '1002' AND active = true
ORDER BY itemname;
```
*Products carried by both locations.*

### Exercise 6.5 — COALESCE for Clean Reports (open)
**Concept:** COALESCE, NULL handling
```sql
SELECT c.first_name || ' ' || c.last_name AS customer_name,
       COALESCE(c.email, 'No email') AS email,
       COALESCE(c.phone_1, c.phone_2, 'No phone') AS phone,
       COALESCE(c.acct_balance, 0) AS balance
FROM customer c
WHERE c.acct_balance > 0
ORDER BY c.acct_balance DESC;
```
*Clean customer report with fallback values for missing data.*

---

## Phase 7: DML & DDL

*"Create tables, insert data, update records. Move beyond read-only."*

### Exercise 7.1 — Create a Sales Summary Table (worked-example)
**Concept:** CREATE TABLE AS
```sql
CREATE TABLE monthly_sales_summary AS
SELECT DATE_TRUNC('month', datetime) AS month,
       store_id,
       COUNT(*) AS transactions,
       SUM(grand_total) AS revenue,
       SUM(total_tax1 + total_tax2 + total_tax3) AS total_tax
FROM invoice_totals
WHERE status = 'C'
GROUP BY DATE_TRUNC('month', datetime), store_id;
```

### Exercise 7.2 — Price Adjustment (open)
**Concept:** UPDATE with subquery
```sql
-- Raise prices 5% on products from a specific vendor
UPDATE inventory
SET price = ROUND((price * 1.05)::numeric, 2)
WHERE vendor_id = 'V001'
  AND active = true;
```

### Exercise 7.3 — Deactivate Dead Stock (open)
**Concept:** UPDATE with NOT EXISTS
```sql
-- Deactivate products that haven't sold in 6 months
UPDATE inventory
SET active = false
WHERE active = true
  AND NOT EXISTS (
      SELECT 1
      FROM invoice_itemized li
      JOIN invoice_totals it ON li.invoice_number = it.invoice_number
                            AND li.store_id = it.store_id
      WHERE li.itemnum = inventory.itemnum
        AND li.store_id = inventory.store_id
        AND it.datetime > CURRENT_TIMESTAMP - INTERVAL '6 months'
  );
```

### Exercise 7.4 — Create a View (open)
**Concept:** CREATE VIEW
```sql
CREATE VIEW product_performance AS
SELECT inv.itemnum, inv.itemname,
       c.description AS category,
       inv.price,
       inv.in_stock,
       COALESCE(SUM(li.quantity), 0) AS total_sold,
       COALESCE(SUM(li.quantity * li.priceper), 0) AS total_revenue
FROM inventory inv
LEFT JOIN invoice_itemized li ON inv.itemnum = li.itemnum AND inv.store_id = li.store_id
LEFT JOIN categories c ON inv.cat_id = c.cat_id AND inv.store_id = c.store_id
WHERE inv.active = true
GROUP BY inv.itemnum, inv.itemname, c.description, inv.price, inv.in_stock;
```

---

## Phase 8: Database Administration

*"Behind the scenes: indexes, transactions, permissions, and maintenance."*

### Exercise 8.1 — Table Size Analysis (open)
```sql
SELECT relname AS table_name,
       pg_size_pretty(pg_total_relation_size(oid)) AS total_size,
       pg_size_pretty(pg_relation_size(oid)) AS data_size,
       pg_size_pretty(pg_total_relation_size(oid) - pg_relation_size(oid)) AS index_size,
       n_live_tup AS estimated_rows
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(oid) DESC
LIMIT 10;
```

### Exercise 8.2 — Transaction Safety (worked-example)
**Concept:** BEGIN/COMMIT/ROLLBACK
```sql
BEGIN;

-- Transfer a product between stores
UPDATE inventory SET in_stock = in_stock - 5
WHERE itemnum = 'SKU001' AND store_id = '1001';

UPDATE inventory SET in_stock = in_stock + 5
WHERE itemnum = 'SKU001' AND store_id = '1002';

COMMIT;
```

---

## Capstone Projects

### Capstone 1: "The Monthly P&L Dashboard"
*The owner wants a monthly profit & loss report.*

**Exercises:**
1. Monthly revenue by category (Beer/Wine/Spirits/Other)
2. Cost of goods sold (COGS) using costper from invoice_itemized
3. Gross margin percentage by month
4. Tax collection summary (3 tax types)
5. Cashier productivity ranking

### Capstone 2: "The Inventory Optimization Report"
*Reduce waste and stockouts.*

**Exercises:**
1. Dead stock identification (unsold in 90 days)
2. Fast movers vs slow movers (turnover rate)
3. Reorder recommendations (stock < reorder_level)
4. Overstock analysis (stock > 3x reorder_quantity)
5. Vendor delivery performance (products per vendor, price trends)

### Capstone 3: "Customer Loyalty Analysis"
*Who are our best customers?*

**Exercises:**
1. Customer lifetime value (total spend per customer)
2. Customer purchase frequency (transactions per month)
3. Average basket size (items per transaction)
4. Loyal vs one-time customers
5. Bonus points ROI (points earned vs redeemed)

### Capstone 4: "Payment Reconciliation Audit"
*Make sure the money adds up.*

**Exercises:**
1. Daily cash register reconciliation (ca_amount vs amt_tendered - amt_change)
2. Credit card transaction matching (cc_trans vs invoice cc_amount)
3. Gift card balance integrity (activations - redemptions = current balances)
4. Void transaction analysis (status = 'V' patterns)
5. Tip analysis by time of day and payment method

---

## Scenarios (Real-World Business Cases)

### Scenario 1: "The Delivery App Audit"
*Categories 1010M-1010R represent Postmates, Drizly, Saucey, UberEats, GrubHub, and DoorDash orders. Management wants to know: Are delivery apps profitable?*

**Steps:**
1. Revenue from each delivery platform (by cat_id)
2. Compare delivery vs in-store basket size
3. Profit margins on delivery orders vs walk-ins
4. Peak delivery hours vs peak in-store hours

### Scenario 2: "Tax Season Preparation"
*The accountant needs clean data for the tax return.*

**Steps:**
1. Total revenue by tax type (tax_1, tax_2, tax_3 at item level)
2. Tax-exempt sales identification
3. Monthly tax liability trend
4. Reconcile item-level tax with invoice-level tax totals

### Scenario 3: "Theft and Loss Prevention"
*Something doesn't add up. Help the loss prevention team investigate.*

**Steps:**
1. Find voided transactions (status = 'V') grouped by cashier
2. Unusual discount patterns (high linedisc relative to priceper)
3. Cash-only transactions at unusual hours
4. Inventory shrinkage (expected vs actual stock levels)

### Scenario 4: "New Store Opening"
*A third location is opening. Use data to plan the product mix.*

**Steps:**
1. Identify top 100 products by revenue
2. Category mix optimization (% revenue by category)
3. Seasonal product trends (monthly sales by category)
4. Vendor consolidation (fewer vendors, better terms)

---

## Key Teaching Opportunities

### Why This Database Is Special for Learning

1. **Multi-store partitioning** — Almost every table includes `store_id` as part of the composite key. Teaches JOIN conditions with compound keys.

2. **Real money columns** — Three separate tax types, multiple payment methods, cost vs price vs retail_price. Students learn real business math.

3. **Denormalized vs normalized** — `invoice_totals` has denormalized payment amounts (ca_amount, cc_amount, etc.) while `cc_trans` has normalized credit card details. Great for discussing database design trade-offs.

4. **253 tables at scale** — Students can explore beyond the core 10 tables. AR accounting, gift registries, bump bars, gas pumps — real enterprise complexity.

5. **Age verification** — `customer.license_num` and `license_expdate` teaches domain-specific business rules (can't sell alcohol to minors).

6. **Delivery apps** — Categories for Postmates, DoorDash, etc. teach modern retail data analysis.

7. **Permission flags** — Employee table has 30+ boolean permission fields. Great for discussing normalization, boolean logic, and access control patterns.
