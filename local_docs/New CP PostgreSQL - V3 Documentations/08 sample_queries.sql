-- =============================================================================
-- 3DDX threeddx3 — 41 business questions (and two extras) and how to answer them
--
-- The questions come from three places:
--   * the "frequently asked questions" sheet of the migration workbook
--   * the query_feasibility section of the 2026-07-28 review
--   * the historically slow reports the review listed under performance
-- plus eleven questions that only the v3 structures can answer (cases, iSmile
-- sub-orders, temporary/final restorations, Relu AI plans, the PHI gateway,
-- the audit hash chain, the migration ledger).
--
-- Every query is checked by tools/check_sample_queries.py, which runs EXPLAIN
-- on each one against a fully migrated scratch database. A query that stops
-- parsing after a migration change fails that check, not a reader.
--
-- -----------------------------------------------------------------------------
-- BEFORE YOU RUN ANYTHING: set the tenant
-- -----------------------------------------------------------------------------
-- Run this once per session, then paste any query below as-is:
--
--     SELECT core.fn_set_tenant('3ddx');
--     SELECT * FROM core.v_session_context;   -- confirms what you will see
--
-- Why it matters, precisely. Row-level security in threeddx3 is FAIL-CLOSED:
--
--     USING (tenant_id = core.fn_current_tenant())
--
-- core.fn_current_tenant() is NULL when app.tenant_id is not set, the
-- comparison is then NULL, and the session sees NO rows at all — every count
-- below returns 0 and every list comes back empty, without an error. (v2 had an
-- "OR … IS NULL" branch that made an unset tenant see everything; v3 removed it,
-- review finding F01.) core.fn_set_tenant raises on an unknown slug, so a typo
-- fails loudly. The human read logins (user1_r) have app.tenant_id preset with
-- ALTER ROLE … IN DATABASE threeddx3 SET, so for them it is already done.
--
-- Who can run what:
--   * user1_r (threeddx3_read)     — every query except the PHI identity
--     lookups (Q36) and the audit-schema queries (Q37–Q40). Patient identity is
--     available to this role only as clinical.v_patients_masked
--     (initials + birth year).
--   * app, user2_rw (threeddx3_app_rw) — as read, plus Q36: identity only through
--     clinical.fn_get_patient_identity / fn_list_patient_identities, which
--     require a stated purpose and write audit.phi_access_log for every patient.
--   * aya, kyousry (threeddx3_admin) — everything, including the audit schema.
--     Admin is BYPASSRLS: set the tenant anyway, so the answers match what the
--     application sees.
-- A PostgreSQL superuser bypasses RLS entirely; do not use one for reporting.
--
-- Equivalent forms, if you prefer:
--     SET app.tenant_id = '1';                       -- session
--     SET LOCAL app.tenant_id = '1';                 -- current transaction only
--     PGOPTIONS="-c app.tenant_id=1" psql -d threeddx3
--
-- The queries below do not repeat a tenant filter of their own. That is
-- deliberate: the filter belongs in one place, and duplicating it in 43 queries
-- is how the two drift apart. Queries with a :parameter expect a bind value.
--
-- Eight were impossible or unreliable in the v1 schema: marked [NEW IN V2] with
-- the reason. Eleven more need v3 structures: marked [NEW IN V3].
-- =============================================================================


-- -----------------------------------------------------------------------------
-- CLIENTS AND GROWTH
-- -----------------------------------------------------------------------------

-- Q1. How many users registered last year?
SELECT count(*) AS registered_last_year
FROM crm.contacts
WHERE deleted_at IS NULL
  AND NOT is_testing
  AND registered_at >= date_trunc('year', now()) - INTERVAL '1 year'
  AND registered_at <  date_trunc('year', now());


-- Q2. How many users registered last year and have never created an order?
--     The review asked for this one explicitly.
SELECT count(*) AS registered_but_never_ordered
FROM crm.contacts c
WHERE c.deleted_at IS NULL
  AND NOT c.is_testing
  AND c.registered_at >= date_trunc('year', now()) - INTERVAL '1 year'
  AND c.registered_at <  date_trunc('year', now())
  AND c.first_order_at IS NULL;
-- crm.contacts.first_order_at is maintained by trigger, so this is an index
-- scan rather than a NOT EXISTS against 600k orders.


-- Q3. How many new users registered this year and HAVE created orders,
--     and what did they spend?
SELECT count(*)                     AS activated_clients,
       sum(a.order_count)           AS orders_placed,
       sum(a.lifetime_value)        AS lifetime_value
FROM reporting.v_client_activity a
WHERE a.registered_at >= date_trunc('year', now())
  AND a.order_count > 0;


