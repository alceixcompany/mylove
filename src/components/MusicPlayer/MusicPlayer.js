"use client";
import { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import styles from './MusicPlayer.module.css';

const MusicPlayer = ({ songTitle, artistName, thumbnailUrl, songUrl, isDashboard }) => {
    const [playing, setPlaying] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const [videoId, setVideoId] = useState('');
    const playerRef = useRef(null);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Extract Video ID from various YouTube URL formats
    useEffect(() => {
        if (!songUrl) {
            setVideoId('');
            return;
        }
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = songUrl.match(regex);
        if (match && match[1]) {
            setVideoId(match[1]);
        }
    }, [songUrl]);

    const togglePlay = (e) => {
        if (e) e.stopPropagation();
        if (!videoId) return;

        if (playerRef.current) {
            if (playing) {
                playerRef.current.pauseVideo();
            } else {
                playerRef.current.playVideo();
            }
        }
        setPlaying(!playing);
    };

    const onReady = (event) => {
        playerRef.current = event.target;
        // Official API volume set
        event.target.setVolume(100);
    };

    const onStateChange = (event) => {
        // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
        if (event.data === 1) setPlaying(true);
        if (event.data === 2) setPlaying(false);
        if (event.data === 0) setPlaying(false);
    };

    if (!hasMounted) return null;

    return (
        <div className={`${styles.player} ${isDashboard ? styles.dashboardMode : ''}`}>
            <div className={styles.thumbContainer}>
                <div
                    className={styles.pulseCircle}
                    style={{
                        animationPlayState: playing ? 'running' : 'paused',
                        display: (playing && videoId) ? 'block' : 'none'
                    }}
                ></div>
                <img
                    src={thumbnailUrl || "/images/music-placeholder.png"}
                    alt="Music"
                    className={styles.thumb}
                    style={{ animationPlayState: (playing && videoId) ? 'running' : 'paused' }}
                />
            </div>
            <div className={styles.info}>
                <p className={styles.title}>{songTitle || "Şarkı Seçilmedi"}</p>
                <p className={styles.artist}>{artistName || "Sanatçı"}</p>
            </div>
            <div className={styles.controls}>
                <div
                    className={styles.playBtn}
                    onClick={togglePlay}
                    style={{
                        opacity: videoId ? 1 : 0.5,
                        cursor: videoId ? 'pointer' : 'default'
                    }}
                >
                    {playing ? '⏸' : '▶'}
                </div>
            </div>

            {/* Use Official YouTube IFrame API via react-youtube */}
            {videoId && (
                <div style={{ position: 'absolute', width: '1px', height: '1px', top: '-10px', left: '-10px', overflow: 'hidden' }}>
                    <YouTube
                        videoId={videoId}
                        opts={{
                            height: '1',
                            width: '1',
                            playerVars: {
                                autoplay: isDashboard ? 0 : 1,
                                controls: 0,
                                modestbranding: 1,
                                rel: 0,
                                playsinline: 1,
                                origin: typeof window !== 'undefined' ? window.location.origin : ''
                            },
                        }}
                        onReady={(event) => {
                            onReady(event);
                            if (!isDashboard) {
                                event.target.playVideo();
                            }
                        }}
                        onStateChange={onStateChange}
                        onError={(e) => {
                            console.error('YouTube API Hatası:', e);
                            setPlaying(false);
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default MusicPlayer;
