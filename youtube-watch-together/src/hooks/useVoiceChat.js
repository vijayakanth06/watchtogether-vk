import { useEffect, useRef } from 'react';
import { setupWebRTCSignaling } from '../services/webrtc';

export const useVoiceChat = (roomCode, userId, users) => {
  const webrtcRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioElementsRef = useRef({});

  useEffect(() => {
    if (!roomCode || !userId) return;

    webrtcRef.current = setupWebRTCSignaling(
      roomCode,
      userId,
      (remoteUserId, stream) => {
        // Create audio context if it doesn't exist
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Create or update audio element for this user
        if (!audioElementsRef.current[remoteUserId]) {
          const audio = new Audio();
          audio.srcObject = stream;
          audio.autoplay = true;
          audioElementsRef.current[remoteUserId] = audio;
        } else {
          audioElementsRef.current[remoteUserId].srcObject = stream;
        }
      }
    );

    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.cleanup();
      }
      
      // Cleanup audio elements
      Object.values(audioElementsRef.current).forEach(audio => {
        if (audio.srcObject) {
          audio.srcObject.getTracks().forEach(track => track.stop());
        }
      });
      audioElementsRef.current = {};
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [roomCode, userId]);

  const startSpeaking = async () => {
    if (webrtcRef.current) {
      try {
        await webrtcRef.current.startLocalStream();
        webrtcRef.current.setSpeaking(true);
        webrtcRef.current.connectToUsers(Object.keys(users));
      } catch (error) {
        console.error('Error starting voice chat:', error);
        throw error;
      }
    }
  };

  const stopSpeaking = () => {
    if (webrtcRef.current) {
      webrtcRef.current.setSpeaking(false);
    }
  };

  return {
    startSpeaking,
    stopSpeaking
  };
};