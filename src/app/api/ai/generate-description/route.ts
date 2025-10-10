import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: Request) {
  try {
    const { title } = await request.json();
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Use the models property
    const model = genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Based on the task title "${title}", generate a concise, actionable description for a project management task. Use markdown bullet points for any sub-tasks.`
    });

    const result = await model;
    const text = result.text;

    return NextResponse.json({ description: text });
  } catch (error) {
    console.error("AI generation failed:", error);
    return NextResponse.json({ error: 'Failed to generate description.' }, { status: 500 });
  }
}