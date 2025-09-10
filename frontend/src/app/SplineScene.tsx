"use client"

import Spline from "@splinetool/react-spline"
import { useMemo, useState, useEffect } from "react"

type SplineSceneProps = {
	sceneUrl?: string
	className?: string
}

export default function SplineScene({ sceneUrl, className }: SplineSceneProps) {
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	const url = useMemo(() => {
		return sceneUrl || process.env.NEXT_PUBLIC_SPLINE_SCENE_URL || ""
	}, [sceneUrl])

	// Don't render on server to prevent hydration mismatches
	if (!isClient) {
		return <div className={className} />
	}

	return (
		<div className={className}>
			<Spline scene={url} />
			<style jsx global>{`
				.spline-runtime-canvas-wrapper .spline-badge {
					display: none !important;
				}
				.spline-runtime-canvas-wrapper {
					transform: translateX(80px);
				}
			`}</style>
		</div>
	)
}