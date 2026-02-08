import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

function getR2Client() {
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ACCOUNT_ID || !R2_BUCKET_NAME) {
    return null;
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const status = searchParams.get("status");

    const db = await getDb();
    const col = db.collection("case_requests");

    const query = { hidden: { $ne: true } }; // Exclude hidden cases
    if (status) query.status = status;

    const total = await col.countDocuments(query);
    const items = await col
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const s3 = getR2Client();
    if (s3) {
      await Promise.all(
        items.map(async (doc) => {
          if (Array.isArray(doc.documents)) {
            doc.documents = await Promise.all(
              doc.documents.map(async (d) => {
                if (!d?.key) return d;
                try {
                  const command = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: d.key });
                  const url = await getSignedUrl(s3, command, { expiresIn: 300 });
                  return { ...d, url };
                } catch {
                  return d;
                }
              })
            );
          }
        })
      );
    }

    return NextResponse.json({
      page,
      limit,
      total,
      items,
    });
  } catch (err) {
    console.error("Admin GET case-requests error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    const code = typeof err === "object" && err && "code" in err ? String(err.code) : undefined;
    return NextResponse.json(
      process.env.NODE_ENV === "development"
        ? { error: message, code }
        : { error: "Server error" },
      { status: 500 }
    );
  }
}
