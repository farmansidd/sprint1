import sqlalchemy

DATABASE_URL = "postgresql+psycopg2://postgres:admin@localhost:5433/forge"

engine = sqlalchemy.create_engine(DATABASE_URL)

with engine.connect() as connection:
    connection.execute(sqlalchemy.text("DELETE FROM alembic_version"))
    connection.commit()
