-- Remove the demo jobs created by prisma/seed.ts (job-1 .. job-6) and two test
-- jobs created while debugging Create Job, together with the seeded demo rows
-- that reference them (foreign keys require those to go first).
--
-- Safety:
--   * Only jobs from the explicit ID list below are considered.
--   * A listed job is skipped entirely if ANY candidate, application,
--     assessment, or interview attached to it is not one of the seeded IDs,
--     so genuine user data is never removed.
--   * Every removed row is copied into the separate "demo_backup" schema first.
--     prisma/restore-demo-data.sql puts them back.

CREATE SCHEMA IF NOT EXISTS demo_backup;

CREATE TEMP TABLE _rm_jobs AS
SELECT j.id FROM jobs j
WHERE j.id IN (
    'job-1', 'job-2', 'job-3', 'job-4', 'job-5', 'job-6',
    'cmv6de6350000ic064y69z313',  -- "Create Job fix test (safe to delete)" (production)
    'cmv6d8pwi0000v68s55h89ak2'   -- local Create Job test
  )
  AND NOT EXISTS (
    SELECT 1 FROM candidates c WHERE c."appliedJobId" = j.id
      AND c.id NOT IN ('cand-1','cand-2','cand-3','cand-4','cand-5','cand-6','cand-7','cand-8','cand-9',
                       'cand-10','cand-11','cand-12','cand-13','cand-14','cand-15','cand-16','cand-17','cand-18'))
  AND NOT EXISTS (
    SELECT 1 FROM applications a WHERE a."jobId" = j.id
      AND a.id NOT IN ('app-1','app-2','app-3','app-4'))
  AND NOT EXISTS (
    SELECT 1 FROM assessments s WHERE s."jobId" = j.id
      AND s.id NOT IN ('assess-1','assess-2','assess-3'))
  AND NOT EXISTS (
    SELECT 1 FROM interviews i WHERE i."jobId" = j.id
      AND i.id NOT IN ('int-1','int-2','int-3','int-4','int-5','int-6','int-7'));

CREATE TEMP TABLE _rm_candidates AS
SELECT id FROM candidates WHERE "appliedJobId" IN (SELECT id FROM _rm_jobs);

CREATE TEMP TABLE _rm_assessments AS
SELECT id FROM assessments WHERE "jobId" IN (SELECT id FROM _rm_jobs);

-- Back up everything that is about to be deleted.
CREATE TABLE demo_backup.jobs AS
  SELECT * FROM jobs WHERE id IN (SELECT id FROM _rm_jobs);
CREATE TABLE demo_backup.candidates AS
  SELECT * FROM candidates WHERE id IN (SELECT id FROM _rm_candidates);
CREATE TABLE demo_backup.applications AS
  SELECT * FROM applications WHERE "jobId" IN (SELECT id FROM _rm_jobs);
CREATE TABLE demo_backup.assessments AS
  SELECT * FROM assessments WHERE id IN (SELECT id FROM _rm_assessments);
CREATE TABLE demo_backup.assessment_results AS
  SELECT * FROM assessment_results
  WHERE "assessmentId" IN (SELECT id FROM _rm_assessments)
     OR "candidateId" IN (SELECT id FROM _rm_candidates);
CREATE TABLE demo_backup.interviews AS
  SELECT * FROM interviews
  WHERE "jobId" IN (SELECT id FROM _rm_jobs)
     OR "candidateId" IN (SELECT id FROM _rm_candidates);

-- Delete children before parents, using exactly the backed-up row sets.
DELETE FROM assessment_results WHERE id IN (SELECT id FROM demo_backup.assessment_results);
DELETE FROM interviews         WHERE id IN (SELECT id FROM demo_backup.interviews);
DELETE FROM assessments        WHERE id IN (SELECT id FROM demo_backup.assessments);
DELETE FROM applications       WHERE id IN (SELECT id FROM demo_backup.applications);
DELETE FROM candidates         WHERE id IN (SELECT id FROM demo_backup.candidates);
DELETE FROM jobs               WHERE id IN (SELECT id FROM demo_backup.jobs);

DROP TABLE _rm_jobs, _rm_candidates, _rm_assessments;
