import type { Metadata } from "next"
import { GuidelinesContent } from "@/components/guidelines-content"

export const metadata: Metadata = {
  title: "Community Guidelines | Peeak",
  description: "Share the Peeak moments of life",
}

export default function GuidelinesPage() {
  return <GuidelinesContent />
}
