from fastapi.testclient import TestClient
from app.main import create_app
from app import repository


def test_register_creates_user_and_returns_token(test_settings):
    app = create_app(test_settings)
    with TestClient(app) as client:
        res = client.post(
            "/api/auth/register", json={"email": "new@example.com", "password": "password123"}
        )
        assert res.status_code == 200
        body = res.json()
        assert body["user"]["email"] == "new@example.com"
        assert body["access_token"]

        me = client.get(
            "/api/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"}
        )
        assert me.status_code == 200
        assert me.json()["email"] == "new@example.com"


def test_register_duplicate_email_409(test_settings):
    app = create_app(test_settings)
    with TestClient(app) as client:
        client.post("/api/auth/register", json={"email": "dup@example.com", "password": "password123"})
        res = client.post("/api/auth/register", json={"email": "dup@example.com", "password": "password123"})
        assert res.status_code == 409


def test_register_short_password_422(test_settings):
    app = create_app(test_settings)
    with TestClient(app) as client:
        res = client.post("/api/auth/register", json={"email": "short@example.com", "password": "abc"})
        assert res.status_code == 422


def test_register_invalid_email_422(test_settings):
    app = create_app(test_settings)
    with TestClient(app) as client:
        res = client.post("/api/auth/register", json={"email": "not-an-email", "password": "password123"})
        assert res.status_code == 422


def test_login_success(test_settings):
    app = create_app(test_settings)
    with TestClient(app) as client:
        client.post("/api/auth/register", json={"email": "log@example.com", "password": "password123"})
        res = client.post("/api/auth/login", json={"email": "log@example.com", "password": "password123"})
        assert res.status_code == 200
        assert res.json()["user"]["email"] == "log@example.com"


def test_login_wrong_password_401(test_settings):
    app = create_app(test_settings)
    with TestClient(app) as client:
        client.post("/api/auth/register", json={"email": "log2@example.com", "password": "password123"})
        res = client.post("/api/auth/login", json={"email": "log2@example.com", "password": "wrong"})
        assert res.status_code == 401


def test_login_unknown_email_401(test_settings):
    app = create_app(test_settings)
    with TestClient(app) as client:
        res = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "password123"})
        assert res.status_code == 401


def test_me_without_token_401(test_settings):
    app = create_app(test_settings)
    with TestClient(app) as client:
        res = client.get("/api/auth/me")
        assert res.status_code == 401


def test_me_with_invalid_token_401(test_settings):
    app = create_app(test_settings)
    with TestClient(app) as client:
        res = client.get("/api/auth/me", headers={"Authorization": "Bearer garbage"})
        assert res.status_code == 401


def test_first_registration_backfills_ownerless_conversations(test_settings):
    app = create_app(test_settings)
    with TestClient(app) as client:
        conn = app.state.conn
        conn.execute("INSERT INTO conversations (title, created_at) VALUES ('legacy', '2026-01-01')")
        conn.commit()

        res = client.post("/api/auth/register", json={"email": "first@example.com", "password": "password123"})
        user_id = res.json()["user"]["id"]

        conversations = repository.list_conversations(conn, user_id)
        assert any(c["title"] == "legacy" for c in conversations)


def test_second_registration_does_not_backfill(test_settings):
    app = create_app(test_settings)
    with TestClient(app) as client:
        client.post("/api/auth/register", json={"email": "first2@example.com", "password": "password123"})

        conn = app.state.conn
        conn.execute("INSERT INTO conversations (title, created_at) VALUES ('legacy2', '2026-01-01')")
        conn.commit()

        res = client.post("/api/auth/register", json={"email": "second@example.com", "password": "password123"})
        second_user_id = res.json()["user"]["id"]

        conversations = repository.list_conversations(conn, second_user_id)
        assert not any(c["title"] == "legacy2" for c in conversations)


def test_login_rejects_oauth_only_account_without_crashing(test_settings):
    from app import repository

    app = create_app(test_settings)
    with TestClient(app) as client:
        conn = app.state.conn
        repository.get_or_create_oauth_user(conn, "oauthonly@example.com", "google", "g-1", None, None)

        res = client.post(
            "/api/auth/login", json={"email": "oauthonly@example.com", "password": "whatever123"}
        )
        assert res.status_code == 401


def test_register_response_includes_name_and_avatar_fields(test_settings):
    app = create_app(test_settings)
    with TestClient(app) as client:
        res = client.post(
            "/api/auth/register", json={"email": "fields@example.com", "password": "password123"}
        )
        body = res.json()
        assert body["user"]["name"] is None
        assert body["user"]["avatar_url"] is None


def test_me_includes_name_and_avatar_fields(test_settings):
    app = create_app(test_settings)
    with TestClient(app) as client:
        res = client.post(
            "/api/auth/register", json={"email": "me-fields@example.com", "password": "password123"}
        )
        token = res.json()["access_token"]
        me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        body = me.json()
        assert "name" in body
        assert "avatar_url" in body

