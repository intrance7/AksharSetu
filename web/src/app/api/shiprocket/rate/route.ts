import { NextResponse } from "next/server"

// Mock Shiprocket API for calculating shipping rates based on pincodes
// In production, this would call Shiprocket's "Check Serviceability" or "Calculate Freight" endpoints.
export async function POST(req: Request) {
  try {
    const { pickup_pincode, delivery_pincode, weight } = await req.json()

    if (!delivery_pincode || delivery_pincode.length !== 6) {
      return NextResponse.json({ error: "Invalid delivery pincode" }, { status: 400 })
    }

    // Mock logic:
    // If first digit matches, it's intra-zone (local) -> ~₹40
    // If it's neighboring zone -> ~₹60
    // If it's far -> ~₹90
    let rate = 90
    let eta = "5-7 days"

    if (pickup_pincode && delivery_pincode) {
      if (pickup_pincode[0] === delivery_pincode[0]) {
        rate = 40
        eta = "1-2 days"
      } else if (Math.abs(parseInt(pickup_pincode[0]) - parseInt(delivery_pincode[0])) === 1) {
        rate = 60
        eta = "3-4 days"
      }
    }

    // Add extra for weight above 1kg
    const extraWeight = Math.max(0, (weight || 0.5) - 1.0)
    rate += Math.ceil(extraWeight) * 20

    return NextResponse.json({
      rate,
      eta,
      courier_company_id: 1, // e.g. Delhivery
      courier_name: "Shiprocket Partner (Delhivery)"
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
