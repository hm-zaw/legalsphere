const { MongoClient } = require('mongodb');

async function run() {
  require('dotenv').config({ path: '.env.local' });
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('legal_sphere');
    const col = db.collection('case_requests');

    let lawyerId = "98";
    const lawyerIdNum = parseInt(lawyerId, 10);
    const query = { hidden: { $ne: true } };
    query.assignedLawyerId = { 
      $in: [lawyerId, ...(isNaN(lawyerIdNum) ? [] : [lawyerIdNum])] 
    };

    console.log("Query is:", JSON.stringify(query));
    const docs = await col.find(query).toArray();
    console.log('Docs returned:', docs.length);
    if(docs.length > 0) {
      console.log('Sample Document status:', docs[0].status);
    }
    
  } finally {
    await client.close();
  }
}

run().catch(console.error);
