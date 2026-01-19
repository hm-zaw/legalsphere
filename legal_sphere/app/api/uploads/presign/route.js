import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

export async function POST(req) {
  try {
    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ACCOUNT_ID || !R2_BUCKET_NAME) {
      return NextResponse.json({ error: "Missing R2 env vars" }, { status: 500 });
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });

    const body = await req.json();
    const filename = String(body?.filename ?? "");
    const contentType = String(body?.contentType ?? "application/octet-stream");

    if (!filename) {
      return NextResponse.json({ error: "filename is required" }, { status: 400 });
    }

    const uuid = crypto.randomUUID();
    const date = new Date();
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

    const key = `uploads/${y}/${m}/${d}/${uuid}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 300 });

    return NextResponse.json(
      {
        key,
        url,
        contentType, // return this
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Presign error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
