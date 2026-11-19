import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ScanBarcode, SlidersHorizontal, MapPin } from "lucide-react"
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

  const isDonationMode = Boolean(campaign || typeParam === "donation")

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-10 md:pt-14 pb-20 relative overflow-x-clip">
      {/* Background Decorations - Left */}
      <div className="hidden xl:block absolute -left-12 top-24 w-[360px] pointer-events-none z-0">
        <div className="relative transform -rotate-12 mb-12 left-24">
          <p
            style={{ fontFamily: "var(--font-caveat), 'Caveat', cursive" }}
            className="font-[family-name:var(--font-caveat)] text-3xl text-[#1D1D1F]/70 leading-tight flex flex-col gap-1"
          >
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
          <p
            style={{ fontFamily: "var(--font-caveat), 'Caveat', cursive" }}
            className="font-[family-name:var(--font-caveat)] text-3xl text-[#1D1D1F]/70 leading-tight"
          >
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
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <Link
              href={campaign ? "/donations" : "/catalog"}
              className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#C84200] transition-colors font-semibold text-sm w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              {campaign ? "Back to Vidya Daan Campaigns" : "Back to Catalog"}
            </Link>

            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/80 border border-[#1D1D1F]/10 text-[11px] font-black uppercase tracking-[0.18em] text-[#C84200]">
              {isDonationMode
                ? "VIDYA DAAN · DONATION STUDIO"
                : bundleParam
                  ? "CAMPUS HUB · SEMESTER PACK STUDIO"
                  : "AKSHARSETU · BOOK LISTING STUDIO"}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#1D1D1F] tracking-tighter leading-none mb-3">
                {isDonationMode ? (
                  <>
                    Donate a{" "}
                    <span className="text-[#C84200] relative inline-block">
                      Book.
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
                    Pass a{" "}
                    <span className="text-[#C84200] relative inline-block">
                      Book On.
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
              <p className="text-base sm:text-lg text-[#1D1D1F]/75 font-medium max-w-2xl leading-relaxed">
                {isDonationMode
                  ? "Pledge a textbook or reader to a verified NGO classroom drive—with a 6-stage chain-of-custody tracking ID."
                  : "Scan the barcode, grade the spine and margins honestly, and list your copy for a hostel gate handoff, 1-for-1 swap, or Vidya Daan pledge."}
              </p>
            </div>

            {/* 3-Stage Studio Index Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full lg:w-auto shrink-0">
              <div className="flex items-center gap-2.5 bg-white/85 backdrop-blur-xs border border-[#1D1D1F]/10 rounded-2xl px-3.5 py-2.5 shadow-2xs">
                <span className="w-7 h-7 rounded-xl bg-[#C84200]/10 text-[#C84200] flex items-center justify-center shrink-0">
                  <ScanBarcode className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#C84200]">
                    STAGE 01
                  </p>
                  <p className="text-xs font-bold text-[#1D1D1F] truncate">
                    Instant ISBN Scan
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white/85 backdrop-blur-xs border border-[#1D1D1F]/10 rounded-2xl px-3.5 py-2.5 shadow-2xs">
                <span className="w-7 h-7 rounded-xl bg-[#1D1D1F]/5 text-[#1D1D1F] flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#86868b]">
                    STAGE 02
                  </p>
                  <p className="text-xs font-bold text-[#1D1D1F] truncate">
                    Edition & Condition
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white/85 backdrop-blur-xs border border-[#1D1D1F]/10 rounded-2xl px-3.5 py-2.5 shadow-2xs">
                <span className="w-7 h-7 rounded-xl bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#0066cc]">
                    STAGE 03
                  </p>
                  <p className="text-xs font-bold text-[#1D1D1F] truncate">
                    Mode & Map Pin
                  </p>
                </div>
              </div>
            </div>
          </div>
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
