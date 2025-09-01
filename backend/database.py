import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

# Using a file-based SQLite database for development.
# The database file will be created in the same directory.
SQLALCHEMY_DATABASE_URL = "sqlite:///./main.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # connect_args is a SQLite-specific option
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_db_and_tables():
    """
    Creates the database file and all tables defined in models.py.
    This should be called once on application startup.
    """
    Base.metadata.create_all(bind=engine)

def get_db():
    """
    Dependency for FastAPI routes to get a DB session.
    Ensures the session is closed after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