-- Q4. How many inactive clients — no order in the last 12 months?
SELECT count(*) FILTER (WHERE never_ordered)          AS never_ordered,
       count(*) FILTER (WHERE dormant)                AS dormant_over_12m,
       count(*)                                       AS total_inactive
FROM reporting.v_client_activity
WHERE never_ordered OR dormant;


-- Q5. Which clients have surgical-guide orders, and how many?
SELECT c.display_name                AS client,
       c.contact_type,
       rep.display_name              AS sales_rep,
       count(DISTINCT oi.order_id)   AS sg_orders,
       sum(oi.line_total)            AS sg_value,
       max(oi.created_at)            AS most_recent
FROM orders.order_items oi
JOIN catalog.sellable_items si ON si.id = oi.sellable_item_id
JOIN catalog.categories    cat ON cat.id = si.category_id
JOIN orders.orders           o ON o.id = oi.order_id
JOIN crm.contacts            c ON c.id = o.contact_id
LEFT JOIN iam.users        rep ON rep.id = c.sales_rep_user_id
WHERE cat.code = 'surgical_guide'
  AND oi.deleted_at IS NULL
  AND o.deleted_at IS NULL
GROUP BY c.display_name, c.contact_type, rep.display_name
ORDER BY sg_orders DESC;


-- Q6. [NEW IN V2] Which scanning centre submitted the most cases, and for
--     which doctors?
--     Impossible in v1: an order had no link to the scanning centre. Review #7.
SELECT sc.display_name          AS scan_center,
       count(*)                 AS cases_submitted,
       count(DISTINCT o.contact_id) AS distinct_doctors,
       sum(o.total_amount)      AS value
FROM orders.orders o
JOIN crm.contacts sc ON sc.id = o.scan_center_contact_id
WHERE o.deleted_at IS NULL
  AND o.created_at >= now() - INTERVAL '12 months'
GROUP BY sc.display_name
ORDER BY cases_submitted DESC
LIMIT 25;


-- Q7. [NEW IN V2] How is each sales representative performing?
--     Impossible in v1: there was no client-to-rep relationship. Review #9.
SELECT rep.display_name                          AS sales_rep,
       count(DISTINCT c.id)                      AS clients,
       count(DISTINCT c.id) FILTER (WHERE c.last_order_at >= now() - INTERVAL '90 days')
                                                 AS active_clients,
       count(o.id)                               AS orders_12m,
       coalesce(sum(o.total_amount), 0)          AS value_12m
FROM crm.contacts c
JOIN iam.users rep ON rep.id = c.sales_rep_user_id
LEFT JOIN orders.orders o
       ON o.contact_id = c.id
      AND o.deleted_at IS NULL
      AND o.created_at >= now() - INTERVAL '12 months'
WHERE c.deleted_at IS NULL AND NOT c.is_testing
GROUP BY rep.display_name
ORDER BY value_12m DESC;


-- -----------------------------------------------------------------------------
-- ORDERS AND REVENUE
-- -----------------------------------------------------------------------------

-- Q8. What were the total charges yesterday?
SELECT ch.currency_code,
       ch.charge_kind,
       count(*)         AS charge_count,
       sum(ch.amount)   AS total
FROM billing.charges ch
WHERE ch.charged_on = CURRENT_DATE - 1
GROUP BY ROLLUP (ch.currency_code, ch.charge_kind)
ORDER BY ch.currency_code NULLS LAST, ch.charge_kind NULLS LAST;


-- Q9. How many orders of each kind were created last month, and what did
--     they cost?
SELECT cat.name                          AS category,
       si.item_kind,
       count(DISTINCT o.id)              AS orders,
       count(oi.id)                      AS items,
       oi.currency_code,
       sum(oi.line_total)                AS total_value,
       round(avg(oi.line_total), 2)      AS average_item_value
FROM orders.orders o
JOIN orders.order_items oi     ON oi.order_id = o.id AND oi.deleted_at IS NULL
JOIN catalog.sellable_items si ON si.id = oi.sellable_item_id
LEFT JOIN catalog.categories cat ON cat.id = si.category_id
WHERE o.deleted_at IS NULL
  AND NOT o.is_testing
  AND o.created_at >= date_trunc('month', now()) - INTERVAL '1 month'
  AND o.created_at <  date_trunc('month', now())
GROUP BY cat.name, si.item_kind, oi.currency_code
ORDER BY total_value DESC;


-- Q10. Monthly revenue trend for the last two years, by category.
--      Reads reporting.v_monthly_volume, the tenant-filtered window on the
--      materialized view mv_monthly_volume, so it is instant regardless of
--      order volume. The materialized view itself is never granted: it cannot
--      carry row-level security.
SELECT month, category_code, item_kind,
       order_count, item_count, redo_count, total_value, active_clients
