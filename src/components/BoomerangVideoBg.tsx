import React, { useEffect, useRef } from 'react';

interface BoomerangVideoBgProps {
  src: string;
  className?: string;
}

/**
 * Background video. Renders a native looping <video> — the reliable way to show
 * an ambient background loop: it streams immediately, loops seamlessly, and
 * (unlike a canvas frame-recorder) has no cross-origin canvas-tainting or
 * createImageBitmap support issues. Muted + inline + autoplay so browser
 * autoplay policies allow it to start on its own; a programmatic play() call
 * covers the cases where the `autoPlay` attribute alone doesn't fire.
 */
export default function BoomerangVideoBg({ src, className }: BoomerangVideoBgProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Some browsers ignore the autoPlay attribute until a play() is invoked.
    const tryPlay = () => video.play().catch(() => {});
    tryPlay();
    video.addEventListener('canplay', tryPlay, { once: true });
    return () => video.removeEventListener('canplay', tryPlay);
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
    />
  );
}
