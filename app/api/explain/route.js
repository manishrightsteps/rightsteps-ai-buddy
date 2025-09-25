import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchSimilarChunks } from '@/lib/pinecone';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { question, fileName } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'No question provided' }, { status: 400 });
    }

    // Search for relevant chunks using RAG
    const relevantChunks = await searchSimilarChunks(question, 3);

    if (relevantChunks.length === 0) {
      return NextResponse.json({
        error: 'No relevant content found. Please upload a document first.'
      }, { status: 404 });
    }

    // Prepare context from retrieved chunks
    const context = relevantChunks
      .map((chunk, index) => `[Chunk ${index + 1}]\n${chunk.text}`)
      .join('\n\n---\n\n');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Based on the following relevant sections from the document, please answer the question: "${question}"

    Context from document:
    ${context}

    Instructions:
    - Provide a clear, detailed answer based only on the information provided above
    - If the context doesn't contain enough information to answer the question, say so
    - Make your response conversational and easy to understand
    - Reference specific details from the context when relevant

    Question: ${question}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text();

    return NextResponse.json({
      success: true,
      explanation: explanation,
      isQuestion: true,
      sourcesUsed: relevantChunks.length,
      sources: relevantChunks.map(chunk => ({
        fileName: chunk.fileName,
        chunkIndex: chunk.chunkIndex,
        similarity: Math.round(chunk.score * 100) / 100
      }))
    });

  } catch (error) {
    console.error('Explanation error:', error);
    return NextResponse.json({
      error: 'Failed to generate explanation: ' + error.message
    }, { status: 500 });
  }
}