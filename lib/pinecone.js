import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let pineconeClient = null;

export async function initPinecone() {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pineconeClient;
}

export async function getEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

export async function upsertChunks(chunks, fileName) {
  try {
    const pinecone = await initPinecone();
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

    const vectors = [];

    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk.text);

      vectors.push({
        id: `${fileName}_chunk_${chunk.chunkIndex}`,
        values: embedding,
        metadata: {
          text: chunk.text,
          fileName: fileName,
          chunkIndex: chunk.chunkIndex,
          size: chunk.size,
          uploadedAt: new Date().toISOString()
        }
      });
    }

    await index.upsert(vectors);
    return vectors.length;
  } catch (error) {
    console.error('Error upserting chunks to Pinecone:', error);
    throw error;
  }
}

export async function searchSimilarChunks(query, topK = 3) {
  try {
    const pinecone = await initPinecone();
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

    const queryEmbedding = await getEmbedding(query);

    const searchResults = await index.query({
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true,
      includeValues: false
    });

    return searchResults.matches.map(match => ({
      id: match.id,
      score: match.score,
      text: match.metadata.text,
      fileName: match.metadata.fileName,
      chunkIndex: match.metadata.chunkIndex
    }));
  } catch (error) {
    console.error('Error searching similar chunks:', error);
    throw error;
  }
}

export async function deleteDocumentChunks(fileName) {
  try {
    const pinecone = await initPinecone();
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

    // Delete all chunks for a specific document
    await index.deleteMany({
      filter: {
        fileName: { $eq: fileName }
      }
    });
  } catch (error) {
    console.error('Error deleting document chunks:', error);
    throw error;
  }
}