FROM reporting.v_monthly_volume
WHERE month >= date_trunc('month', now()) - INTERVAL '24 months'
ORDER BY month DESC, total_value DESC;


-- Q11. Which orders are billable but still not invoiced?
--      The "not charged" report, which the requirements backlog revisits often.
SELECT o.order_number,
       c.display_name          AS client,
       si.name                 AS service,
       oi.line_total,
       oi.currency_code,
       oi.completed_at,
       now() - oi.completed_at AS age
FROM orders.order_items oi
JOIN orders.orders           o ON o.id = oi.order_id
JOIN crm.contacts            c ON c.id = o.contact_id
JOIN catalog.sellable_items si ON si.id = oi.sellable_item_id
WHERE oi.is_billable
  AND NOT oi.is_invoiced
  AND oi.deleted_at IS NULL
  AND oi.completed_at IS NOT NULL
ORDER BY oi.completed_at;


-- Q12. Top 25 clients by revenue over the last 12 months.
SELECT display_name AS client, contact_type, sales_rep_name,
       country_name, orders_last_12m, value_last_12m
FROM reporting.v_client_activity
WHERE orders_last_12m > 0
ORDER BY value_last_12m DESC
LIMIT 25;


-- -----------------------------------------------------------------------------
-- PRODUCTION PIPELINE
-- -----------------------------------------------------------------------------

-- Q13. How many restorations are in design, and how many in production?
SELECT oi.status, count(*) AS items, count(*) FILTER (WHERE oi.due_at < now()) AS overdue
FROM orders.order_items oi
JOIN catalog.sellable_items si ON si.id = oi.sellable_item_id
JOIN catalog.categories    cat ON cat.id = si.category_id
WHERE cat.code = 'restoration'
  AND oi.deleted_at IS NULL
  AND oi.status IN ('in_design', 'in_production')
GROUP BY oi.status;


-- Q14. How many surgical guides are in design, and how many in production?
SELECT oi.status, count(*) AS items, count(*) FILTER (WHERE oi.due_at < now()) AS overdue
FROM orders.order_items oi
JOIN catalog.sellable_items si ON si.id = oi.sellable_item_id
JOIN catalog.categories    cat ON cat.id = si.category_id
WHERE cat.code = 'surgical_guide'
  AND oi.deleted_at IS NULL
  AND oi.status IN ('in_design', 'in_production')
GROUP BY oi.status;


-- Q15. How many treatment plans are in planning, and how many consultations
--      are in progress?
SELECT oi.status,
       count(*)                                        AS items,
       round(avg(EXTRACT(EPOCH FROM (now() - oi.created_at)) / 86400), 1) AS avg_age_days
FROM orders.order_items oi
JOIN catalog.sellable_items si ON si.id = oi.sellable_item_id
JOIN catalog.categories    cat ON cat.id = si.category_id
WHERE cat.code = 'treatment_plan'
  AND oi.deleted_at IS NULL
  AND oi.status IN ('in_design', 'in_review', 'awaiting_approval', 'pending_information')
GROUP BY oi.status
ORDER BY items DESC;


-- Q16. The whole production pipeline on one screen — the daily dashboard.
SELECT category_name, item_kind, item_status, item_count, overdue_count, avg_age_days
FROM reporting.v_production_pipeline
ORDER BY item_count DESC;


-- Q17. [NEW IN V2] How long does each production stage actually take?
--      Impossible in v1: there was no workflow engine, and legacy computed
--      durations by subtracting varchar timestamps at query time.
SELECT ws_from.name                                  AS from_state,
       ws_to.name                                    AS to_state,
       count(*)                                      AS transitions,
       round(avg(h.duration_seconds) / 3600.0, 1)    AS avg_hours,
       round((percentile_cont(0.5) WITHIN GROUP (ORDER BY h.duration_seconds) / 3600.0)::numeric, 1)
                                                     AS median_hours,
       round((percentile_cont(0.95) WITHIN GROUP (ORDER BY h.duration_seconds) / 3600.0)::numeric, 1)
                                                     AS p95_hours
FROM workflow.workflow_history h
LEFT JOIN workflow.workflow_states ws_from ON ws_from.id = h.from_state_id
JOIN      workflow.workflow_states ws_to   ON ws_to.id   = h.to_state_id
WHERE h.occurred_at >= now() - INTERVAL '90 days'
  AND h.duration_seconds IS NOT NULL
GROUP BY ws_from.name, ws_to.name
HAVING count(*) > 10
ORDER BY avg_hours DESC;


