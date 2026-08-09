-- Pin each run to the definition revision that created it so later
-- registrations for the same key cannot change mid-flight payload builders.
ALTER TABLE "workflow_run" ADD COLUMN "definitionVersion" INTEGER NOT NULL DEFAULT 1;
