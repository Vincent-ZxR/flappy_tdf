import os
import json
import re
from pathlib import Path
from urllib import request
from fastapi import FastAPI, Request, Body
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="H2 Flappy Truck - Air Liquide Edition")

# Mount static files directory
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

# Setup Jinja2 templates
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

SCORES_FILE = BASE_DIR / "scores.json"
USERS_FILE = BASE_DIR / "users.json"

PLAYER_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{8,64}$")


def get_storage_backend_name():
    url = os.environ.get("SUPABASE_URL", "").strip()
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if url and key:
        return "supabase"
    return "local"


def _supabase_request(method, table, payload=None, filters=None):
    url = os.environ.get("SUPABASE_URL", "").strip()
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

    endpoint = f"{url.rstrip('/')}/rest/v1/{table}"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    if filters:
        params = "&".join(f"{name}=eq.{value}" for name, value in filters)
        endpoint = f"{endpoint}?{params}"

    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = request.Request(endpoint, method=method, data=data, headers=headers)
    with request.urlopen(req, timeout=15) as response:
        body = response.read().decode("utf-8")
        return json.loads(body) if body else []


def get_user_email(request: Request) -> str:
    dev_email = request.headers.get("x-user-email") or request.query_params.get("email") or ""
    if dev_email:
        return dev_email.strip().lower()

    player_id = request.headers.get("x-player-id") or request.query_params.get("player_id") or ""
    player_id = player_id.strip()
    if PLAYER_ID_PATTERN.match(player_id):
        return f"player_{player_id.lower()}@anon.local"

    return "guest@local.dev"


def load_json_data(file_path: Path, default_val):
    if not file_path.exists():
        return default_val
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default_val


def save_json_data(file_path: Path, data):
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving {file_path} locally: {e}")


def _load_supabase_json(key_name, default_val):
    try:
        rows = _supabase_request("GET", "app_state", filters=[("key", key_name)])
        if not rows:
            return default_val
        first = rows[0]
        value = first.get("value")
        if value is None:
            return default_val
        return json.loads(value)
    except Exception as exc:
        print(f"Supabase read failed for {key_name}: {exc}")
        return default_val


def _save_supabase_json(key_name, data):
    payload = {"key": key_name, "value": json.dumps(data)}
    try:
        rows = _supabase_request("GET", "app_state", filters=[("key", key_name)])
        if rows:
            row_id = rows[0].get("id")
            if row_id is not None:
                _supabase_request("PATCH", f"app_state?id=eq.{row_id}", payload={"key": key_name, "value": json.dumps(data)})
                return
        _supabase_request("POST", "app_state", payload=payload)
    except Exception as exc:
        print(f"Supabase write failed for {key_name}: {exc}")


def load_scores():
    if get_storage_backend_name() == "supabase":
        result = _load_supabase_json("scores", [])
        return result if isinstance(result, list) else []

    data = load_json_data(SCORES_FILE, [])
    return data if isinstance(data, list) else []


def save_scores(scores):
    if get_storage_backend_name() == "supabase":
        _save_supabase_json("scores", scores)
        return
    save_json_data(SCORES_FILE, scores)


def load_users():
    if get_storage_backend_name() == "supabase":
        result = _load_supabase_json("users", {})
        return result if isinstance(result, dict) else {}

    data = load_json_data(USERS_FILE, {})
    return data if isinstance(data, dict) else {}


def save_users(users):
    if get_storage_backend_name() == "supabase":
        _save_supabase_json("users", users)
        return
    save_json_data(USERS_FILE, users)

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "air-liquide-h2-flappy-driver"}

@app.get("/api/me")
async def get_me(request: Request):
    email = get_user_email(request)
    users = load_users()
    user_info = users.get(email, {})
    return {
        "email": email,
        "pseudo": user_info.get("pseudo", ""),
        "avatar": user_info.get("avatar", "🐼")
    }

@app.get("/api/scores")
async def get_scores():
    scores = load_scores()
    valid_scores = [s for s in scores if s.get("score", 0) > 0]
    sorted_scores = sorted(valid_scores, key=lambda x: x.get("score", 0), reverse=True)[:10]
    return sorted_scores

@app.post("/api/check-pseudo")
async def check_pseudo(request: Request, payload: dict = Body(...)):
    pseudo = payload.get("pseudo", "").strip()[:15]
    current_email = get_user_email(request)

    if not pseudo:
        return JSONResponse({"available": False, "message": "Veuillez saisir un pseudo pour jouer !"})

    users = load_users()
    for email, profile in users.items():
        if email != current_email and profile.get("pseudo", "").strip().lower() == pseudo.lower():
            return {"available": False, "message": "Ce pseudo est déjà utilisé par un autre joueur !"}

    return {"available": True}

@app.post("/api/user/pseudo")
async def update_user_pseudo(request: Request, payload: dict = Body(...)):
    pseudo = payload.get("pseudo", "").strip()[:15]
    avatar = payload.get("avatar", "🐼")
    current_email = get_user_email(request)

    if not pseudo:
        return JSONResponse({"status": "error", "message": "Veuillez saisir un pseudo !"}, status_code=400)

    # Reload fresh users list
    users = load_users()
    for email, profile in users.items():
        if email.lower() != current_email and profile.get("pseudo", "").strip().lower() == pseudo.lower():
            return JSONResponse({"status": "error", "message": "Ce pseudo est déjà utilisé par un autre joueur !"}, status_code=400)

    # Save mapping
    users[current_email] = {
        "pseudo": pseudo,
        "avatar": avatar
    }
    save_users(users)

    # Update pseudo & avatar in scores leaderboard
    scores = load_scores()
    scores_updated = False
    for item in scores:
        item_email = (item.get("email") or "").strip().lower()
        if item_email == current_email:
            item["pseudo"] = pseudo
            item["avatar"] = avatar
            scores_updated = True

    if scores_updated:
        save_scores(scores)

    return {"status": "success", "email": current_email, "pseudo": pseudo, "avatar": avatar}

@app.post("/api/scores")
async def add_score(request: Request, payload: dict = Body(...)):
    pseudo = payload.get("pseudo", "").strip()[:15]
    score = int(payload.get("score", 0))
    recharges = int(payload.get("recharges", 0))
    avatar = payload.get("avatar", "🐼")
    current_email = get_user_email(request)

    if not pseudo or score <= 0:
        return JSONResponse({"status": "ignored", "reason": "Score invalide"})

    # Ensure user mapping is updated
    users = load_users()
    users[current_email] = {
        "pseudo": pseudo,
        "avatar": avatar
    }
    save_users(users)

    # Reload fresh scores from storage to prevent concurrent overwrite
    scores = load_scores()
    existing = False
    for item in scores:
        item_email = (item.get("email") or "").strip().lower()
        item_pseudo = (item.get("pseudo") or "").strip().lower()

        # Match primarily by email, or fallback to matching by pseudo if email was empty
        if item_email == current_email or (not item_email and item_pseudo == pseudo.lower()):
            existing = True
            item["email"] = current_email
            item["pseudo"] = pseudo
            item["avatar"] = avatar
            if score > item.get("score", 0):
                item["score"] = score
                item["recharges"] = recharges
            break

    if not existing:
        scores.append({
            "email": current_email,
            "pseudo": pseudo,
            "avatar": avatar,
            "score": score,
            "recharges": recharges
        })

    # Keep top 50 valid scores
    scores = sorted([s for s in scores if s.get("score", 0) > 0], key=lambda x: x.get("score", 0), reverse=True)[:50]
    save_scores(scores)

    return {"status": "success", "leaderboard": scores[:10]}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
