import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  try {
    // Fetch the URL
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch URL")
    }

    const html = await response.text()

    // Extract Open Graph and meta tags
    const titleMatch =
      html.match(/<meta property="og:title" content="([^"]*)"/) || html.match(/<title>([^<]*)<\/title>/)
    const descriptionMatch =
      html.match(/<meta property="og:description" content="([^"]*)"/) ||
      html.match(/<meta name="description" content="([^"]*)">/)
    const imageMatch = html.match(/<meta property="og:image" content="([^"]*)"/)
    const siteNameMatch = html.match(/<meta property="og:site_name" content="([^"]*)"/)

    const preview = {
      title: titleMatch ? titleMatch[1] : undefined,
      description: descriptionMatch ? descriptionMatch[1] : undefined,
      image: imageMatch ? imageMatch[1] : undefined,
      siteName: siteNameMatch ? siteNameMatch[1] : undefined,
    }

    return NextResponse.json(preview)
  } catch (error) {
    console.error("[v0] Error fetching link preview:", error)
    return NextResponse.json({ error: "Failed to fetch preview" }, { status: 500 })
  }
}
