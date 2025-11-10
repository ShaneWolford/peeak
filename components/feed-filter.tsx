"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FeedFilterProps {
  currentFilter: string
}

export function FeedFilter({ currentFilter }: FeedFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    if (value === "all") {
      params.delete("filter")
    } else {
      params.set("filter", value)
    }
    const query = params.toString()
    router.push(query ? `/feed?${query}` : "/feed")
    router.refresh()
  }

  return (
    <div className="border-b border-border bg-card sticky top-14 md:top-0 z-10">
      <Tabs value={currentFilter} onValueChange={handleFilterChange} className="w-full">
        <TabsList className="w-full justify-start rounded-none bg-transparent h-12 p-0 border-0">
          <TabsTrigger
            value="all"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full"
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="following"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full"
          >
            Following
          </TabsTrigger>
          <TabsTrigger
            value="pro"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full"
          >
            Pro
          </TabsTrigger>
          <TabsTrigger
            value="media"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full"
          >
            Media
          </TabsTrigger>
          <TabsTrigger
            value="polls"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full"
          >
            Polls
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
