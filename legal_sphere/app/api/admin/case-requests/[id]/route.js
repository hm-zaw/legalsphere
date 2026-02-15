import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ObjectId } from "mongodb";

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

function getR2Client() {
  if (
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_ACCOUNT_ID ||
    !R2_BUCKET_NAME
  ) {
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

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Case ID is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const col = db.collection("case_requests");

    const query = {
      $or: [
        { id: id },
        ...(ObjectId.isValid(id) ? [{ _id: new ObjectId(id) }] : []),
      ],
    };
    const doc = await col.findOne(query);
    if (!doc) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const s3 = getR2Client();
    if (s3 && Array.isArray(doc.documents)) {
      doc.documents = await Promise.all(
        doc.documents.map(async (d) => {
          if (!d?.key) return d;
          try {
            const command = new GetObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: d.key,
            });
            const url = await getSignedUrl(s3, command, { expiresIn: 300 });
            return { ...d, url };
          } catch {
            return d;
          }
        }),
      );
    }

    return NextResponse.json({ item: doc });
  } catch (err) {
    console.error("Admin GET case-request by id error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      process.env.NODE_ENV === "development"
        ? { error: message }
        : { error: "Server error" },
      { status: 500 },
    );
  }
}
