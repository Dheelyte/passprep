-- Default (placeholder) plan prices so a fresh production database can take payments.
-- Existing rows are left alone; change prices in the database, not here.
INSERT INTO "plan_prices" ("code", "name", "amount_kobo", "period_days") VALUES
  ('MONTHLY',   'Monthly',          150000, 30),
  ('TERMLY',    'Per term',         400000, 120),
  ('YEARLY',    'Yearly',          1000000, 365),
  ('EXAM_PASS', 'Exam season pass', 300000, 90)
ON CONFLICT ("code") DO NOTHING;
