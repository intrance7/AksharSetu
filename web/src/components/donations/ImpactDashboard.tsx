"use client"

import Link from "next/link"
import { Donation, Campaign, Book } from "@prisma/client"
import { motion } from "framer-motion"
import {
  BookOpen,
  CheckCircle,
  Package,
  Truck,
  Building2,
  HeartHandshake,
  Award,
} from "lucide-react"

type DonationWithDetails = Donation & {
  campaign: Campaign | null
  book: Book | null
}

interface ImpactDashboardProps {
  donations: DonationWithDetails[]
}

const STATUS_STEPS = [
  { status: "DONATED", label: "Donated", icon: BookOpen },
  { status: "COLLECTED", label: "Collected", icon: Package },
  { status: "VERIFIED", label: "Verified", icon: CheckCircle },
  { status: "SENT_TO_NGO", label: "Sent", icon: Truck },
  { status: "RECEIVED", label: "At NGO", icon: Building2 },
  { status: "DISTRIBUTED", label: "Distributed", icon: HeartHandshake },
]

export function ImpactDashboard({ donations }: ImpactDashboardProps) {
  return (
    <div className="space-y-6">
      {donations.map((donation, index) => {
        const currentStepIndex = Math.max(
          0,
          STATUS_STEPS.findIndex((s) => s.status === donation.status)
        )

        return (
          <motion.div
            key={donation.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.08,
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_6px_28px_rgba(29,29,31,0.04)] border border-[#1D1D1F]/[0.07]"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h3 className="text-xl font-black tracking-tight text-[#1D1D1F]">
                  {donation.book?.title || "Vidya Daan Book Pledge"}
                </h3>
                <p className="text-[#6e6e73] text-sm font-medium mt-1">
                  {donation.campaign
                    ? `Donated to: ${donation.campaign.title} (${donation.campaign.ngoName})`
                    : "Donated to General Literacy Pool"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] px-4 py-2.5 rounded-2xl">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#86868b] block">
                    Tracking ID
                  </span>
                  <span className="text-[13px] font-mono font-bold text-[#1D1D1F] break-all">
                    {donation.trackingId}
                  </span>
                </div>
                <Link
                  href={`/donations/track/${donation.trackingId}`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-[13px] font-bold transition-colors shadow-sm"
                >
                  <Award className="w-4 h-4" /> Official Certificate →
                </Link>
              </div>
            </div>

            {/* 6-Stage Progress Tracker */}
            <div className="relative overflow-x-auto pb-2">
              <div className="min-w-[540px] relative">
                <div className="absolute top-5 left-6 right-6 h-1 bg-[#FAF6F0] rounded-full -z-10" />
                <div
                  className="absolute top-5 left-6 h-1 bg-[#0A7D4F] rounded-full -z-10 transition-all duration-700"
                  style={{
                    width:
                      currentStepIndex === 0
                        ? "0px"
                        : `calc(${
                            (currentStepIndex / (STATUS_STEPS.length - 1)) * 100
                          }% - 3rem)`,
                  }}
                />

                <div className="flex justify-between relative z-10">
                  {STATUS_STEPS.map((step, i) => {
                    const Icon = step.icon
                    const isCompleted = i <= currentStepIndex
                    const isCurrent = i === currentStepIndex

                    return (
                      <div
                        key={step.status}
                        className="flex flex-col items-center gap-2.5"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500 ${
                            isCompleted
                              ? "bg-[#0A7D4F] text-white shadow-md"
                              : "bg-[#FAF6F0] text-[#86868b]/50 border border-[#1D1D1F]/[0.08]"
                          } ${isCurrent ? "ring-4 ring-[#0A7D4F]/20" : ""}`}
                        >
                          <Icon size={17} />
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            isCompleted ? "text-[#1D1D1F]" : "text-[#86868b]"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {donation.status === "DISTRIBUTED" && (
              <div className="mt-6 bg-[#0A7D4F]/[0.08] text-[#0A7D4F] p-4 rounded-2xl text-sm font-medium flex items-center gap-3 border border-[#0A7D4F]/20">
                <HeartHandshake className="text-[#0A7D4F] shrink-0 w-5 h-5" />
                <p>
                  <strong>Impact Complete!</strong> Your book has been placed in
                  a student&apos;s hands. Download your verified Vidya Daan
                  Impact Certificate above.
                </p>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
