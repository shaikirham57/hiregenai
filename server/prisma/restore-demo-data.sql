-- Restores the rows removed by migration 20261013090000_remove_demo_jobs from
-- the "demo_backup" schema. Parents are inserted before children, and rows that
-- already exist are skipped. Run with:
--   npx prisma db execute --schema prisma/schema.prisma --file prisma/restore-demo-data.sql
BEGIN;
INSERT INTO jobs               SELECT * FROM demo_backup.jobs               ON CONFLICT (id) DO NOTHING;
INSERT INTO candidates         SELECT * FROM demo_backup.candidates         ON CONFLICT (id) DO NOTHING;
INSERT INTO applications       SELECT * FROM demo_backup.applications       ON CONFLICT (id) DO NOTHING;
INSERT INTO assessments        SELECT * FROM demo_backup.assessments        ON CONFLICT (id) DO NOTHING;
INSERT INTO assessment_results SELECT * FROM demo_backup.assessment_results ON CONFLICT (id) DO NOTHING;
INSERT INTO interviews         SELECT * FROM demo_backup.interviews         ON CONFLICT (id) DO NOTHING;
COMMIT;
