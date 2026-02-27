from sqlalchemy import text
import sys
import os

# Ensure backend can be imported
sys.path.append(os.getcwd())

from backend.database import engine

def diagnose():
    print("--- Detailed DB Diagnosis ---")
    with engine.connect() as conn:
        # Check tables
        print("\nTables found:")
        res = conn.execute(text("SELECT relname, relkind FROM pg_class WHERE relname LIKE 'invoice%';"))
        for r in res:
            print(f"- {r[0]} (kind: {r[1]})")
            
        # Check foreign keys pointing to invoice
        print("\nForeign keys pointing TO 'invoice':")
        res = conn.execute(text("""
            SELECT conname, conrelid::regclass 
            FROM pg_constraint 
            WHERE confrelid = 'invoice'::regclass;
        """))
        for r in res:
            print(f"- {r[0]} from {r[1]}")
            
        # Check record count in whatever exists
        for table in ['invoice', 'invoice_old']:
            try:
                count = conn.execute(text(f"SELECT count(*) FROM {table};")).fetchone()[0]
                print(f"\nRecord count in '{table}': {count}")
            except:
                pass

if __name__ == "__main__":
    diagnose()
