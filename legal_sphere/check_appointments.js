const { MongoClient } = require('mongodb');
const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('legal_sphere');
    const appointments = db.collection('appointments');
    const appts = await appointments.find({}).limit(2).toArray();
    console.log(JSON.stringify(appts, null, 2));
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
