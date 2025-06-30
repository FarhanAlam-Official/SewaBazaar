import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const alt = 'SewaBazaar'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 'bold',
            background: 'white',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          SewaBazaar
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
} 