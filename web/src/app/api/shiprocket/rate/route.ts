import { NextResponse } from "next/server"

// Calculates shipping rates based on pickup & delivery pincodes and parcel weight
export async function POST(req: Request) {
  try {
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const pickup_pincode =
      typeof body?.pickup_pincode === "string" ? body.pickup_pincode.trim() : ""
    const delivery_pincode =
      typeof body?.delivery_pincode === "string"
        ? body.delivery_pincode.trim()
        : ""
    const parsedWeight = Number(body?.weight)
    const weight =
      Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 0.5

    if (!/^\d{6}$/.test(delivery_pincode)) {
      return NextResponse.json(
        { error: "Invalid 6-digit delivery pincode" },
        { status: 400 }
      )
    }

    // Zone-based domestic freight estimate:
    // Same postal zone -> ~₹40, neighboring zone -> ~₹60, long-distance -> ~₹90
    let rate = 90
    let eta = "5-7 days"

    if (/^\d{6}$/.test(pickup_pincode)) {
      if (pickup_pincode[0] === delivery_pincode[0]) {
        rate = 40
        eta = "1-2 days"
      } else if (
        Math.abs(parseInt(pickup_pincode[0], 10) - parseInt(delivery_pincode[0], 10)) === 1
      ) {
        rate = 60
        eta = "3-4 days"
      }
    } else if (delivery_pincode[0] === "1") {
      rate = 40
      eta = "2-3 days"
    } else if (delivery_pincode[0] === "2") {
      rate = 60
      eta = "3-4 days"
    }

    // Add extra for weight above 1kg
    const extraWeight = Math.max(0, weight - 1.0)
    rate += Math.ceil(extraWeight) * 20

    return NextResponse.json({
      rate,
      eta,
      courier_company_id: 1,
      courier_name: "Shiprocket Partner (Delhivery)",
    })
  } catch (error) {
    console.error("Shiprocket rate error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
