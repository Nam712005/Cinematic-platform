import Hls from 'hls.js';
import { AlertCircle, Film } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

function isHlsSource(source) {
  if (!source) return false;
  const fmt = String(source.format_type || '').toUpperCase();
  if (fmt === 'HLS' || fmt === 'M3U8') return true;
  return /\.m3u8(\?|$)/i.test(String(source.video_url || ''));
}

function isEmbedSource(source) {
  if (!source) return false;
  return String(source.format_type || '').toUpperCase() === 'EMBED';
}

export default function VideoPlayer({
  source,
  poster,
  pauseForResumeModal = false,
  seekCommand = null,
  onTimeSync,
  onPauseSync,
  onEndedSync,
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const lastPeriodicSyncRef = useRef(0);
  const [playerError, setPlayerError] = useState('');

  const embedMode = isEmbedSource(source);
  const hlsMode = !embedMode && isHlsSource(source);

  // Initialize HLS or MP4 stream
  useEffect(() => {
    setPlayerError('');
    lastPeriodicSyncRef.current = 0;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!source || embedMode || !videoRef.current) return undefined;

    const videoEl = videoRef.current;
    const url = source.video_url;

    if (hlsMode) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(videoEl);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data?.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              setPlayerError('Không thể tải luồng phát HLS từ máy chủ này. Vui lòng thử chuyển nguồn phát khác.');
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              setPlayerError('Nguồn phát HLS gặp sự cố kỹ thuật. Vui lòng đổi server hoặc báo lỗi.');
            }
          }
        });
      } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        videoEl.src = url;
      } else {
        setPlayerError('Trình duyệt của bạn không hỗ trợ phát định dạng HLS (.m3u8).');
      }
    } else {
      videoEl.src = url;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoEl) {
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.load();
      }
    };
  }, [source, embedMode, hlsMode]);

  // Execute explicit seek command (from ResumeWatchModal: "Tiếp tục xem" or "Xem lại từ đầu")
  useEffect(() => {
    if (!seekCommand || embedMode || !videoRef.current) return;
    const videoEl = videoRef.current;

    const applySeek = () => {
      const target = Math.max(0, Number(seekCommand.seconds || 0));
      if (Number.isFinite(videoEl.duration) && videoEl.duration > 0) {
        videoEl.currentTime = Math.min(target, Math.max(0, videoEl.duration - 1));
      } else {
        videoEl.currentTime = target;
      }
      if (seekCommand.autoPlay) {
        videoEl.play().catch(() => {});
      }
    };

    if (videoEl.readyState >= 1) {
      applySeek();
    } else {
      const onLoadedMeta = () => {
        applySeek();
        videoEl.removeEventListener('loadedmetadata', onLoadedMeta);
      };
      videoEl.addEventListener('loadedmetadata', onLoadedMeta);
      return () => videoEl.removeEventListener('loadedmetadata', onLoadedMeta);
    }
    return undefined;
  }, [seekCommand, embedMode]);

  // Pause video while ResumeWatchModal is waiting for user decision
  useEffect(() => {
    if (pauseForResumeModal && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [pauseForResumeModal]);

  const emitSnapshot = (callback, isEnded = false) => {
    const videoEl = videoRef.current;
    if (!videoEl || !callback) return;
    const duration = Number(videoEl.duration || 0);
    const currentTime = Number(videoEl.currentTime || 0);
    if (!Number.isFinite(duration) || duration <= 0) return;
    callback({
      stopped_at_seconds: isEnded ? Math.round(duration) : Math.round(currentTime),
      duration_seconds: Math.round(duration),
      is_ended: isEnded,
    });
  };

  const handleTimeUpdate = () => {
    const now = Date.now();
    // Sync every 15 seconds during active playback
    if (now - lastPeriodicSyncRef.current >= 15000) {
      lastPeriodicSyncRef.current = now;
      emitSnapshot(onTimeSync, false);
    }
  };

  const handlePause = () => {
    emitSnapshot(onPauseSync, false);
  };

  const handleEnded = () => {
    emitSnapshot(onEndedSync, true);
  };

  if (!source) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-cinema-border bg-cinema-surface p-6 text-center">
        <Film className="mb-3 h-12 w-12 text-slate-400 dark:text-slate-500" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Chưa có nguồn phát khả dụng
        </h3>
        <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">
          Tập phim này hiện chưa có link phát hoạt động. Bạn vui lòng chọn tập khác hoặc gửi báo lỗi
          để quản trị viên cập nhật.
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-cinema-border bg-black shadow-2xl">
      {embedMode ? (
        <iframe
          key={source.id || source.video_url}
          src={source.video_url}
          title={source.source_name || 'Trình phát nhúng'}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          className="h-full w-full border-0"
        />
      ) : (
        <>
          <video
            ref={videoRef}
            controls
            playsInline
            poster={poster || undefined}
            onTimeUpdate={handleTimeUpdate}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={() =>
              setPlayerError(
                'Không thể phát video từ nguồn này. Vui lòng thử chuyển sang máy chủ phát khác.'
              )
            }
            className="h-full w-full bg-black object-contain"
          />

          {playerError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center">
              <AlertCircle className="mb-3 h-10 w-10 text-cinema-red" />
              <p className="max-w-md text-sm font-medium text-slate-200">{playerError}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
