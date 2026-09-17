import { CreateListingForm } from "@/components/catalog/CreateListingForm"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

export default async function NewListingPage() {
  const session = await auth()

  if (!session) {
    redirect("/login?callbackUrl=/catalog/new")
  }

  return (
    <div className="min-h-screen bg-[#F5F5DC] pt-24 pb-32">
      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#1D1D1F] mb-4">
            List your <span className="text-[#0066cc]">Book</span>
          </h1>
          <p className="text-[#86868b] text-lg font-medium">
            Fill out the details below to add your book to the catalog. You can choose to sell it or donate it.
          </p>
        </div>

        <CreateListingForm />
      </div>
    </div>
  )
}
