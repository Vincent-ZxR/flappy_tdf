import os
import tempfile
import unittest
from pathlib import Path

import app as app_module


class StorageBackendTests(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
