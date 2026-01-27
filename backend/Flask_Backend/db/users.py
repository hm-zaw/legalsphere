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

class Lawyers(BaseModel):
    user_id: int
    name: str
    email: str
    specialization: Optional[str] = None
    experience: Optional[str] = None
    availability: Optional[str] = "Available"
    case_history_summary: Optional[str] = None
    phone: Optional[str] = None
    barNumber: Optional[str] = None
    created_at: Optional[datetime] = None

# Standalone functions to avoid Pydantic static method conflicts
def get_client_by_email(supabase_client, email):
    client = supabase_client.table("users").select("*").eq("email", email).execute()
    if not client.data:
        return None
    return client.data[0]

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

def add_new_lawyer(supabase_client, new_lawyer: "Lawyers"):
    try:
        existed_lawyer = supabase_client.table("lawyers").select("email").eq("email", new_lawyer.email).execute()
        if existed_lawyer.data:
            return {"Success": False, "Message": "Lawyer with this email already existed"}
        data = new_lawyer.model_dump(exclude_none=True)
        supabase_client.table("lawyers").insert(data).execute()
        registered_lawyer = supabase_client.table("lawyers").select("*").eq("email", new_lawyer.email).execute()
        return {"Success": True, "Message": f"New lawyer {new_lawyer.name} is added.",
                "Lawyer Data": registered_lawyer.data}
    except APIError as e:
        return {"Success": False, "Message": str(e)}
    except Exception as e:
        return {"Success": False, "Message": f"Unexpected error occur: {str(e)}"}

def get_lawyer_by_email(supabase_client, email):
    lawyer = supabase_client.table("lawyers").select("*").eq("email", email).execute()
    if not lawyer.data:
        return None
    return lawyer.data[0]

def get_all_lawyers(supabase_client):
    lawyers = supabase_client.table("lawyers").select("*").execute()
    return lawyers.data