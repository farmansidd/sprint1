from cryptography.fernet import Fernet
from app.core.config import ENCRYPTION_KEY

# Ensure ENCRYPTION_KEY is set and is a valid Fernet key
if not ENCRYPTION_KEY:
    raise ValueError("ENCRYPTION_KEY environment variable is not set. Please generate a Fernet key and set it.")

try:
    f = Fernet(ENCRYPTION_KEY.encode())
except Exception as e:
    raise ValueError(f"Invalid ENCRYPTION_KEY: {e}. Ensure it's a URL-safe base64-encoded 32-byte key.")

def encrypt_data(data: str) -> str:
    return f.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data: str) -> str:
    return f.decrypt(encrypted_data.encode()).decode()
