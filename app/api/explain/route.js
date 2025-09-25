import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { content, question } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let prompt;
    if (question) {
      prompt = `Based on this document, please answer the following question: "${question}"

      Document content:
      ${content}

      Please provide a clear, concise answer based on the information in the document.`;
    } else {
      prompt = `Please provide a detailed explanation of this document. Make it conversational and easy to understand, as if you're explaining it to someone who hasn't read it yet.

      Document content:
      ${content}`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text();

    return NextResponse.json({
      success: true,
      explanation: explanation,
      isQuestion: !!question
    });

  } catch (error) {
    console.error('Explanation error:', error);
    return NextResponse.json({
      error: 'Failed to generate explanation: ' + error.message
    }, { status: 500 });
  }
}