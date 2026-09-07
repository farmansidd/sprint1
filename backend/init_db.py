#!/usr/bin/env python
"""
Initialize database tables directly and stamp alembic.
This is used when the migration history is incomplete.
"""
import sys
import os

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from app.models import Base
from app.core.encrypted_types import EncryptedString
import learning_state.models

DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/careerforge"

print("Creating all database tables...")
engine = create_engine(DATABASE_URL)

Base.metadata.create_all(engine)
print("Tables created successfully!")

# Now stamp alembic to the latest revision
print("Stamping alembic to latest revision...")
from alembic.config import Config
from alembic import command

alembic_cfg = Config("alembic.ini")
command.stamp(alembic_cfg, "head")
print("Alembic stamped to head successfully!")
