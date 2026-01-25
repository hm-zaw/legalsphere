import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = "legal_sphere";

if (!uri) {
  throw new Error("MONGODB_URI is not set. Please add it to your environment.");
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

// In Next.js dev, use global to avoid creating multiple clients due to HMR
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getDb(): Promise<Db> {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const c = new MongoClient(uri);
      global._mongoClientPromise = c.connect();
    }
    const connected = await global._mongoClientPromise;
    return connected.db(dbName);
  }

  if (!client) client = new MongoClient(uri);
  if (!clientPromise) clientPromise = client.connect();
  const connected = await clientPromise;
  return connected.db(dbName);
}
