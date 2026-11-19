import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ListBookForm } from "@/components/catalog/ListBookForm"

export const dynamic = "force-dynamic"

export default async function ListBookPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const typeParam =
    typeof resolvedParams.type === "string" ? resolvedParams.type : undefined
  const campaignIdParam =
    typeof resolvedParams.campaignId === "string"
      ? resolvedParams.campaignId
      : undefined
  const bundleParam = resolvedParams.bundle === "true"

  const session = await auth()

  if (!session?.user?.id) {
    const qs = new URLSearchParams()
    if (typeParam) qs.set("type", typeParam)
    if (campaignIdParam) qs.set("campaignId", campaignIdParam)
    if (bundleParam) qs.set("bundle", "true")
    const target = qs.toString()
      ? `/catalog/new?${qs.toString()}`
      : "/catalog/new"
    redirect(`/login?callbackUrl=${encodeURIComponent(target)}`)
  }

  const [user, campaign] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { latitude: true, longitude: true, location: true },
    }),
    campaignIdParam
      ? prisma.campaign.findUnique({
          where: { id: campaignIdParam },
          select: { id: true, title: true, ngoName: true },
        })
      : Promise.resolve(null),
  ])

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-10 md:pt-14 pb-16 relative overflow-x-clip">
      {/* Background Decorations - Left */}
      <div className="hidden xl:block absolute -left-12 top-24 w-[360px] pointer-events-none z-0">
        <div className="relative transform -rotate-12 mb-12 left-24">
          <p className="font-['Caveat'] text-3xl text-[#86868b] leading-tight flex flex-col gap-1">
            <span>Books</span>
            <span>build</span>
            <span>brighter</span>
            <span className="flex items-center gap-2">
              tomorrows{" "}
              <span className="w-8 h-8 inline-flex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/doodle-heart.png"
                  alt=""
                  className="w-full h-full object-contain"
                />
              </span>
            </span>
          </p>
        </div>

        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/books-left-ai.png"
            alt=""
            className="w-full h-auto drop-shadow-2xl mix-blend-multiply"
          />
        </div>
      </div>

      {/* Background Decorations - Right */}
      <div className="hidden xl:block absolute -right-12 top-16 w-[360px] pointer-events-none z-0">
        <div className="relative transform rotate-6 mb-24 right-16 text-right">
          <p className="font-['Caveat'] text-3xl text-[#86868b] leading-tight">
            Good books <br /> find better people.
          </p>
        </div>

        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/books-right-ai.png"
            alt=""
            className="w-full h-auto drop-shadow-2xl mix-blend-multiply"
          />
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 md:px-8 relative z-10 w-full">
        {/* Header Section */}
        <div className="mb-8 md:mb-10 w-full flex flex-col justify-start">
          <Link
            href={campaign ? "/donations" : "/catalog"}
            className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#C84200] transition-colors mb-5 font-semibold text-sm w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            {campaign ? "Back to Vidya Daan Campaigns" : "Back to Catalog"}
          </Link>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#1D1D1F] tracking-tight leading-none mb-3">
            {campaign || typeParam === "donation" ? (
              <>
                Donate a{" "}
                <span className="text-[#C84200] relative inline-block">
                  Book
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/doodle-lightning.png"
                    alt=""
                    className="hidden sm:block absolute -top-4 -right-10 w-12 h-12 opacity-60 mix-blend-multiply rotate-12 pointer-events-none"
                  />
                </span>
              </>
            ) : (
              <>
                List a{" "}
                <span className="text-[#C84200] relative inline-block">
                  Book
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/doodle-lightning.png"
                    alt=""
                    className="hidden sm:block absolute -top-4 -right-10 w-12 h-12 opacity-60 mix-blend-multiply rotate-12 pointer-events-none"
                  />
                </span>
              </>
            )}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[#86868B] font-medium max-w-xl leading-snug">
            Give your books a second home. Donate them through Vidya Daan, swap
            1-for-1, or sell them to a fellow reader nearby.
          </p>
        </div>

        {/* Form Container */}
        <ListBookForm
          initialLocation={{
            latitude: user?.latitude ?? null,
            longitude: user?.longitude ?? null,
            location: user?.location ?? "",
          }}
          initialCampaign={campaign}
          initialType={
            typeParam === "donation" || campaign
              ? "DONATE"
              : bundleParam
              ? "SELL"
              : undefined
          }
        />
      </div>
    </div>
  )
}
