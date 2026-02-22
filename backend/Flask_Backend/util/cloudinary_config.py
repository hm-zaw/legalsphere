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

def upload_any_file_to_cloudinary(file_storage):
    """
    file_storage: Flask/Werkzeug FileStorage (has .filename and .mimetype)
    Returns:
      {
        Success: True,
        secure_url, public_id,
        original_filename, format, resource_type
      }
    """
    try:
        filename = getattr(file_storage, "filename", None) or "attachment"
        mimetype = getattr(file_storage, "mimetype", "") or ""

        is_image = mimetype.startswith("image/")
        resource_type = "image" if is_image else "raw"   # ✅ key fix

        res = cloudinary.uploader.upload(
            file_storage,
            resource_type=resource_type,
            folder="legalsphere/chat",
            use_filename=True,
            unique_filename=True,
            type="upload",
            access_mode="public",
        )

        # Cloudinary often gives original_filename without extension
        base = res.get("original_filename") or "attachment"
        fmt = res.get("format")  # "pdf", "docx", "pptx", etc.
        name_with_ext = f"{base}.{fmt}" if fmt else base

        # Prefer user's real filename if it already has extension
        final_name = filename if "." in filename else name_with_ext

        return {
            "Success": True,
            "secure_url": res.get("secure_url"),
            "public_id": res.get("public_id"),
            "original_filename": final_name,
            "format": fmt,
            "resource_type": res.get("resource_type"),
        }

    except Exception as e:
        return {"Success": False, "Message": str(e)}