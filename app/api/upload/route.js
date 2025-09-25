import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

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

    // Process with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Please read and analyze this document. Provide a comprehensive summary including:
    1. Main topics covered
    2. Key points and insights
    3. Important details
    4. Overall structure and organization

    Document content:
    ${fileContent}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      analysis: analysis,
      originalContent: fileContent
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: 'Failed to process file: ' + error.message
    }, { status: 500 });
  }
}