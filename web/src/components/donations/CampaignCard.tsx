"use client"

import { Campaign } from "@prisma/client"
import { motion } from "framer-motion"
import Link from "next/link"
import { Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface CampaignCardProps {
  campaign: Campaign
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const progress =
    campaign.targetBooks > 0
      ? Math.min((campaign.currentBooks / campaign.targetBooks) * 100, 100)
      : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.45 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 flex flex-col h-full hover:shadow-md hover:border-[#C84200]/25 transition-all"
    >
      <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
        <span className="bg-[#FAF6F0] border border-black/5 text-xs font-bold px-3 py-1 rounded-full text-[#1d1d1f]">
          {campaign.ngoName}
        </span>
        <span
          className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            campaign.status === "ACTIVE"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {campaign.status}
        </span>
      </div>

      <h3 className="text-xl font-black tracking-tight mb-2 text-[#1d1d1f] line-clamp-2">
        {campaign.title}
      </h3>
      <p className="text-[#86868b] text-sm mb-6 line-clamp-3 flex-grow leading-relaxed">
        {campaign.description}
      </p>

      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-xs font-bold text-[#1d1d1f]">
          <span>{campaign.currentBooks} Donated</span>
          <span className="text-[#86868b]">
            {Math.round(progress)}% of {campaign.targetBooks} Goal
          </span>
        </div>
        <div className="h-2 w-full bg-[#FAF6F0] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-[#C84200] rounded-full"
          />
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-[#86868b] mb-6">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} />
          <span>
            Started{" "}
            {formatDistanceToNow(new Date(campaign.startDate), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>

      <Link
        href={`/catalog/new?type=donation&campaignId=${campaign.id}`}
        className="block text-center w-full bg-[#1d1d1f] hover:bg-[#C84200] text-white px-4 py-3 rounded-full text-sm font-bold transition-colors"
      >
        Donate to Campaign
      </Link>
    </motion.div>
  )
}
