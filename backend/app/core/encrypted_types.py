from sqlalchemy.types import TypeDecorator, String
from app.core.encryption import encrypt_data, decrypt_data

class EncryptedString(TypeDecorator):
    """Encrypts and decrypts strings automatically."""

    impl = String

    def process_bind_param(self, value, dialect):
        if value is not None:
            return encrypt_data(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return decrypt_data(value)
        return value
