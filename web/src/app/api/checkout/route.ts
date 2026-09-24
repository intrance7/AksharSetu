import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import Razorpay from "razorpay"
import { createShiprocketOrder } from "@/lib/shiprocket"

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder",
})

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id;

    const body = await req.json()
    const { bookId } = body

    if (!bookId) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 })
    }

    // Start a transaction to ensure atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch the book to check availability
      const book = await tx.book.findUnique({
        where: { id: bookId },
      })

      if (!book) {
        throw new Error("Book not found")
      }

      if (book.status !== "AVAILABLE") {
        throw new Error("Book is no longer available")
      }

      if (book.ownerId === userId) {
        throw new Error("You cannot purchase your own book")
      }

      if (book.price === 0) {
        throw new Error("Donations cannot be purchased through checkout")
      }

      // 2. Mark the book as RESERVED atomically
      const updatedBook = await tx.book.update({
        where: { id: bookId },
        data: { status: "RESERVED" },
      })

      const platformFee = 25
      const shippingFee = 40
      const totalAmount = updatedBook.price + platformFee + shippingFee

      // 3. Create a Razorpay Order
      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // amount in smallest currency unit (paise)
        currency: "INR",
        receipt: `receipt_book_${updatedBook.id.substring(0, 8)}`,
      })

      // 4. Create a PENDING Order in our DB, storing the razorpay_order_id in paymentId
      const order = await tx.order.create({
        data: {
          amount: totalAmount,
          status: "PENDING",
          paymentId: rzpOrder.id,
          bookId: updatedBook.id,
          buyerId: userId,
        },
      })

      // 5. Trigger Shiprocket logistics
      const shiprocketData = await createShiprocketOrder({
        order_id: order.id,
        billing_customer_name: "Buyer", // In a real app, fetch from user profile
        billing_last_name: "",
        billing_address: "123 Main St",
        billing_city: "Mumbai",
        billing_pincode: "400001",
        billing_state: "Maharashtra",
        billing_country: "India",
        billing_email: session.user.email || "buyer@example.com",
        billing_phone: "9876543210",
        shipping_is_billing: true,
        order_items: [{
          name: updatedBook.title,
          sku: updatedBook.isbn || `SKU_${updatedBook.id}`,
          units: 1,
          selling_price: updatedBook.price,
        }],
        payment_method: "Prepaid",
        sub_total: totalAmount,
        length: 20,
        breadth: 15,
        height: 5,
        weight: updatedBook.weight || 0.5,
      })

      // 6. Create Shipment Record
      await tx.shipment.create({
        data: {
          orderId: order.id,
          awbCode: shiprocketData.awb_code,
          courierName: shiprocketData.courier_name,
          shiprocketOrderId: shiprocketData.order_id,
          status: "PENDING",
        }
      })

      return {
        orderId: order.id,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
      }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("Checkout creation error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 })
  }
}
