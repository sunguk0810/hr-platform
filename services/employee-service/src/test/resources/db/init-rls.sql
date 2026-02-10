-- Pre-Flyway initialization script for RLS testing with Testcontainers
-- Creates the hr_core schema required by Flyway migrations.
-- Table creation, indexes, RLS policies, and triggers are handled by Flyway V1.

CREATE SCHEMA IF NOT EXISTS hr_core;
