"use client"

import { Campaign } from "@prisma/client"
import { motion } from "framer-motion"
import Link from "next/link"
import { Calendar, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface CampaignCardProps {
  campaign: Campaign
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const progress = Math.min((campaign.currentBooks / campaign.targetBooks) * 100, 100)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <span className="bg-[#e8e8ed] text-xs font-semibold px-3 py-1 rounded-full text-[#1d1d1f]">
          {campaign.ngoName}
        </span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {campaign.status}
        </span>
      </div>
      
      <h3 className="text-xl font-bold tracking-tight mb-2 text-[#1d1d1f] line-clamp-2">
        {campaign.title}
      </h3>
      <p className="text-[#86868b] text-sm mb-6 line-clamp-3 flex-grow">
        {campaign.description}
      </p>

      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-sm font-medium text-[#1d1d1f]">
          <span>{campaign.currentBooks} Donated</span>
          <span>{campaign.targetBooks} Goal</span>
        </div>
        <div className="h-2 w-full bg-[#f5f5f7] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-[#0066cc]"
          />
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-[#86868b] mb-6">
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          <span>Started {formatDistanceToNow(new Date(campaign.startDate), { addSuffix: true })}</span>
        </div>
      </div>

      <Link 
        href={`/catalog/new?type=donation&campaignId=${campaign.id}`}
        className="block text-center w-full bg-[#1d1d1f] hover:bg-black text-white px-4 py-3 rounded-full font-medium transition-colors"
      >
        Donate to Campaign
      </Link>
    </motion.div>
  )
}
