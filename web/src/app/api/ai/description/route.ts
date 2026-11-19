import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"

function buildFallbackDescription(
  title: string,
  author?: string,
  category?: string,
  condition?: string
) {
  const cleanCond = (condition || "GOOD").replace(/_/g, " ").toLowerCase()
  const cleanCat = category || "general reading"
  return `Well-kept ${cleanCond} edition of "${title}"${
    author ? ` by ${author}` : ""
  }. Ideal for ${cleanCat} readers and students looking for a reliable copy with clean, readable pages—ready to ship or exchange on AksharSetu.`
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const title = typeof body?.title === "string" ? body.title.trim() : ""
    const author = typeof body?.author === "string" ? body.author.trim() : undefined
    const category =
      typeof body?.category === "string" ? body.category.trim() : undefined
    const condition =
      typeof body?.condition === "string" ? body.condition.trim() : undefined

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim()
    if (!apiKey || apiKey === "placeholder") {
      return NextResponse.json({
        description: buildFallbackDescription(title, author, category, condition),
      })
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

      const prompt = `Write a short, engaging, and clear 2-3 sentence book description for a book listing on AksharSetu.
Title: ${title}
Author: ${author || "Unknown"}
Category: ${category || "Unknown"}
Condition: ${condition || "Unknown"}

Focus on what makes the book valuable to its next reader. Keep it under 380 characters and do not wrap in quotes.`

      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()
      if (text) {
        return NextResponse.json({ description: text })
      }
    } catch (aiErr) {
      console.warn("Gemini description fallback triggered:", aiErr)
    }

    return NextResponse.json({
      description: buildFallbackDescription(title, author, category, condition),
    })
  } catch (error) {
    console.error("AI Description Error:", error)
    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 }
    )
  }
}
