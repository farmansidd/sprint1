import sqlalchemy

DATABASE_URL = "postgresql+psycopg2://postgres:admin@localhost:5433/forge"

engine = sqlalchemy.create_engine(DATABASE_URL)

with engine.connect() as connection:
    result = connection.execute(sqlalchemy.text("SELECT username, COUNT(*) FROM users GROUP BY username HAVING COUNT(*) > 1"))
    duplicates = result.fetchall()
    for duplicate in duplicates:
        print(f"Found duplicate username: {duplicate[0]}")
        
        # Get the IDs of the duplicate users to be deleted
        user_ids_to_delete_result = connection.execute(sqlalchemy.text(f"SELECT id FROM (SELECT id, ROW_NUMBER() OVER(PARTITION BY username ORDER BY id) as rn FROM users WHERE username = '{duplicate[0]}') t WHERE t.rn > 1"))
        user_ids_to_delete = [row[0] for row in user_ids_to_delete_result]

        if user_ids_to_delete:
            # Get the roadmap IDs associated with the duplicate users
            roadmap_ids_result = connection.execute(sqlalchemy.text(f"SELECT id FROM roadmaps WHERE owner_id IN ({','.join(map(str, user_ids_to_delete))})"))
            roadmap_ids = [row[0] for row in roadmap_ids_result]

            if roadmap_ids:
                # Get the topic IDs associated with the roadmaps
                topic_ids_result = connection.execute(sqlalchemy.text(f"SELECT id FROM topics WHERE roadmap_id IN ({','.join(map(str, roadmap_ids))})"))
                topic_ids = [row[0] for row in topic_ids_result]

                if topic_ids:
                    # Get the subtopic IDs associated with the topics
                    subtopic_ids_result = connection.execute(sqlalchemy.text(f"SELECT id FROM subtopics WHERE topic_id IN ({','.join(map(str, topic_ids))})"))
                    subtopic_ids = [row[0] for row in subtopic_ids_result]
                    
                    if subtopic_ids:
                        # Delete skills associated with the subtopics
                        connection.execute(sqlalchemy.text(f"DELETE FROM skills WHERE subtopic_id IN ({','.join(map(str, subtopic_ids))})"))

                    # Delete subtopics associated with the topics
                    connection.execute(sqlalchemy.text(f"DELETE FROM subtopics WHERE topic_id IN ({','.join(map(str, topic_ids))})"))

                # Delete topics associated with the roadmaps
                connection.execute(sqlalchemy.text(f"DELETE FROM topics WHERE roadmap_id IN ({','.join(map(str, roadmap_ids))})"))

            # Delete roadmaps associated with the duplicate users
            connection.execute(sqlalchemy.text(f"DELETE FROM roadmaps WHERE owner_id IN ({','.join(map(str, user_ids_to_delete))})"))
            
            # Delete the duplicate users
            connection.execute(sqlalchemy.text(f"DELETE FROM users WHERE id IN ({','.join(map(str, user_ids_to_delete))})"))

    connection.commit()
