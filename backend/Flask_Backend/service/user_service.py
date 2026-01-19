import os
from db.users import Users
from db.supabase_obj import SupabaseObject
from util.cloudinary_config import upload_img_to_cloudinary
from werkzeug.security import generate_password_hash, check_password_hash

class User_Service:
    def __init__(self):
        self.supabase_object = SupabaseObject()
        self.supabase_client = self.supabase_object.get_supabase_client()
        current_dir          = os.path.dirname(__file__)
        root_dir             = os.path.dirname(current_dir)
        self.default_pf_dir  = os.path.join(root_dir,"assets", "default_pf.jpg")

    def add_new_client(self, name, email, password):
        if not name: return {"Error": "Name is missing"}
        if not email: return {"Error": "Email is missing"}
        if not password: return {"Error": "Password is missing"}
        img_upload_result = upload_img_to_cloudinary(self.default_pf_dir)
        if img_upload_result["Success"]:
            secure_url = img_upload_result["secure_url"]
            public_id = img_upload_result["public_id"]
        else:
            return img_upload_result
        hash_password = generate_password_hash(password)
        new_user = Users(name=name, email=email, password=hash_password, 
                         role="client", img_url=secure_url, public_id=public_id)
        return Users.add_new_client(self.supabase_client, new_user)
    
    def authenticate_client(self, email, password):
        if not email: return {"Error": "Email is missing"}
        if not password: return {"Error": "Password is missing"}
        try:
            client = Users.get_client_by_email(self.supabase_client, email)
            if client is None:
                return {"Success": False, "Message": "User with this eamil not exist"}
            if check_password_hash(client["password"], password):
                client.pop("id", None)
                client.pop("password", None)
                return {"Success": True, "Message": "Login Success", "User Data": client}
            else: 
                return {"Success": False, "Message": "Incorrect password"}
        except Exception as e: 
            return {"Success": False, "Unexpected Error": str(e)}