-- Q18. Designer throughput last month.
SELECT u.display_name              AS designer,
       count(*)                    AS items_completed,
       count(*) FILTER (WHERE oi.is_redo) AS redos,
       round(100.0 * count(*) FILTER (WHERE oi.is_redo) / count(*), 1) AS redo_percent,
       sum(pj.design_minutes)      AS design_minutes
FROM orders.order_items oi
JOIN iam.users u ON u.id = oi.designer_user_id
LEFT JOIN production.production_jobs pj ON pj.order_item_id = oi.id
WHERE oi.completed_at >= date_trunc('month', now()) - INTERVAL '1 month'
  AND oi.completed_at <  date_trunc('month', now())
GROUP BY u.display_name
ORDER BY items_completed DESC;


-- -----------------------------------------------------------------------------
-- VOUCHERS
-- -----------------------------------------------------------------------------

-- Q19. How many vouchers did we sell last month, and for how much?
SELECT vt.name                AS voucher_type,
       count(*)               AS vouchers_issued,
       v.currency_code,
       sum(v.issued_credit)   AS credit_issued,
       sum(v.issued_cases)    AS cases_issued
FROM vouchers.vouchers v
JOIN vouchers.voucher_types vt ON vt.id = v.voucher_type_id
WHERE v.issued_on >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
  AND v.issued_on <  date_trunc('month', CURRENT_DATE)
GROUP BY vt.name, v.currency_code
ORDER BY credit_issued DESC;


-- Q20. How many vouchers expire by September 2026, and what credit is left
--      on them? The workbook asks this one verbatim.
SELECT vt.name              AS voucher_type,
       count(*)             AS vouchers_expiring,
       v.currency_code,
       sum(v.remaining_credit)                       AS credit_at_risk,
       sum(v.issued_cases - v.consumed_cases - v.expired_cases) AS cases_at_risk,
       min(v.expires_on)    AS earliest,
       max(v.expires_on)    AS latest
FROM vouchers.vouchers v
JOIN vouchers.voucher_types vt ON vt.id = v.voucher_type_id
WHERE v.status IN ('active', 'in_use')
  AND v.expires_on IS NOT NULL
  AND v.expires_on <= DATE '2026-09-30'
GROUP BY vt.name, v.currency_code
ORDER BY credit_at_risk DESC;


-- Q21. How many GFMR vouchers have been sold, and what is their position?
SELECT count(*)                           AS gfmr_vouchers,
       count(*) FILTER (WHERE status = 'exhausted') AS fully_used,
       count(*) FILTER (WHERE expiry_bucket = 'expired')       AS expired,
       count(*) FILTER (WHERE expiry_bucket = 'expiring_soon') AS expiring_within_90_days,
       sum(issued_credit)                 AS issued,
       sum(consumed_credit)               AS consumed,
       sum(remaining_credit)              AS remaining,
       sum(expired_credit)                AS lapsed
FROM reporting.v_voucher_balances
WHERE voucher_type_code = 'gfmr';


-- Q22. Track voucher consumption: every movement on one voucher.
--      [NEW IN V2] v1 had no ledger, so a balance could not be explained.
SELECT t.sequence_no,
       t.effective_at,
       t.scope,
       t.txn_kind,
       t.credit_delta,
       t.balance_after,
       o.order_number,
       si.name           AS service,
       u.display_name    AS actor,
       t.reason,
       t.reconstruction_method
FROM vouchers.voucher_transactions t
JOIN vouchers.vouchers v          ON v.id = t.voucher_id
LEFT JOIN orders.orders o         ON o.id = t.order_id
LEFT JOIN catalog.sellable_items si ON si.id = t.sellable_item_id
LEFT JOIN iam.users u             ON u.id = t.actor_user_id
WHERE v.voucher_code = :voucher_code
ORDER BY t.effective_at, t.sequence_no;


-- Q23. Do the voucher balances agree with the ledger? Run this after any
--      voucher incident. vouchers.fn_apply_transaction is the only writer of
--      balances, so this should always return no rows.
SELECT v.voucher_code,
       v.remaining_credit                        AS balance_says,
       coalesce(sum(t.credit_delta), 0)          AS ledger_says,
       v.remaining_credit - coalesce(sum(t.credit_delta), 0) AS discrepancy
FROM vouchers.vouchers v
LEFT JOIN vouchers.voucher_transactions t ON t.voucher_id = v.id
GROUP BY v.id, v.voucher_code, v.remaining_credit
HAVING v.remaining_credit <> coalesce(sum(t.credit_delta), 0)
ORDER BY abs(v.remaining_credit - coalesce(sum(t.credit_delta), 0)) DESC;


-- -----------------------------------------------------------------------------
-- SHIPPING AND ARCHIVE
-- -----------------------------------------------------------------------------

