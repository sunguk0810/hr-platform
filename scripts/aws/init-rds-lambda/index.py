#!/usr/bin/env python3
"""
RDS Database Initialization Lambda
Creates keycloak database and runs all migrations/sample data
"""
import json
import os
import boto3
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def get_secret(secret_name):
    """Get secret from AWS Secrets Manager"""
    client = boto3.client('secretsmanager', region_name='ap-northeast-2')
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response['SecretString'])

def execute_sql(conn, sql, description=""):
    """Execute SQL statement"""
    print(f"Executing: {description}")
    cursor = conn.cursor()
    cursor.execute(sql)
    conn.commit()
    cursor.close()
    print(f"  Done: {description}")

def handler(event, context):
    """Lambda handler"""
    print("Starting RDS initialization...")

    # Get credentials from Secrets Manager
    secret = get_secret('hr-platform/dev/db-credentials')
    db_host = os.environ.get('DB_HOST', 'hr-platform-dev-postgres.ctcisj5baejq.ap-northeast-2.rds.amazonaws.com')
    db_port = int(os.environ.get('DB_PORT', '5432'))
    db_user = secret['username']
    db_password = secret['password']
    db_name = secret['database']

    # Connect to postgres database first (to create keycloak db)
    print(f"Connecting to RDS: {db_host}:{db_port}")
    conn = psycopg2.connect(
        host=db_host,
        port=db_port,
        user=db_user,
        password=db_password,
        database='postgres',
        sslmode='require'
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)

    # Create keycloak database
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'keycloak'")
    if not cursor.fetchone():
        print("Creating keycloak database...")
        cursor.execute("CREATE DATABASE keycloak")
        print("Keycloak database created!")
    else:
        print("Keycloak database already exists")
    cursor.close()
    conn.close()

    # Connect to hr_saas database for schema and data
    conn = psycopg2.connect(
        host=db_host,
        port=db_port,
        user=db_user,
        password=db_password,
        database=db_name,
        sslmode='require'
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)

    # Create schemas
    schemas = [
        'tenant_common', 'hr_core', 'hr_attendance', 'hr_approval',
        'hr_audit', 'hr_notification', 'hr_file', 'hr_recruitment',
        'hr_appointment', 'hr_certificate'
    ]

    for schema in schemas:
        execute_sql(conn, f"CREATE SCHEMA IF NOT EXISTS {schema}", f"Create schema {schema}")
        execute_sql(conn, f"GRANT ALL PRIVILEGES ON SCHEMA {schema} TO {db_user}", f"Grant privileges on {schema}")

    # Create extensions
    execute_sql(conn, 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"', "Create uuid-ossp extension")
    execute_sql(conn, 'CREATE EXTENSION IF NOT EXISTS "pgcrypto"', "Create pgcrypto extension")

    # Create tenant context functions
    execute_sql(conn, """
        CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid UUID)
        RETURNS VOID AS $$
        BEGIN
            PERFORM set_config('app.current_tenant', tenant_uuid::TEXT, false);
        END;
        $$ LANGUAGE plpgsql
    """, "Create set_tenant_context function")

    execute_sql(conn, """
        CREATE OR REPLACE FUNCTION get_current_tenant()
        RETURNS UUID AS $$
        BEGIN
            RETURN current_setting('app.current_tenant', true)::UUID;
        EXCEPTION
            WHEN OTHERS THEN
                RETURN NULL;
        END;
        $$ LANGUAGE plpgsql
    """, "Create get_current_tenant function")

    execute_sql(conn, """
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """, "Create update_updated_at_column trigger function")

    conn.close()

    print("=" * 50)
    print("RDS initialization completed!")
    print("=" * 50)
    print("Created:")
    print("  - keycloak database")
    print(f"  - {len(schemas)} schemas")
    print("  - Extensions: uuid-ossp, pgcrypto")
    print("  - Tenant context functions")
    print("")
    print("Next steps:")
    print("  1. Start ECS services - Flyway will run migrations")
    print("  2. Run sample data script if needed")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'RDS initialization completed',
            'keycloak_db': 'created',
            'schemas': schemas
        })
    }

if __name__ == '__main__':
    # For local testing
    handler({}, None)
