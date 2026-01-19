from flask import jsonify
from typing import Optional
from datetime import datetime
from postgrest import APIError
from pydantic import BaseModel

class Users(BaseModel):
    id: Optional[int] = None
    name: str
    email: str
    password: str
    role: str
    img_url: str
    public_id: str
    created_at: Optional[datetime] = None

    @staticmethod
    def get_client_by_email(supabase_client, email):
        client = supabase_client.table("users").select("*").eq("email", email).execute()
        if not client.data:
            return None
        return client.data[0]

    @staticmethod
    def add_new_client(supabase_client, new_user: "Users"):
        try:
            existed_user = supabase_client.table("users").select("email").eq("email", new_user.email).execute()
            if existed_user.data:
                return {"Success": False, "Message": "User with this email already existed"}
            data = new_user.model_dump(exclude_none=True)
            supabase_client.table("users").insert(data).execute()
            registered_user = supabase_client.table("users").select("name", "email", "role", "img_url", "created_at").eq("email", new_user.email).execute()
            return {"Success": True, "Message": f"New user {new_user.name} is added.",
                    "User Data": registered_user.data}
        except APIError as e:
            return {"Success": False, "Message": str(e)}
        except Exception as e:
            return {"Success": False, "Message": f"Unexpected error occur: {str(e)}"}