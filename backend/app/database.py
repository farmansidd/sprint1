from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Ensure the URL uses the asyncpg driver and has the correct scheme
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgresql//"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql//", "postgresql://", 1)
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Remove 'sslmode' if it exists in the URL, as it's not supported by asyncpg
if SQLALCHEMY_DATABASE_URL:
    parsed_url = urlparse(SQLALCHEMY_DATABASE_URL)
    query_params = parse_qs(parsed_url.query)
    if 'sslmode' in query_params:
        del query_params['sslmode']
    
    # Rebuild the URL without the sslmode parameter
    new_query = urlencode(query_params, doseq=True)
    SQLALCHEMY_DATABASE_URL = urlunparse(
        (parsed_url.scheme,
         parsed_url.netloc,
         parsed_url.path,
         parsed_url.params,
         new_query,
         parsed_url.fragment)
    )

engine = create_async_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with SessionLocal() as session:
        yield session
