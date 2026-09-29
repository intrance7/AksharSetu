"use client"

import { Donation, Campaign, Book } from "@prisma/client"
import { motion } from "framer-motion"
import { BookOpen, CheckCircle, Package, Truck, HeartHandshake } from "lucide-react"

type DonationWithDetails = Donation & {
  campaign: Campaign | null
  book: Book | null
}

interface ImpactDashboardProps {
  donations: DonationWithDetails[]
}

const STATUS_STEPS = [
  { status: 'DONATED', label: 'Donated', icon: BookOpen },
  { status: 'COLLECTED', label: 'Collected', icon: Package },
  { status: 'VERIFIED', label: 'Verified', icon: CheckCircle },
  { status: 'SENT_TO_NGO', label: 'Sent', icon: Truck },
  { status: 'DISTRIBUTED', label: 'Distributed', icon: HeartHandshake }
]

export function ImpactDashboard({ donations }: ImpactDashboardProps) {
  
  return (
    <div className="space-y-6">
      {donations.map((donation, index) => {
        const currentStepIndex = STATUS_STEPS.findIndex(s => s.status === donation.status)
        
        return (
          <motion.div 
            key={donation.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">
                  {donation.book?.title || "Book Donation"}
                </h3>
                <p className="text-[#86868b] text-sm mt-1">
                  {donation.campaign ? `Donated to: ${donation.campaign.title}` : "Donated to General Pool"}
                </p>
              </div>
              <div className="bg-[#f5f5f7] px-4 py-2 rounded-lg">
                <span className="text-xs text-[#86868b] block mb-1">Tracking ID</span>
                <span className="text-sm font-mono font-bold text-[#1d1d1f]">{donation.trackingId}</span>
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="relative">
              {/* Connecting Line */}
              <div className="absolute top-5 left-6 right-6 h-1 bg-[#f5f5f7] rounded-full -z-10" />
              <div 
                className="absolute top-5 left-6 h-1 bg-[#0066cc] rounded-full -z-10 transition-all duration-700"
                style={{ width: `calc(${(Math.max(0, currentStepIndex) / (STATUS_STEPS.length - 1)) * 100}% - 3rem)` }}
              />

              <div className="flex justify-between relative z-10">
                {STATUS_STEPS.map((step, i) => {
                  const Icon = step.icon
                  const isCompleted = i <= currentStepIndex
                  const isCurrent = i === currentStepIndex

                  return (
                    <div key={step.status} className="flex flex-col items-center gap-3">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500
                          ${isCompleted ? 'bg-[#0066cc] text-white shadow-md' : 'bg-white text-gray-300 border-2 border-gray-100'}
                          ${isCurrent ? 'ring-4 ring-blue-100' : ''}
                        `}
                      >
                        <Icon size={18} />
                      </div>
                      <span className={`text-xs font-semibold ${isCompleted ? 'text-[#1d1d1f]' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {donation.status === 'DISTRIBUTED' && (
               <div className="mt-8 bg-green-50 text-green-800 p-4 rounded-xl text-sm flex items-center gap-3 border border-green-100">
                  <HeartHandshake className="text-green-600" />
                  <p><strong>Thank you!</strong> Your book has reached someone in need. You've made a direct impact on their education.</p>
               </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
