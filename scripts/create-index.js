const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config({ path: '.env.local' });

async function createIndex() {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    const indexName = process.env.PINECONE_INDEX_NAME || 'rightsteps-docs';

    console.log(`Creating Pinecone index: ${indexName}...`);

    await pinecone.createIndex({
      name: indexName,
      dimension: 768, // Gemini text-embedding-004 dimensions
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });

    console.log(`✅ Index ${indexName} created successfully!`);
    console.log(`⏳ Please wait 1-2 minutes for the index to be ready before uploading documents.`);

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`✅ Index ${process.env.PINECONE_INDEX_NAME} already exists!`);
    } else {
      console.error('Error creating index:', error.message);
      console.log('\n📋 Manual steps:');
      console.log('1. Go to https://app.pinecone.io');
      console.log('2. Click "Create Index"');
      console.log('3. Name: rightsteps-docs');
      console.log('4. Dimensions: 768');
      console.log('5. Metric: cosine');
      console.log('6. Use serverless (free tier)');
    }
  }
}

createIndex();