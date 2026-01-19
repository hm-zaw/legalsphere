import os
from dotenv import load_dotenv
load_dotenv()

class SupabaseObject:
    def __init__(self):
        self.url = os.environ.get("SUPABASE_URL")
        self.key = os.environ.get("SUPABASE_KEY")
        from supabase import create_client
        self.supabase_client = create_client(self.url, self.key)

    def get_supabase_client(self):
        return self.supabase_client