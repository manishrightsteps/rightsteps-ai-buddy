import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { chunkDocument } from '@/lib/chunking';
import { upsertChunks } from '@/lib/pinecone';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let fileContent = '';

    // Handle different file types
    if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
      fileContent = buffer.toString('utf-8');
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      fileContent = buffer.toString('utf-8');
    } else {
      return NextResponse.json({
        error: 'Unsupported file type. Please upload .md or .txt files.'
      }, { status: 400 });
    }

    // Chunk the document
    const chunks = chunkDocument(fileContent, 1000, 200);

    // Store chunks in Pinecone
    const vectorCount = await upsertChunks(chunks, file.name);

    // Generate initial analysis using first few chunks
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const firstChunks = chunks.slice(0, 3).map(chunk => chunk.text).join('\n\n');
    const prompt = `Please provide a brief overview of this document based on the following content:

    ${firstChunks}

    Provide:
    1. Main topic and purpose
    2. Key themes
    3. Document type and structure

    Keep the analysis concise since this is just an initial overview.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      analysis: analysis,
      chunksStored: vectorCount,
      totalChunks: chunks.length,
      ragEnabled: true
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: 'Failed to process file: ' + error.message
    }, { status: 500 });
  }
}