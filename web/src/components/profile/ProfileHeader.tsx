import { MapPin, Clock, BookOpen, Award, Shield, Pencil, Quote, ChevronRight } from "lucide-react"

interface ProfileHeaderProps {
  user: {
    name: string | null;
    image: string | null;
    bio: string | null;
    location: string | null;
    liveStatus: string | null;
    isShantiModeActive: boolean;
  };
  stats: {
    booksListed: number;
    booksDonated: number;
    badgesEarned: number;
    readingMinutes: number;
  };
}

export function ProfileHeader({ user, stats }: ProfileHeaderProps) {
  // Gamification: Calculate Level (Every 10 books/donations + reading hours = XP)
  const totalXP = (stats.booksListed * 50) + (stats.booksDonated * 100) + (stats.readingMinutes * 2);
  const currentLevel = Math.floor(totalXP / 500) + 1;
  const xpIntoLevel = totalXP % 500;
  const progressPercent = (xpIntoLevel / 500) * 100;

  return (
    <div className="bg-white p-8 md:p-10 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#1d1d1f]/5 w-full relative">
      
      {/* Top Section */}
      <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-12 mb-10">
        
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Avatar Area */}
          <div className="relative shrink-0 mt-2">
            {/* Decorative semi-circle ring */}
            <div className="absolute -inset-3 border-[6px] border-[#E8B27A] rounded-full border-b-transparent border-r-transparent transform -rotate-45" />
            
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-[#1D1D1F] relative flex items-center justify-center shadow-md">
              {user.image ? (
                <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-black text-[#F2EBE1]">{user.name?.charAt(0).toUpperCase() || "?"}</span>
              )}
            </div>
            
            {/* Level Pill */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#C84200] text-white px-5 py-1 rounded-full font-black text-[11px] uppercase tracking-widest shadow-md whitespace-nowrap">
              LVL {currentLevel}
            </div>

            {/* Pencil Icon */}
            <button className="absolute bottom-2 -right-1 bg-white p-2 rounded-full shadow-md border border-[#1d1d1f]/5 text-[#C84200] hover:bg-gray-50 transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-8 h-8 flex items-center justify-center hover:-translate-y-1 hover:scale-110 hover:drop-shadow-lg transition-transform duration-300 cursor-default">
                 <img src="/doodle-smile.png" alt="smile" className="w-full h-full object-contain" />
              </span>
              <span className="text-[#86868b] font-bold text-lg">Hello,</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-[#1D1D1F] tracking-tighter mb-3 flex flex-wrap items-center gap-4" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {user.name || "Anonymous Reader"}
              {user.isShantiModeActive && (
                <span className="shrink-0 inline-flex items-center gap-1.5 bg-[#FFF8F0] border border-[#E8B27A]/50 px-3 py-1 rounded-full text-xs font-bold text-[#C84200]">
                  <span className="w-2 h-2 rounded-full bg-[#C84200] animate-pulse" />
                  {user.liveStatus || "Reading peacefully..."}
                </span>
              )}
            </h1>

            <p className="text-[#86868b] font-medium text-[15px] max-w-[45ch] leading-relaxed mb-4">
              {user.bio || "Building a kinder world, one book at a time."}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#1D1D1F]">
              {user.location && (
                <span className="flex items-center gap-1.5 bg-[#F2EBE1] border border-[#1d1d1f]/10 px-4 py-2 rounded-full">
                  <MapPin className="w-3.5 h-3.5 text-[#C84200]" /> {user.location}
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-[#F2EBE1] border border-[#1d1d1f]/10 px-4 py-2 rounded-full">
                <Shield className="w-3.5 h-3.5 text-[#C84200]" /> Verified Reader
              </span>
            </div>
          </div>
        </div>

        {/* Right Info Section */}
        <div className="relative flex-1 md:max-w-xs flex flex-col justify-between items-end">
          <button className="hidden md:flex items-center gap-2 bg-[#F2EBE1] border border-[#1d1d1f]/10 px-5 py-2 rounded-full text-sm font-bold text-[#1D1D1F] hover:bg-gray-100 transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Edit Profile
          </button>

          <div className="relative mt-8 md:mt-0 w-full pl-6 transform rotate-2">
            <Quote className="absolute left-0 -top-2 w-10 h-10 text-[#C84200]/20 transform -translate-x-4 -rotate-12" />
            <p className="font-['Caveat'] text-3xl md:text-4xl text-[#1D1D1F] leading-tight font-bold">
              "A reader lives a thousand lives before they die."
            </p>
            <p className="text-[13px] font-black text-[#86868b] uppercase tracking-widest mt-3 ml-4">
              — George R.R. Martin
            </p>
            
            {/* Small decorative CSS plant/books removed for a cleaner look */}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-[#1d1d1f]/5 mb-8" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 relative z-10 mb-10">
        
        <div className="flex flex-col md:border-r border-[#1d1d1f]/5 px-2">
          <span className="text-[#86868b] font-black text-[11px] uppercase tracking-widest mb-1 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#C84200]" /> Books
          </span>
          <span className="text-4xl font-black text-[#1D1D1F] tracking-tight">{stats.booksListed}</span>
          <span className="text-xs font-medium text-[#86868b] mt-1">In your library</span>
        </div>
        
        <div className="flex flex-col md:border-r border-[#1d1d1f]/5 px-2">
          <span className="text-[#86868b] font-black text-[11px] uppercase tracking-widest mb-1 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#C84200]" /> Donated
          </span>
          <span className="text-4xl font-black text-[#1D1D1F] tracking-tight">{stats.booksDonated}</span>
          <span className="text-xs font-medium text-[#86868b] mt-1">Books given a new home</span>
        </div>
        
        <div className="flex flex-col md:border-r border-[#1d1d1f]/5 px-2">
          <span className="text-[#86868b] font-black text-[11px] uppercase tracking-widest mb-1 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#C84200]" /> Badges
          </span>
          <span className="text-4xl font-black text-[#1D1D1F] tracking-tight">{stats.badgesEarned}</span>
          <span className="text-xs font-medium text-[#86868b] mt-1">Keep reading to earn badges</span>
        </div>
        
        <div className="flex flex-col px-2">
          <span className="text-[#86868b] font-black text-[11px] uppercase tracking-widest mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C84200]" /> Reading
          </span>
          <span className="text-4xl font-black text-[#1D1D1F] tracking-tight">
            {Math.floor(stats.readingMinutes / 60)}<span className="text-lg text-[#1d1d1f]/40 ml-0.5">h</span> {stats.readingMinutes % 60}<span className="text-lg text-[#1d1d1f]/40 ml-0.5">m</span>
          </span>
          <span className="text-xs font-medium text-[#86868b] mt-1">This month</span>
        </div>

      </div>

      {/* XP Bar */}
      <div className="relative mt-8 pt-4">
        <div className="flex justify-between text-xs font-black uppercase tracking-widest text-[#1D1D1F] mb-3">
          <span className="flex items-center gap-2">
            <span className="w-6 h-6 flex items-center justify-center hover:-translate-y-1 hover:scale-110 hover:drop-shadow-lg transition-transform duration-300 cursor-default">
               <img src="/doodle-star.png" alt="star" className="w-full h-full object-contain" />
            </span> 
            Level {currentLevel}
          </span>
          <span className="text-[#86868b] flex items-center gap-1">{xpIntoLevel} / 500 XP to Next Level <ChevronRight className="w-3.5 h-3.5" /></span>
        </div>
        <div className="h-2.5 w-full bg-[#F2EBE1] rounded-full overflow-hidden border border-[#1d1d1f]/5">
          <div 
            className="h-full bg-[#C84200] rounded-full transition-all duration-1000 ease-out shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        {/* Read Share Grow graphic removed for a cleaner look */}
      </div>

    </div>
  )
}
