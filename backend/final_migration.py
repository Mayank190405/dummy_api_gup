from sqlalchemy import text
import sys
import os

# Ensure backend can be imported
sys.path.append(os.getcwd())

from backend.database import engine
from backend.models.database_models import Invoice

def finish_migration():
    print("--- Final Migration Attempt ---")
    with engine.connect() as conn:
        # 1. Cleanup everything first
        conn.execute(text("DROP TABLE IF EXISTS invoice_default CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS invoice_old CASCADE;"))
        
        # 2. Rename current invoice to old if it exists and is NOT partitioned
        res = conn.execute(text("SELECT relkind FROM pg_class WHERE relname = 'invoice';")).fetchone()
        if res and res[0] != 'p':
            print("Renaming regular table 'invoice' to 'invoice_old'...")
            conn.execute(text("ALTER TABLE invoice RENAME TO invoice_old;"))
        elif res and res[0] == 'p':
            print("Table 'invoice' is already partitioned. No rename needed.")
            return

        # 3. Create the new partitioned table (start transaction for the actual creation and data move)
        with conn.begin():
            try:
                print("Creating partitioned 'invoice' table...")
                Invoice.__table__.create(conn)
                
                print("Creating default partition...")
                conn.execute(text("CREATE TABLE invoice_default PARTITION OF invoice DEFAULT;"))
                
                print("Migrating data...")
                conn.execute(text("""
                    INSERT INTO invoice (id, company_id, invoice_number, buyer_gstin, date, total_taxable, total_tax, grand_total, status, delay_days, created_at)
                    SELECT id, company_id, invoice_number, buyer_gstin, date, total_taxable, total_tax, grand_total, status, delay_days, created_at
                    FROM invoice_old;
                """))
                
                old_count = conn.execute(text("SELECT count(*) FROM invoice_old;")).fetchone()[0]
                new_count = conn.execute(text("SELECT count(*) FROM invoice;")).fetchone()[0]
                print(f"Counts: Old={old_count}, New={new_count}")
                
                if old_count == new_count:
                    print("Migration successful!")
                else:
                    raise Exception("Count mismatch!")
            except Exception as e:
                print(f"Error: {e}")
                raise

        # 4. Final cleanup
        print("Cleaning up 'invoice_old'...")
        conn.execute(text("DROP TABLE IF EXISTS invoice_old CASCADE;"))
        print("Done!")

if __name__ == "__main__":
    finish_migration()
