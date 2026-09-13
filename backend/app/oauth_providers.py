from urllib.parse import urlencode
import httpx

PROVIDERS = {
    "google": {
        "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "userinfo_url": "https://www.googleapis.com/oauth2/v3/userinfo",
        "scope": "openid email profile",
    },
    "github": {
        "authorize_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "userinfo_url": "https://api.github.com/user",
        "scope": "read:user user:email",
    },
}


def build_authorize_url(provider: str, client_id: str, redirect_uri: str, state: str) -> str:
    config = PROVIDERS[provider]
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "state": state,
        "scope": config["scope"],
        "response_type": "code",
    }
    return f"{config['authorize_url']}?{urlencode(params)}"


async def exchange_code(
    provider: str, client_id: str, client_secret: str, code: str, redirect_uri: str
) -> str:
    """Exchanges an authorization code for an access token. Returns the access token."""
    config = PROVIDERS[provider]
    async with httpx.AsyncClient() as client:
        response = await client.post(
            config["token_url"],
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
        )
        response.raise_for_status()
        return response.json()["access_token"]


async def fetch_profile(provider: str, access_token: str) -> dict:
    """Returns {"id": str, "email": str | None, "name": str | None, "avatar_url": str | None}."""
    config = PROVIDERS[provider]
    headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}

    async with httpx.AsyncClient() as client:
        response = await client.get(config["userinfo_url"], headers=headers)
        response.raise_for_status()
        data = response.json()

    if provider == "google":
        return {
            "id": data["sub"],
            "email": data.get("email"),
            "name": data.get("name"),
            "avatar_url": data.get("picture"),
        }

    # GitHub: the /user endpoint's `email` field is only populated if the
    # user's primary email is public. If it's null, fall back to the
    # dedicated /user/emails endpoint (covered by the user:email scope
    # already requested) and pick the primary, verified address.
    email = data.get("email")
    if not email:
        async with httpx.AsyncClient() as client:
            emails_response = await client.get("https://api.github.com/user/emails", headers=headers)
            emails_response.raise_for_status()
            for entry in emails_response.json():
                if entry.get("primary") and entry.get("verified"):
                    email = entry["email"]
                    break

    return {
        "id": str(data["id"]),
        "email": email,
        "name": data.get("name") or data.get("login"),
        "avatar_url": data.get("avatar_url"),
    }
