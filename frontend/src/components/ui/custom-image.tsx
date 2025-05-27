import Image, { ImageProps } from 'next/image'
import { forwardRef } from 'react'

type CustomImageProps = Omit<ImageProps, 'fetchPriority'> & {
  fetchpriority?: 'high' | 'low' | 'auto'
}

const CustomImage = forwardRef<HTMLImageElement, CustomImageProps>((props, ref) => {
  const { fetchpriority, ...rest } = props
  return <Image {...rest} ref={ref as any} />
})

CustomImage.displayName = 'CustomImage'

export { CustomImage } 