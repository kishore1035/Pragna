import time
from app.auth import hash_password, verify_password, create_access_token, decode_access_token


def test_hash_and_verify_password():
    hashed = hash_password("correct horse battery staple")
    assert hashed != "correct horse battery staple"
    assert verify_password("correct horse battery staple", hashed) is True
    assert verify_password("wrong password", hashed) is False


def test_create_and_decode_access_token():
    token = create_access_token(user_id=42, email="a@example.com", secret="test-secret")
    payload = decode_access_token(token, "test-secret")
    assert payload["sub"] == "42"
    assert payload["email"] == "a@example.com"


def test_decode_access_token_wrong_secret_returns_none():
    token = create_access_token(user_id=1, email="a@example.com", secret="secret-a")
    assert decode_access_token(token, "secret-b") is None


def test_decode_access_token_garbage_returns_none():
    assert decode_access_token("not-a-real-token", "any-secret") is None