-- Q24. How many restorations shipped last month, temporary and final?
SELECT count(DISTINCT s.id)     AS shipments,
       count(si_item.id)        AS restoration_items,
       count(si_item.id) FILTER (WHERE oi.restoration_stage = 'temporary') AS temporary,
       count(si_item.id) FILTER (WHERE oi.restoration_stage = 'final')     AS final,
       count(DISTINCT s.contact_id) AS clients
FROM shipping.shipments s
JOIN shipping.shipment_items si_item ON si_item.shipment_id = s.id
JOIN orders.order_items oi           ON oi.id = si_item.order_item_id
JOIN catalog.sellable_items sell     ON sell.id = oi.sellable_item_id
JOIN catalog.categories cat          ON cat.id = sell.category_id
WHERE cat.code = 'restoration'
  AND s.direction = 'outbound'
  AND s.shipped_at >= date_trunc('month', now()) - INTERVAL '1 month'
  AND s.shipped_at <  date_trunc('month', now());


-- Q25. Shipment history for one order, with tracking events.
SELECT s.tracking_number,
       co.name              AS courier,
       s.status,
       s.shipped_at,
       s.delivered_at,
       e.occurred_at        AS event_at,
       e.description        AS event,
       e.location
FROM shipping.shipments s
LEFT JOIN shipping.couriers co       ON co.id = s.courier_id
LEFT JOIN shipping.tracking_events e ON e.shipment_id = s.id
JOIN orders.orders o                 ON o.id = s.order_id
WHERE o.order_number = :order_number
ORDER BY s.shipped_at, e.occurred_at;


-- Q26. [NEW IN V2] What is in the archive right now, and what is still
--      waiting for a mold report?
--      Impossible in v1: PackageContent had no target table at all. Blocker #1.
SELECT it.name                                          AS item_type,
       count(*)                                         AS items,
       count(*) FILTER (WHERE pi.is_used)               AS used,
       count(*) FILTER (WHERE pi.mold_report_status = 'pending') AS mold_report_pending,
       count(DISTINCT p.id)                             AS packages,
       count(DISTINCT p.order_id)                       AS orders
FROM archive.package_items pi
JOIN archive.packages   p ON p.id = pi.package_id
JOIN archive.item_types it ON it.id = pi.item_type_id
WHERE p.status IN ('received', 'stored')
GROUP BY it.name
ORDER BY items DESC;


-- Q27. [NEW IN V2] Which loaner kits are out, and which are overdue back?
--      Impossible in v1: there was no inventory domain. Blocker #2.
SELECT i.name              AS kit_type,
       su.serial_number,
       c.display_name      AS with_client,
       o.order_number,
       r.status,
       r.shipped_at,
       r.due_back_on,
       CURRENT_DATE - r.due_back_on AS days_overdue
FROM inventory.rentals r
JOIN inventory.serialised_units su ON su.id = r.serialised_unit_id
JOIN inventory.items i             ON i.id = su.item_id
LEFT JOIN crm.contacts c           ON c.id = r.contact_id
LEFT JOIN orders.orders o          ON o.id = r.order_id
WHERE r.status IN ('shipped', 'with_customer', 'returning')
ORDER BY r.due_back_on NULLS LAST;


-- -----------------------------------------------------------------------------
-- CLINICAL, QUALITY AND OPERATIONS
-- -----------------------------------------------------------------------------

-- Q28. [NEW IN V2] Which teeth are involved most often, and in what way?
--      Impossible in v1: TeethMissed and TeethExtract were dropped, and the
--      remaining site data was a comma-separated text column. Review #1.
SELECT ts.site_type,
       ts.tooth_number,
       count(*) AS occurrences
FROM clinical.tooth_sites ts
JOIN clinical.tooth_charts tc ON tc.id = ts.tooth_chart_id
JOIN orders.orders          o ON o.id = tc.order_id
WHERE o.created_at >= now() - INTERVAL '12 months'
GROUP BY ts.site_type, ts.tooth_number
ORDER BY ts.site_type, occurrences DESC;

--      ...and the same data as a per-case summary:
SELECT o.order_number,
       c.display_name AS client,
       count(*) FILTER (WHERE ts.site_type = 'missing')    AS missing_teeth,
       count(*) FILTER (WHERE ts.site_type = 'extraction') AS extractions,
       count(*) FILTER (WHERE ts.site_type = 'to_be_extracted') AS to_be_extracted,
       count(*) FILTER (WHERE ts.site_type = 'implant')    AS implants,
       count(*) FILTER (WHERE ts.site_type = 'crown')      AS crowns
