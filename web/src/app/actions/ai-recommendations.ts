"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

export type AIRecommendation = {
  title: string;
  author: string;
  reason: string;
  availableBookId?: string | null;
}

export async function getAIRecommendations(): Promise<AIRecommendation[]> {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("You must be logged in to get personalized recommendations.")
  }

  // 1. Gather Context
  const userId = session.user.id
  
  const wishlists = await prisma.wishlist.findMany({
    where: { userId },
    select: { title: true }
  })
  
  const libraryBooks = await prisma.libraryBook.findMany({
    where: { userId },
    select: { title: true, author: true }
  })

  const pastOrders = await prisma.order.findMany({
    where: { buyerId: userId },
    include: { book: { select: { title: true, author: true, category: true } } },
    take: 5,
    orderBy: { createdAt: 'desc' }
  })

  const contextData = {
    wishlists: wishlists.map(w => w.title),
    library: libraryBooks.map(b => `${b.title} by ${b.author}`),
    recentPurchases: pastOrders.map(o => `${o.book.title} by ${o.book.author} (${o.book.category})`)
  }

  // Fallback if no data
  const hasContext = contextData.wishlists.length > 0 || contextData.library.length > 0 || contextData.recentPurchases.length > 0
  const prompt = hasContext 
    ? `Based on the following user reading context, recommend 5 new books they might like.
      Context:
      Wishlisted: ${contextData.wishlists.join(', ')}
      In Library: ${contextData.library.join(', ')}
      Recently Purchased: ${contextData.recentPurchases.join(', ')}
      
      Respond STRICTLY with a JSON array of objects, where each object has:
      - title (string)
      - author (string)
      - reason (string: max 1 sentence explaining why they would like it based on their context)
      `
    : `Recommend 5 highly popular and acclaimed books across various genres (Fiction, Academic, Self-Help).
      Respond STRICTLY with a JSON array of objects, where each object has:
      - title (string)
      - author (string)
      - reason (string: max 1 sentence explaining why it's a great read)
      `;

  // 2. Call Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  let recommendations: AIRecommendation[] = [];
  try {
    // Attempt to parse JSON from the response. Often AI wraps JSON in ```json ... ```
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.substring(7);
    }
    if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.substring(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.substring(0, jsonStr.length - 3);
    }
    recommendations = JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error("Failed to parse Gemini response:", responseText);
    throw new Error("Failed to generate recommendations. Please try again.");
  }

  // 3. Cross-reference with Marketplace
  const enrichedRecommendations = await Promise.all(
    recommendations.map(async (rec) => {
      // Find a book in the database that matches the title (case-insensitive)
      const availableBook = await prisma.book.findFirst({
        where: {
          title: {
            contains: rec.title,
            mode: 'insensitive'
          },
          status: 'AVAILABLE'
        },
        select: { id: true }
      });

      return {
        ...rec,
        availableBookId: availableBook?.id || null
      }
    })
  );

  return enrichedRecommendations;
}
