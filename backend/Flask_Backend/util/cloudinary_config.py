from dotenv import load_dotenv
load_dotenv()
import os
import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name = os.environ.get("CLOUD_NAME"),
    api_key = os.environ.get("CLOUDINARY_API_KEY"),
    api_secret = os.environ.get("CLOUDINARY_API_SECRET"),
    secure = True
)

def upload_img_to_cloudinary(image):
    try:
        upload_result = cloudinary.uploader.upload(image, folder="user_profiles/")
        return {"Success": True,
                "secure_url": upload_result.get("secure_url"), 
                "public_id": upload_result.get("public_id") }
    except Exception as e:
        return {"Success": False, "Unexpected Error": str(e)}