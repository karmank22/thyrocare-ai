import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found")
    exit(1)

# Connect directly using psycopg2 to execute raw DDL
try:
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cursor = conn.cursor()

    columns_to_add = [
        ("is_asha_assessment", "BOOLEAN DEFAULT FALSE"),
        ("patient_name", "VARCHAR(255)"),
        ("patient_mobile", "VARCHAR(20)"),
        ("patient_village", "VARCHAR(255)"),
        ("referral_status", "VARCHAR(50) DEFAULT 'Not Referred'"),
        ("follow_up_notes", "TEXT"),
        ("fatigue", "BOOLEAN DEFAULT FALSE"),
        ("hair_fall", "BOOLEAN DEFAULT FALSE"),
        ("weight_gain", "BOOLEAN DEFAULT FALSE"),
        ("cold_intolerance", "BOOLEAN DEFAULT FALSE"),
        ("menstrual_irregularity", "BOOLEAN DEFAULT FALSE"),
        ("mood_changes", "BOOLEAN DEFAULT FALSE"),
        ("constipation", "BOOLEAN DEFAULT FALSE"),
        ("dry_skin", "BOOLEAN DEFAULT FALSE"),
        ("family_history_thyroid", "BOOLEAN DEFAULT FALSE"),
        ("pcos_history", "BOOLEAN DEFAULT FALSE"),
        ("pregnancy_status", "BOOLEAN DEFAULT FALSE"),
        ("postpartum_flag", "BOOLEAN DEFAULT FALSE"),
        ("medication_current", "VARCHAR(255)"),
        ("diet_pref", "VARCHAR(50)"),
        ("iodine_zone", "VARCHAR(50)")
    ]

    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE assessments ADD COLUMN {col_name} {col_type};")
            print(f"Successfully added column {col_name}")
        except psycopg2.errors.DuplicateColumn:
            print(f"Column {col_name} already exists. Skipping.")
        except Exception as e:
            print(f"Error adding {col_name}: {e}")

    cursor.close()
    conn.close()
    print("Migration completed successfully.")

except Exception as e:
    print(f"Failed to connect or migrate: {e}")
