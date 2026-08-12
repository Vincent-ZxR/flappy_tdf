import os
import asyncio
import tempfile
import unittest
from pathlib import Path
from starlette.requests import Request

import app as app_module


class StorageBackendTests(unittest.TestCase):
    def _make_request(self, headers=None):
        raw_headers = []
        for name, value in (headers or {}).items():
            raw_headers.append((name.lower().encode("utf-8"), value.encode("utf-8")))
        scope = {
            "type": "http",
            "method": "POST",
            "path": "/",
            "query_string": b"",
            "headers": raw_headers,
        }
        return Request(scope)

    def test_local_backend_is_default(self):
        original_url = os.environ.get("SUPABASE_URL")
        original_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

        try:
            os.environ.pop("SUPABASE_URL", None)
            os.environ.pop("SUPABASE_SERVICE_ROLE_KEY", None)
            self.assertEqual(app_module.get_storage_backend_name(), "local")
        finally:
            if original_url is not None:
                os.environ["SUPABASE_URL"] = original_url
            if original_key is not None:
                os.environ["SUPABASE_SERVICE_ROLE_KEY"] = original_key

    def test_local_json_fallback_works(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            app_module.SCORES_FILE = Path(temp_dir) / "scores.json"
            app_module.USERS_FILE = Path(temp_dir) / "users.json"

            app_module.save_scores([{"email": "a@test.com", "score": 42}])
            app_module.save_users({"a@test.com": {"pseudo": "Alpha", "avatar": "🐼"}})

            self.assertEqual(app_module.load_scores(), [{"email": "a@test.com", "score": 42}])
            self.assertEqual(app_module.load_users(), {"a@test.com": {"pseudo": "Alpha", "avatar": "🐼"}})

    def test_player_id_maps_to_stable_anonymous_identity(self):
        req = self._make_request({"x-player-id": "player1234"})
        identity = app_module.get_user_email(req)
        self.assertEqual(identity, "player_player1234@anon.local")

    def test_two_anonymous_players_keep_distinct_scores(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            app_module.SCORES_FILE = Path(temp_dir) / "scores.json"
            app_module.USERS_FILE = Path(temp_dir) / "users.json"

            req_one = self._make_request({"x-player-id": "alpha1234"})
            req_two = self._make_request({"x-player-id": "beta5678"})

            asyncio.run(app_module.add_score(req_one, {
                "pseudo": "Hubz",
                "avatar": "🐼",
                "score": 49,
                "recharges": 1,
            }))
            asyncio.run(app_module.add_score(req_two, {
                "pseudo": "Vince",
                "avatar": "🐱",
                "score": 33,
                "recharges": 2,
            }))

            scores = app_module.load_scores()
            pseudos = {entry.get("pseudo") for entry in scores}

            self.assertEqual(len(scores), 2)
            self.assertIn("Hubz", pseudos)
            self.assertIn("Vince", pseudos)


if __name__ == "__main__":
    unittest.main()
