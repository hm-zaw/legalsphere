const { MongoClient } = require('mongodb');
const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);
async function run() {
  await client.connect();
  const db = client.db('legal_sphere');
  const collection = db.collection('appointments');
  const docs = await collection.find({}).limit(5).toArray();
  console.log(JSON.stringify(docs, null, 2));
  await client.close();
}
run().catch(console.error);
