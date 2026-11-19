"use client"

import { Campaign } from "@prisma/client"
import { motion } from "framer-motion"
import Link from "next/link"
import { Calendar, ArrowUpRight } from "lucide-react"
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
      className="group bg-white rounded-3xl p-6 sm:p-7 shadow-[0_4px_20px_rgba(29,29,31,0.04)] border border-[#1D1D1F]/[0.07] flex flex-col h-full hover:-translate-y-1 hover:shadow-[0_22px_48px_-14px_rgba(29,29,31,0.12)] hover:border-[#C84200]/30 transition-all duration-300"
    >
      <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
        <span className="bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] text-xs font-bold px-3.5 py-1 rounded-full text-[#1D1D1F]">
          {campaign.ngoName}
        </span>
        <span
          className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
            campaign.status === "ACTIVE"
              ? "bg-[#0A7D4F]/10 text-[#0A7D4F] border border-[#0A7D4F]/20"
              : "bg-[#FAF6F0] text-[#6e6e73]"
          }`}
        >
          {campaign.status}
        </span>
      </div>

      <h3 className="text-xl font-black tracking-tight leading-snug mb-2.5 text-[#1D1D1F] group-hover:text-[#C84200] transition-colors line-clamp-2">
        {campaign.title}
      </h3>
      <p className="text-[#6e6e73] text-[15px] mb-6 line-clamp-3 flex-grow leading-relaxed">
        {campaign.description}
      </p>

      <div className="mb-6 space-y-2.5 bg-[#FAF6F0] rounded-2xl p-4 border border-[#1D1D1F]/[0.05]">
        <div className="flex justify-between text-[13px] font-bold text-[#1D1D1F]">
          <span className="font-mono">{campaign.currentBooks} Donated</span>
          <span className="font-mono text-[#6e6e73]">
            {Math.round(progress)}% of {campaign.targetBooks}
          </span>
        </div>
        <div className="h-2.5 w-full bg-white rounded-full overflow-hidden border border-[#1D1D1F]/[0.06]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-gradient-to-r from-[#C84200] to-[#FF7F45] rounded-full"
          />
        </div>
      </div>

      <div className="flex justify-between items-center text-[13px] text-[#6e6e73] mb-6">
        <div className="flex items-center gap-1.5 font-medium">
          <Calendar className="w-4 h-4 text-[#C84200]" />
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
        className="inline-flex items-center justify-center gap-1.5 w-full bg-[#1D1D1F] hover:bg-[#C84200] text-white px-5 py-3.5 rounded-full text-sm font-bold transition-colors"
      >
        Donate to Campaign <ArrowUpRight className="w-4 h-4" />
      </Link>
    </motion.div>
  )
}
