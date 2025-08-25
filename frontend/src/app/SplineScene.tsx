"use client"

import Spline from "@splinetool/react-spline"
import { useMemo } from "react"

type SplineSceneProps = {
	sceneUrl?: string
	className?: string
}

export default function SplineScene({ sceneUrl, className }: SplineSceneProps) {
	const url = useMemo(() => {
		return sceneUrl || process.env.NEXT_PUBLIC_SPLINE_SCENE_URL || ""
	}, [sceneUrl])

	return (
		<div className={className}>
			<Spline scene={url} />
		</div>
	)
}
