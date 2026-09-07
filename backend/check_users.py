import sqlalchemy

DATABASE_URL = "postgresql+psycopg2://postgres:admin@localhost:5433/forge"

engine = sqlalchemy.create_engine(DATABASE_URL)

with engine.connect() as connection:
    result = connection.execute(sqlalchemy.text("SELECT username, email FROM users"))
    users = result.fetchall()
    for user in users:
        print(f"Username: {user[0]}, Email: {user[1]}") 