"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Play, Loader2, AlertCircle } from 'lucide-react';
import { searchYouTubeVideo } from '../../lib/youtubeApi';

const UpNextVideo = ({ topicName, onPlay }) => {
  const [state, setState] = useState({ status: 'idle', video: null });
  const lastRequestedTopicRef = useRef('');
  const requestIdRef = useRef(0);

  useEffect(() => {
    const name = (topicName || '').trim();
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';
    const isPlaceholderKey = /^(your[_-]?key|changeme|example|placeholder)$/i.test(apiKey.trim());

    if (!name) {
      lastRequestedTopicRef.current = '';
      setState({ status: 'idle', video: null });
      return;
    }

    if (lastRequestedTopicRef.current === name) {
      return;
    }

    lastRequestedTopicRef.current = name;
    const requestId = ++requestIdRef.current;
    let cancelled = false;

    if (!apiKey || isPlaceholderKey) {
      setState({ status: 'unavailable', video: null });
      return () => {
        cancelled = true;
      };
    }

    setState({ status: 'loading', video: null });

    searchYouTubeVideo(name)
      .then((video) => {
        if (cancelled || requestId !== requestIdRef.current) return;
        setState(video ? { status: 'found', video } : { status: 'unavailable', video: null });
      })
      .catch(() => {
        if (!cancelled && requestId === requestIdRef.current) {
          setState({ status: 'unavailable', video: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [topicName]);

  if (state.status === 'loading') {
    return (
      <div className="flex items-center justify-center py-3 bg-white/10 rounded-lg">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        <span className="text-sm">Finding a tutorial...</span>
      </div>
    );
  }

  if (state.status === 'unavailable' || !state.video) {
    return (
      <div className="flex items-center justify-center py-3 bg-white/10 rounded-lg text-white/80">
        <AlertCircle className="w-4 h-4 mr-2" />
        <span className="text-sm">Video unavailable</span>
      </div>
    );
  }

  const v = state.video;
  return (
    <div className="bg-white/10 rounded-lg p-2">
      <div className="flex items-center space-x-3">
        {v.thumbnail && (
          <img
            src={v.thumbnail}
            alt={v.title}
            className="w-20 h-12 object-cover rounded-md flex-shrink-0"
            loading="lazy"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" title={v.title}>{v.title}</p>
          {v.channel && <p className="text-[10px] opacity-80 truncate">{v.channel}</p>}
        </div>
      </div>
      <button
        onClick={() => onPlay?.(v.videoId)}
        className="mt-2 w-full py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm flex items-center justify-center"
      >
        <Play className="w-4 h-4 mr-2" />
        Start Learning
      </button>
    </div>
  );
};

export default UpNextVideo;