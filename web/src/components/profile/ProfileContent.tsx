"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Book as BookIcon, Award, Library, Search, LayoutGrid, List as ListIcon, MoreHorizontal, Plus } from "lucide-react"
import { BookCard } from "../catalog/BookCard"
import { Book } from "@prisma/client"

// Types matching what we fetch from Prisma
type Badge = { id: string, name: string, iconUrl: string, description: string };
type UserBadge = { badge: Badge, earnedAt: Date };

interface ProfileContentProps {
  books: (Book & { owner?: { latitude: number | null, longitude: number | null, location: string | null } })[];
  badges: UserBadge[];
  libraryBooks: { id: string, title: string, coverImage: string | null }[];
}

type TabType = 'listings' | 'badges' | 'library';

export function ProfileContent({ books, badges, libraryBooks }: ProfileContentProps) {
  const [activeTab, setActiveTab] = useState<TabType>('listings');
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'listings', label: 'My Listings', icon: BookIcon, count: books.length },
    { id: 'badges', label: 'Badges', icon: Award, count: badges.length },
    { id: 'library', label: 'Library', icon: Library, count: libraryBooks.length },
  ] as const;

  return (
    <div className="mt-8 z-10 relative">
      {/* Header Actions Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`relative px-4 py-2 rounded-full font-bold text-[15px] flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? "text-[#C84200]" 
                  : "text-[#86868b] hover:text-[#1d1d1f]"
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="profile-tab-underline"
                  className="absolute left-4 right-4 -bottom-3 h-0.5 bg-[#C84200] rounded-t-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={`ml-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                activeTab === tab.id ? "bg-[#FFF8F0] text-[#C84200]" : "bg-[#1d1d1f]/5 text-[#86868b]"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        
        <div className="w-full md:w-auto h-px bg-[#1d1d1f]/10 md:hidden" />

        {/* Search & View Toggles */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
            <input 
              type="text"
              placeholder="Search your books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#1d1d1f]/10 rounded-full pl-10 pr-4 py-2 text-sm font-medium text-[#1d1d1f] focus:outline-none focus:border-[#C84200]/30 focus:ring-2 focus:ring-[#C84200]/10 transition-all placeholder:text-[#86868b]/60"
            />
          </div>
          <div className="flex items-center bg-[#1d1d1f]/5 p-1 rounded-full">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-[#C84200] text-white shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-[#C84200] text-white shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      <div className="w-full h-px bg-[#1d1d1f]/5 mb-8 hidden md:block -mt-8" />

      {/* Grid Content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'listings' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {books.map(book => (
                  <BookCard key={book.id} book={book} />
                ))}

                {/* Add New Book Card */}
                <a href="/catalog/new" className="group bg-transparent rounded-2xl border-2 border-dashed border-[#1d1d1f]/15 hover:border-[#C84200]/40 hover:bg-white transition-all duration-300 flex flex-col items-center justify-center h-[320px] text-center p-6 cursor-pointer">
                  <div className="w-12 h-12 rounded-full border-2 border-[#1d1d1f]/20 flex items-center justify-center text-[#1d1d1f]/50 group-hover:border-[#C84200] group-hover:text-[#C84200] group-hover:bg-[#FFF8F0] transition-colors mb-4">
                    <Plus className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-[#1d1d1f] text-[15px] mb-1">Add New Book</h3>
                  <p className="text-xs font-medium text-[#86868b]">List a book to give it <br/>a new home.</p>
                </a>
              </div>
            )}

            {activeTab === 'badges' && (
              badges.length === 0 ? (
                <EmptyState icon={Award} message="No badges earned yet. Start reading and donating!" />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {badges.map(({ badge, earnedAt }, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 flex flex-col items-center text-center shadow-sm border border-[#1d1d1f]/5 hover:-translate-y-1 transition-transform duration-300">
                      <div className="w-16 h-16 rounded-full bg-[#FFF8F0] border border-[#E8B27A]/30 flex items-center justify-center mb-4 text-3xl shadow-inner">
                        {badge.iconUrl}
                      </div>
                      <h3 className="font-bold text-[#1d1d1f] mb-1 text-sm">{badge.name}</h3>
                      <p className="text-[11px] text-[#86868b]">{badge.description}</p>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'library' && (
              libraryBooks.length === 0 ? (
                <EmptyState icon={Library} message="Library is empty." />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-6">
                  {libraryBooks.map(book => (
                    <div key={book.id} className="group flex flex-col gap-3 cursor-pointer">
                      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-[#e8e8ed] shadow-sm border border-[#1d1d1f]/5 group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                        {book.coverImage ? (
                          <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-4 text-center font-bold text-[#1d1d1f]/40">
                            {book.title}
                          </div>
                        )}
                      </div>
                      <p className="font-bold text-sm text-[#1d1d1f] truncate px-1">{book.title}</p>
                    </div>
                  ))}
                </div>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: any, message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-3xl border-2 border-dashed border-[#1d1d1f]/10">
      <div className="w-16 h-16 bg-[#F2EBE1] rounded-full flex items-center justify-center mb-4 text-[#86868b]">
        <Icon className="w-8 h-8" />
      </div>
      <p className="font-bold text-[#1d1d1f]/60 text-base">{message}</p>
    </div>
  )
}
