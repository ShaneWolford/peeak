export const runtime = "edge"

export const size = {
  width: 32,
  height: 32,
}

export const contentType = "image/png"

export default async function Icon() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/favicon-light.png",
    },
  })
}
