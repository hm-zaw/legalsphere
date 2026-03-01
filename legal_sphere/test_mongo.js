const { MongoClient } = require('mongodb');

async function run() {
  const uri = 'mongodb+srv://htetmyetzaw114:hmzhmz114@cluster0.xn7xbri.mongodb.net/legal_sphere?retryWrites=true&w=majority&appName=LegalSphere';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('legal_sphere');
    const col = db.collection('case_requests');

    console.log('int count:', await col.countDocuments({ assignedLawyerId: 98 }));
    console.log('string count:', await col.countDocuments({ assignedLawyerId: '98' }));
    
    const docs = await col.find({ assignedLawyerId: { $in: [98, '98'] } }).toArray();
    console.log('Docs with 98:', docs.length);
    console.log('Sample IDs:', docs.map(d => d._id));
    
  } finally {
    await client.close();
  }
}

run().catch(console.error);
