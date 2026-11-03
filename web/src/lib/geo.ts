const CITY_FALLBACKS: Array<{ match: string; lat: number; lng: number }> = [
  { match: "mumbai", lat: 19.076, lng: 72.8777 },
  { match: "delhi", lat: 28.6139, lng: 77.209 },
  { match: "new delhi", lat: 28.6139, lng: 77.209 },
  { match: "gurugram", lat: 28.4595, lng: 77.0266 },
  { match: "gurgaon", lat: 28.4595, lng: 77.0266 },
  { match: "noida", lat: 28.5355, lng: 77.391 },
  { match: "bengaluru", lat: 12.9716, lng: 77.5946 },
  { match: "bangalore", lat: 12.9716, lng: 77.5946 },
  { match: "pune", lat: 18.5204, lng: 73.8567 },
  { match: "hyderabad", lat: 17.385, lng: 78.4867 },
  { match: "chennai", lat: 13.0827, lng: 80.2707 },
  { match: "kolkata", lat: 22.5726, lng: 88.3639 },
  { match: "jaipur", lat: 26.9124, lng: 75.7873 },
  { match: "ahmedabad", lat: 23.0225, lng: 72.5714 },
  { match: "chandigarh", lat: 30.7333, lng: 76.7794 },
  { match: "lucknow", lat: 26.8467, lng: 80.9462 },
]

export function resolveBookCoordinates(
  book: any,
  index = 0
): [number, number] | null {
  let baseLat: number | null = book.owner?.latitude ?? null
  let baseLng: number | null = book.owner?.longitude ?? null

  if ((!baseLat || !baseLng) && typeof book.owner?.location === "string") {
    const lower = book.owner.location.toLowerCase()
    const matched = CITY_FALLBACKS.find((c) => lower.includes(c.match))
    if (matched) {
      baseLat = matched.lat
      baseLng = matched.lng
    }
  }

  if (!baseLat || !baseLng) return null

  // Deterministic privacy-preserving radial offset (~120m) so same-owner pins don't overlap
  const seed = String(book.id || index)
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const angle = ((seed % 360) * Math.PI) / 180
  const radius = 0.0012 + (seed % 5) * 0.0004
  return [
    baseLat + Math.cos(angle) * radius,
    baseLng + Math.sin(angle) * radius,
  ]
}

