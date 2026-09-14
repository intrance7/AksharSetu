import Link from "next/link"
import { BookOpen, Search, MapPin, Heart, BookCopy } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="w-full bg-blue-50 py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2 max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-gray-900">
                Bridge Knowledge Through Books
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl">
                Buy, sell, or donate books in your local community. Make knowledge accessible to everyone with AksharSetu.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2 mt-8">
              <form className="flex w-full items-center space-x-2">
                <Input
                  className="w-full bg-white"
                  placeholder="Find a book by title or author..."
                  type="search"
                />
                <Button type="submit">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </form>
            </div>
            <div className="flex gap-4 mt-8">
              <Button size="lg" asChild>
                <Link href="/catalog">Browse Catalog</Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link href="/donate">Donate a Book</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-lg bg-gray-50">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Hyperlocal Discovery</h3>
              <p className="text-gray-500">
                Find books in your own city or neighborhood. Meet up locally and save on shipping costs.
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-lg bg-gray-50">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                <Heart className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Vidya Daan</h3>
              <p className="text-gray-500">
                Donate your old books to students or NGOs. Earn digital badges and build community goodwill.
              </p>
            </div>

            <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-lg bg-gray-50">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                <BookCopy className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Bundle Listings</h3>
              <p className="text-gray-500">
                Sell or donate an entire semester's worth of textbooks or a complete fiction series in one go.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Listings Placeholder */}
      <section className="w-full py-12 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Recently Added Books</h2>
            <Button variant="link" asChild>
              <Link href="/catalog">View All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="aspect-[3/4] bg-gray-200 flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-gray-400" />
                </div>
                <div className="flex flex-col gap-1 p-4">
                  <span className="font-medium line-clamp-1">Sample Book Title {item}</span>
                  <span className="text-sm text-gray-500">Author Name</span>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-semibold">{item % 2 === 0 ? "₹150" : "Donate"}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Mumbai
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
