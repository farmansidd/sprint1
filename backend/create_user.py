import sqlalchemy
from sqlalchemy.orm import sessionmaker
from app.models import User
from app.core.security import get_password_hash

DATABASE_URL = "postgresql+psycopg2://postgres:admin@localhost:5433/forge"

engine = sqlalchemy.create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

username = "testuser"
password = "testpassword"
email = "testuser@example.com"

hashed_password = get_password_hash(password)
db_user = User(username=username, email=email, hashed_password=hashed_password)
db.add(db_user)
db.commit()
db.refresh(db_user)

print(f"User '{username}' created successfully.")
