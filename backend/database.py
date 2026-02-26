import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

# We expect DATABASE_URL to be set in the environment: 
# postgresql://postgres.lvzijrhwphgzdqddxsjx:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    # Use SQLite as a fallback for local testing if the URL is not found
    SQLALCHEMY_DATABASE_URL = "sqlite:///./dummy_verification.db"
    
# Check if it's sqlite, in which case we need check_same_thread=False
# SQLAlchemy needs postgresql or postgresql+psycopg2/asyncpg
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Use psycopg2 driver for postgres by default
    if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
