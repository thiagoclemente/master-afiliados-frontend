"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, Download, Link, Copy, Check, Loader2 } from "lucide-react";
import type { Video } from "@/services/video.service";

// Dynamic import for HLS.js to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let HlsModule: any = null;
if (typeof window !== 'undefined') {
  import('hls.js').then((module) => {
    HlsModule = module.default;
  });
}

interface VideoPlayerProps {
  videos: Video[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
}

export default function VideoPlayer({
  videos,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
  onLoadMore,
  hasMore
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showLinksPopup, setShowLinksPopup] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hlsRef = useRef<any>(null);
  const currentVideo = videos[currentIndex];

  // Function to get streaming URL (m3u8 file)
  const getStreamingUrl = () => {
    if (currentVideo.videoStreamingFiles && currentVideo.videoStreamingFiles.length > 0) {
      const m3u8File = currentVideo.videoStreamingFiles.find(file => file.ext === '.m3u8');
      return m3u8File?.url || null;
    }
    return null;
  };



  useEffect(() => {
    if (videoRef.current) {
      // Pause current video before changing
      videoRef.current.pause();
      setCurrentTime(0);
      setIsPlaying(false);
      
      // Destroy previous HLS instance if exists
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      // Force reload the video source
      videoRef.current.load();
    }
  }, [currentIndex]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (currentIndex < videos.length - 1) {
        onNext();
      } else if (hasMore) {
        onLoadMore();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, videos.length, hasMore, onNext, onLoadMore]);

  // Effect to handle streaming video setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !HlsModule) return;

    const streamingUrl = getStreamingUrl();
    
    if (streamingUrl && HlsModule.isSupported()) {
      // Use HLS.js for streaming
      hlsRef.current = new HlsModule();
      hlsRef.current.loadSource(streamingUrl);
      hlsRef.current.attachMedia(video);
      
      hlsRef.current.on(HlsModule.Events.MANIFEST_PARSED, () => {
        // Video is ready to play
        console.log('HLS manifest loaded');
      });
      
      hlsRef.current.on(HlsModule.Events.ERROR, (event: unknown, data: unknown) => {
        console.error('HLS error:', data);
        // Fallback to regular video if HLS fails
        if (currentVideo.video?.url) {
          video.src = currentVideo.video.url;
        }
      });
    } else if (currentVideo.video?.url) {
      // Fallback to regular video
      video.src = currentVideo.video.url;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentIndex, currentVideo]);

  const togglePlay = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            setIsPlaying(true);
          }
        } catch {
          setIsPlaying(false);
        }
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    if (currentVideo.video?.url) {
      try {
        setIsDownloading(true);
        setDownloadProgress(0);
        
        // Fetch the video as blob to force download with progress
        const response = await fetch(currentVideo.video.url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        
        if (!response.body) {
          throw new Error('No response body');
        }
        
        const reader = response.body.getReader();
        const chunks: BlobPart[] = [];
        let receivedLength = 0;
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          chunks.push(value);
          receivedLength += value.length;
          
          if (total > 0) {
            const progress = (receivedLength / total) * 100;
            setDownloadProgress(Math.round(progress));
          }
        }
        
        // Combine chunks into blob
        const blob = new Blob(chunks, { type: 'video/mp4' });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Clean title for filename (remove special characters)
        const cleanTitle = (currentVideo.title || 'video')
          .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .trim();
        
        link.download = `${cleanTitle}.mp4`;
        link.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        window.URL.revokeObjectURL(url);
        
        // Reset progress
        setDownloadProgress(100);
        setTimeout(() => {
          setIsDownloading(false);
          setDownloadProgress(0);
        }, 1000);
        
      } catch (error) {
        console.error('Erro ao baixar vídeo:', error);
        setIsDownloading(false);
        setDownloadProgress(0);
        
        // Fallback to direct link if fetch fails
        const link = document.createElement('a');
        link.href = currentVideo.video.url;
        link.download = `${currentVideo.title || 'video'}.mp4`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const handleCopyLink = async (link: string, index: number) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar link:', err);
    }
  };

  const getProductLinks = () => {
    const links = [];
    if (currentVideo.link) {
      links.push(currentVideo.link);
    }
    return links;
  };

  const handleKeyDown = async (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        onPrevious();
        break;
      case 'ArrowRight':
        onNext();
        break;
      case ' ':
        e.preventDefault();
        await togglePlay();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  if (!currentVideo) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation Buttons */}
      <button
        onClick={onPrevious}
        disabled={currentIndex === 0}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={onNext}
        disabled={currentIndex === videos.length - 1 && !hasMore}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Video Container */}
      <div className="relative w-full max-w-md aspect-[9/16] bg-black rounded-lg overflow-hidden">
        <video
          key={currentVideo.documentId}
          ref={videoRef}
          className="w-full h-full object-cover"
          poster={currentVideo.coverImage?.url}
          onClick={togglePlay}
          controls={false}
        >
          Seu navegador não suporta o elemento de vídeo.
        </video>

        {/* Video Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-transparent to-transparent p-4">
          <h3 className="text-white font-semibold mb-2">{currentVideo.title}</h3>
          {currentVideo.category?.name && (
            <p className="text-gray-300 text-sm">{currentVideo.category.name}</p>
          )}
        </div>

        {/* Controls Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <button
            onClick={togglePlay}
            className="p-4 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-all"
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-16 left-4 right-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #7d570e 0%, #7d570e ${(currentTime / duration) * 100}%, #4a5568 ${(currentTime / duration) * 100}%, #4a5568 100%)`
            }}
          />
          <div className="flex justify-between text-white text-xs mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Download Progress Bar */}
        {isDownloading && (
          <div className="absolute bottom-20 left-4 right-4 bg-black bg-opacity-75 rounded-lg p-3">
            <div className="flex items-center justify-between text-white text-xs mb-2">
              <span>Baixando vídeo...</span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className="bg-[#7d570e] h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
          {/* Volume Control */}
          <button
            onClick={toggleMute}
            className="p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-all"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Download Button */}
          {currentVideo.video?.url && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="p-2 bg-[#7d570e] rounded-full text-white hover:bg-[#6b4a0c] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Links Button */}
          {getProductLinks().length > 0 && (
            <button
              onClick={() => setShowLinksPopup(true)}
              className="p-2 bg-[#7d570e] rounded-full text-white hover:bg-[#6b4a0c] transition-all"
            >
              <Link className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Video Counter */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-full px-3 py-1 text-white text-sm">
          {currentIndex + 1} / {videos.length}
        </div>
      </div>

      {/* Links Popup */}
      {showLinksPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="bg-black border border-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Links do Produto</h3>
              <button
                onClick={() => setShowLinksPopup(false)}
                className="p-2 text-[#7d570e] hover:text-[#6b4a0c] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="text-white font-medium mb-2">{currentVideo.title}</h4>
            </div>

            <div className="space-y-3">
              {getProductLinks().map((link, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{link}</p>
                  </div>
                  <button
                    onClick={() => handleCopyLink(link, index)}
                    className="ml-3 p-2 bg-[#7d570e] rounded-lg text-white hover:bg-[#6b4a0c] transition-colors flex-shrink-0"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 