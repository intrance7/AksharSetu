export async function createShiprocketOrder(orderDetails: any) {
  // If the user hasn't provided credentials in .env, we mock the API response
  if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
    console.warn("No Shiprocket credentials found. Using mocked API.")
    return {
      order_id: `MOCK_SR_${Date.now()}`,
      shipment_id: `MOCK_SH_${Date.now()}`,
      status: "NEW",
      status_code: 1,
      onboarding_completed_now: 0,
      awb_code: `AWB_${Math.floor(Math.random() * 1000000000)}`,
      courier_company_id: "1",
      courier_name: "Mocked Delivery Express",
    }
  }

  // Real Implementation logic (requires actual auth tokens first)
  // 1. Authenticate with Shiprocket -> Get Token
  // 2. Fetch /v1/external/orders/create/adHoc
  // This is a placeholder for the actual fetch call once credentials are set
  
  throw new Error("Shiprocket real integration requires auth logic to be finalized.")
}

export async function checkServiceability(pickup_postcode: string, delivery_postcode: string, weight: number) {
  if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
    return {
      status: 200,
      data: {
        available_courier_companies: [
          { courier_name: "Mocked Delivery", rate: 50, estimated_delivery_days: "3" }
        ]
      }
    }
  }
  
  throw new Error("Shiprocket real integration requires auth logic to be finalized.")
}