FROM orders.orders o
JOIN crm.contacts  c ON c.id = o.contact_id
JOIN clinical.tooth_charts tc ON tc.order_id = o.id
JOIN clinical.tooth_sites  ts ON ts.tooth_chart_id = tc.id
WHERE o.created_at >= now() - INTERVAL '30 days'
GROUP BY o.order_number, c.display_name
ORDER BY implants DESC
LIMIT 50;


-- Q29. [NEW IN V2] What is the QC pass rate, and which checks fail most?
--      Impossible in v1: QC had a single stub table. Migrated legacy records
--      are in state 'migrated'; current records are versioned, so only the
--      live version of each inspection is counted.
SELECT ft.name                                      AS qc_form,
       count(DISTINCT i.id)                         AS inspections,
       count(DISTINCT i.id) FILTER (WHERE i.outcome = 'passed') AS passed,
       round(100.0 * count(DISTINCT i.id) FILTER (WHERE i.outcome = 'passed')
             / nullif(count(DISTINCT i.id), 0), 1)  AS pass_rate_percent,
       count(*) FILTER (WHERE r.passed IS FALSE)    AS failed_checks,
       count(*) FILTER (WHERE r.passed IS FALSE AND fi.is_critical) AS failed_critical
FROM quality.inspections i
JOIN quality.form_templates ft   ON ft.id = i.template_id
LEFT JOIN quality.inspection_results r ON r.inspection_id = i.id
LEFT JOIN quality.form_items fi  ON fi.id = r.form_item_id
WHERE i.inspected_at >= now() - INTERVAL '90 days'
  AND i.superseded_at IS NULL
GROUP BY ft.name
ORDER BY inspections DESC;


-- Q30. Every order and its current production status — the master operational
--      view the review asked for first.
SELECT order_number,
       client_name,
       scan_center_name,
       patient_code,                -- pseudonymous; identity only via Q36
       category_name,
       item_name,
       order_status,
       item_status,
       priority,
       designer_name,
       currency_code,
       line_total,
       order_created_at,
       sent_to_production_at,
       item_completed_at
FROM reporting.v_order_items
WHERE order_status NOT IN ('completed', 'cancelled')
ORDER BY order_created_at DESC
LIMIT 500;


-- -----------------------------------------------------------------------------
-- CASES, ISMILE, RESTORATIONS AND AI PLANS
-- -----------------------------------------------------------------------------

-- Q31. [NEW IN V3] Which cases hold more than one order, and how were they
--      paired? A case sits above its orders (Q3); split-arch orders share one.
SELECT cs.case_code,
       cs.pairing_method,
       cs.pairing_confidence,
       c.display_name                AS client,
       count(o.id)                   AS orders,
       string_agg(o.order_number::text, ', ' ORDER BY o.created_at) AS order_numbers,
       sum(o.total_amount)           AS case_value
FROM orders.cases cs
JOIN orders.orders o ON o.case_id = cs.id AND o.deleted_at IS NULL
JOIN crm.contacts  c ON c.id = cs.contact_id
GROUP BY cs.id, cs.case_code, cs.pairing_method, cs.pairing_confidence, c.display_name
HAVING count(o.id) > 1
ORDER BY orders DESC, cs.case_code
LIMIT 100;


-- Q32. [NEW IN V3] Which split-arch pairings are waiting for a human decision?
--      The ETL proposes candidates; nobody is merged into one case until a
--      reviewer accepts them (U8).
SELECT p.id                     AS candidate_id,
       oa.order_number          AS order_a,
       ob.order_number          AS order_b,
       c.display_name           AS client,
       p.score,
       p.evidence,
       p.created_at
FROM orders.case_pairing_candidates p
JOIN orders.orders oa ON oa.id = p.order_a_id
JOIN orders.orders ob ON ob.id = p.order_b_id
JOIN crm.contacts  c  ON c.id = oa.contact_id
WHERE p.decision = 'pending'
ORDER BY p.score DESC, p.created_at
LIMIT 200;


-- Q33. [NEW IN V3] iSmile treatments and their sub-orders (aligner stages and
--      refinements), one row per treatment.
--      Impossible in v2: IsmileOrder was retired and sub-orders had no parent.
SELECT o.order_number,
       c.display_name                                                AS client,
       parent.status                                                 AS treatment_status,
       count(child.id) FILTER (WHERE child.item_role = 'ismile_suborder') AS suborders,
       count(child.id) FILTER (WHERE child.item_role = 'refinement')      AS refinements,
       sum(child.line_total)                                         AS children_value,
       max(child.completed_at)                                       AS last_child_completed
FROM orders.order_items parent
JOIN orders.orders      o     ON o.id = parent.order_id
JOIN crm.contacts       c     ON c.id = o.contact_id
LEFT JOIN orders.order_items child
       ON child.parent_item_id = parent.id AND child.deleted_at IS NULL
