import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: Request) {
  try {
    const { title, author, category, condition } = await req.json()
    
    if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Provide a fallback mock description if API key is not configured
      return NextResponse.json({ 
        description: `This is a fantastic copy of "${title}"${author ? ` by ${author}` : ''}. Perfect for readers interested in ${category}. The book is in ${condition.replace('_', ' ').toLowerCase()} condition and ready for a new home!` 
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Write a short, engaging, and clear 2-3 sentence book description for a book listing on a platform called AksharSetu.
    Title: ${title}
    Author: ${author || 'Unknown'}
    Category: ${category || 'Unknown'}
    Condition: ${condition || 'Unknown'}
    
    Focus on what makes the book interesting and assure the buyer about its value. Keep it under 400 characters.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ description: text.trim() })

  } catch (error) {
    console.error("AI Description Error:", error)
    return NextResponse.json({ error: "Failed to generate description" }, { status: 500 })
  }
}
