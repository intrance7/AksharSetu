import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ScanBarcode,
  SlidersHorizontal,
  MapPin,
  BookOpen,
} from "lucide-react"
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
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      {/* Full-Bleed Obsidian Editorial Publishing Studio Hero */}
      <section className="relative bg-[#0B0B0D] text-[#F5F5F7] border-b border-white/10 overflow-hidden">
        {/* Warm saffron ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 65% 80% at 85% 15%, rgba(200,66,0,0.22), transparent 60%), radial-gradient(ellipse 50% 60% at 10% 90%, rgba(244,178,43,0.08), transparent 55%)",
          }}
        />
        {/* Subtle editorial dot-grid matching Catalog & Profile */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="container max-w-6xl mx-auto px-4 md:px-6 pt-8 pb-16 md:pt-10 md:pb-20 relative z-10">
          {/* Top Breadcrumb + Studio Label */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-7">
            <Link
              href={campaign ? "/donations" : "/catalog"}
              className="inline-flex items-center gap-2 text-white/65 hover:text-[#FF8A4C] transition-colors font-semibold text-xs sm:text-sm w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              {campaign ? "Back to Vidya Daan Campaigns" : "Back to Catalog"}
            </Link>

            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.08] border border-white/15 text-[11px] font-black uppercase tracking-[0.18em] text-[#FF8A4C]">
              <BookOpen className="w-3.5 h-3.5" />
              {isDonationMode
                ? "Vidya Daan · Pledge Studio"
                : bundleParam
                  ? "Campus Hub · Semester Pack"
                  : "AksharSetu · Publishing Studio"}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[0.98] text-white mb-4">
                {isDonationMode ? (
                  <>
                    Donate a{" "}
                    <span className="font-serif italic font-semibold text-[#FF7F45]">
                      Book
                    </span>{" "}
                    Forward.
                  </>
                ) : (
                  <>
                    Pass a{" "}
                    <span className="font-serif italic font-semibold text-[#FF7F45]">
                      Book
                    </span>{" "}
                    On.
                  </>
                )}
              </h1>
              <p className="text-base sm:text-lg text-white/65 font-medium leading-relaxed">
                {isDonationMode
                  ? "Pledge a textbook or novel to a verified NGO classroom drive — complete with a 6-stage chain-of-custody tracking ID."
                  : "Scan the ISBN barcode, grade the spine and margins honestly, and place your edition on the campus shelf in under a minute."}
              </p>
            </div>

            {/* Crisp 3-Stage Editorial Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full lg:w-auto shrink-0">
              <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 backdrop-blur-xs">
                <span className="w-8 h-8 rounded-xl bg-[#C84200]/25 text-[#FF8A4C] flex items-center justify-center shrink-0">
                  <ScanBarcode className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF8A4C]">
                    Step 01
                  </p>
                  <p className="text-xs font-bold text-white truncate">
                    Scan or Type ISBN
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 backdrop-blur-xs">
                <span className="w-8 h-8 rounded-xl bg-white/10 text-[#F4B22B] flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F4B22B]">
                    Step 02
                  </p>
                  <p className="text-xs font-bold text-white truncate">
                    Edition &amp; Grade
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 backdrop-blur-xs">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-300">
                    Step 03
                  </p>
                  <p className="text-xs font-bold text-white truncate">
                    Mode &amp; Map Pin
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Studio Workspace (elevated overlap) */}
      <div className="container max-w-6xl mx-auto px-4 md:px-6 -mt-8 relative z-20">
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