JOIN catalog.sellable_items si ON si.id = parent.sellable_item_id
JOIN catalog.categories    cat ON cat.id = si.category_id
WHERE cat.code = 'ismile'
  AND parent.parent_item_id IS NULL
  AND parent.deleted_at IS NULL
GROUP BY o.order_number, c.display_name, parent.id, parent.status
ORDER BY o.order_number DESC
LIMIT 200;


-- Q34. [NEW IN V3] Temporary versus final restorations: how many orders get a
--      temporary first, and how long until the final ships?
--      Impossible in v2: final restorations (legacy finalRestorationID) were
--      not loaded, and service lines were joined to the wrong orders.
SELECT date_trunc('month', o.created_at)                        AS month,
       count(DISTINCT o.id) FILTER (WHERE tmp.id IS NOT NULL)   AS orders_with_temporary,
       count(DISTINCT o.id) FILTER (WHERE fin.id IS NOT NULL)   AS orders_with_final,
       count(DISTINCT o.id) FILTER (WHERE tmp.id IS NOT NULL AND fin.id IS NOT NULL)
                                                                AS both,
       round(avg(EXTRACT(EPOCH FROM (fin.completed_at - tmp.completed_at)) / 86400)
             FILTER (WHERE tmp.completed_at IS NOT NULL AND fin.completed_at IS NOT NULL), 1)
                                                                AS avg_days_temp_to_final
FROM orders.orders o
LEFT JOIN orders.order_items tmp
       ON tmp.order_id = o.id AND tmp.restoration_stage = 'temporary' AND tmp.deleted_at IS NULL
LEFT JOIN orders.order_items fin
       ON fin.order_id = o.id AND fin.restoration_stage = 'final' AND fin.deleted_at IS NULL
WHERE o.deleted_at IS NULL
  AND o.created_at >= date_trunc('month', now()) - INTERVAL '12 months'
  AND (tmp.id IS NOT NULL OR fin.id IS NOT NULL)
GROUP BY 1
ORDER BY 1 DESC;


-- Q35. [NEW IN V3] Relu AI treatment planning: how many plans are eligible,
--      how many went to AI, and how many fell back to manual planning?
SELECT ap.planning_mode,
       ap.ai_status,
       ap.ai_decision,
       count(*)                                           AS plans,
       count(*) FILTER (WHERE ap.is_ai_eligible)          AS eligible,
       round(avg(EXTRACT(EPOCH FROM (ap.ai_ready_at - ap.ai_queued_at)) / 3600)
             FILTER (WHERE ap.ai_ready_at IS NOT NULL), 1) AS avg_hours_queue_to_ready
FROM orders.order_item_ai_plans ap
JOIN orders.order_items oi ON oi.id = ap.order_item_id AND oi.deleted_at IS NULL
GROUP BY ap.planning_mode, ap.ai_status, ap.ai_decision
ORDER BY plans DESC;


-- -----------------------------------------------------------------------------
-- PATIENT IDENTITY, AUDIT AND MIGRATION EVIDENCE
-- -----------------------------------------------------------------------------

-- Q36. [NEW IN V3] Who is the patient on this order? Identity (name, date of
--      birth, sex) lives in clinical.patient_identities, which no application
--      or read role can SELECT. The app_rw role reads it through the logged
--      gateway, stating why; every patient returned writes one
--      audit.phi_access_log row. Read-only users get the masked view instead.
SELECT o.order_number, pi.full_name, pi.date_of_birth, pi.sex, pi.dob_status
FROM orders.orders o
CROSS JOIN LATERAL clinical.fn_get_patient_identity(o.patient_id, 'case_review') pi
WHERE o.order_number = :order_number;

--      ...for a list screen, one call for up to 500 patients:
SELECT pi.patient_id, pi.full_name, pi.date_of_birth
FROM clinical.fn_list_patient_identities(
       ARRAY(SELECT o.patient_id FROM orders.orders o
             WHERE o.patient_id IS NOT NULL
             ORDER BY o.created_at DESC LIMIT 50),
       'worklist_display') pi;

--      ...and the masked form every read role may use (initials + birth year):
SELECT o.order_number, m.patient_code, m.initials, m.birth_year, m.sex
FROM orders.orders o
JOIN clinical.v_patients_masked m ON m.patient_id = o.patient_id
WHERE o.created_at >= now() - INTERVAL '7 days'
ORDER BY o.created_at DESC;


-- Q37. [NEW IN V3] Who read patient identities in the last 30 days, and why?
--      The HIPAA access report. Admin only (the audit schema is not granted to
--      app or read roles).
SELECT u.display_name                AS actor,
       l.db_role,
       l.purpose,
       l.function_name,
       count(*)                      AS identities_read,
       count(DISTINCT l.patient_id)  AS distinct_patients,
       min(l.occurred_at)            AS first_read,
       max(l.occurred_at)            AS last_read
FROM audit.phi_access_log l
LEFT JOIN iam.users u ON u.id = l.actor_user_id
WHERE l.occurred_at >= now() - INTERVAL '30 days'
GROUP BY u.display_name, l.db_role, l.purpose, l.function_name
ORDER BY identities_read DESC;


-- Q38. [NEW IN V3] Is the audit trail intact? Recomputes the sha256 hash chain
--      over audit.audit_log; first_broken_seq NULL = no row was altered,
--      removed or inserted out of band. Admin only; the full chain is long, so
--      pass a range for a spot check.
SELECT rows_checked, first_broken_seq, expected_hash, stored_hash
FROM audit.fn_verify_chain(1, NULL);

--      ...and what changed on one order recently (old/new values are stored
--      with PHI columns already redacted):
SELECT a.occurred_at, a.action, a.table_name, a.changed_columns,
       u.display_name AS actor, a.db_role
FROM audit.audit_log a
LEFT JOIN iam.users u ON u.id = a.actor_user_id
WHERE a.schema_name = 'orders'
  AND a.table_name IN ('orders', 'order_items')
  AND a.occurred_at >= now() - INTERVAL '30 days'
ORDER BY a.chain_seq DESC
LIMIT 100;


-- Q39. [NEW IN V3] Did the migration account for every legacy row? The
--      reconciliation rule is source = migrated + excluded, with zero
--      unexplained rows, for the authoritative run.
SELECT r.legacy_table,
       r.target_table,
       r.source_count,
       r.migrated_count,
       r.excluded_count,
       r.unexplained_count,
       r.status
FROM audit.reconciliation_results r
JOIN audit.migration_runs mr ON mr.run_id = r.run_id
WHERE mr.is_authoritative
ORDER BY (r.status = 'pass'), r.unexplained_count DESC, r.legacy_table;


-- Q40. [NEW IN V3] Why was a legacy row not migrated? The exclusion ledger,
--      by table and reason (parent deleted, retired table, security policy …).
SELECT e.legacy_table,
       e.reason_code,
       e.approval_reference,
       count(*)          AS rows_excluded
FROM audit.migration_exclusions e
JOIN audit.migration_runs mr ON mr.run_id = e.run_id
WHERE mr.is_authoritative
GROUP BY e.legacy_table, e.reason_code, e.approval_reference
ORDER BY rows_excluded DESC;


-- Q41. [NEW IN V3] Voucher movements by ledger stream. The main OrderVoucher
--      ledger, the Engel programme and per-service vouchers are separate
--      streams; the main stream was rebuilt by porting voucher_fill.php (Q19).
SELECT t.scope,
       t.txn_kind,
       t.reconstruction_method,
       t.currency_code,
       count(*)              AS movements,
       sum(t.credit_delta)   AS credit_delta,
       sum(t.case_delta)     AS case_delta
FROM vouchers.voucher_transactions t
GROUP BY t.scope, t.txn_kind, t.reconstruction_method, t.currency_code
ORDER BY t.scope, movements DESC;


-- =============================================================================
-- Two extras that fell out of the review's performance section
-- =============================================================================

-- E1. Task SLA: which teams are behind?
SELECT t_team.name             AS team,
       tt.name                 AS task_type,
       count(*)                AS open_tasks,
       count(*) FILTER (WHERE tk.due_at < now()) AS overdue,
       round(avg(EXTRACT(EPOCH FROM (now() - tk.created_at)) / 86400), 1) AS avg_age_days
FROM workflow.tasks tk
JOIN workflow.task_assignments ta ON ta.task_id = tk.id AND ta.is_active
LEFT JOIN iam.teams      t_team ON t_team.id = ta.team_id
LEFT JOIN workflow.task_types tt ON tt.id = tk.task_type_id
WHERE tk.state IN ('open', 'in_progress', 'blocked')
GROUP BY t_team.name, tt.name
ORDER BY overdue DESC, open_tasks DESC;


-- E2. Email deliverability by template last week.
SELECT et.name                   AS template,
       count(*)                  AS sent,
       count(*) FILTER (WHERE el.status = 'failed')  AS failed,
       count(*) FILTER (WHERE el.status = 'bounced') AS bounced,
       round(100.0 * count(*) FILTER (WHERE el.status IN ('failed','bounced'))
             / nullif(count(*), 0), 2) AS failure_percent
FROM comms.email_logs el
LEFT JOIN comms.email_templates et ON et.id = el.template_id
WHERE el.sent_at >= now() - INTERVAL '7 days'
GROUP BY et.name
ORDER BY sent DESC;
