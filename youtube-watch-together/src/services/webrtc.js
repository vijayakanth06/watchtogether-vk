import { db, ref, set, onValue, off } from './firebase';

export const setupWebRTCSignaling = (roomCode, userId, onRemoteStream) => {
  const peerConnections = {};
  let localStream = null;
  let currentSpeaker = null;

  const cleanupPeerConnection = (targetUserId) => {
    if (peerConnections[targetUserId]) {
      peerConnections[targetUserId].close();
      delete peerConnections[targetUserId];
    }
  };

  const initializePeerConnection = async (targetUserId) => {
    if (peerConnections[targetUserId]) {
      return peerConnections[targetUserId];
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    peerConnections[targetUserId] = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidateRef = ref(db, 
          `rooms/${roomCode}/voiceCandidates/${userId}/${targetUserId}/${event.candidate.candidate}`);
        set(candidateRef, event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        onRemoteStream(targetUserId, event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || 
          pc.connectionState === 'failed') {
        cleanupPeerConnection(targetUserId);
      }
    };

    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    return pc;
  };

  const createOffer = async (targetUserId) => {
    const pc = await initializePeerConnection(targetUserId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    const offerRef = ref(db, `rooms/${roomCode}/voiceOffers/${userId}/${targetUserId}`);
    set(offerRef, offer);
  };

  const handleAnswer = async (fromUserId, answer) => {
    const pc = peerConnections[fromUserId];
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleIceCandidate = async (fromUserId, candidate) => {
    const pc = peerConnections[fromUserId];
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  };

  // Setup listeners
  const offersRef = ref(db, `rooms/${roomCode}/voiceOffers/${userId}`);
  const answersRef = ref(db, `rooms/${roomCode}/voiceAnswers/${userId}`);
  const candidatesRef = ref(db, `rooms/${roomCode}/voiceCandidates/${userId}`);

  const offersUnsub = onValue(offersRef, (snapshot) => {
    snapshot.forEach((targetUserSnapshot) => {
      const targetUserId = targetUserSnapshot.key;
      if (targetUserId !== userId) {
        targetUserSnapshot.forEach((offerSnapshot) => {
          answerOffer(targetUserId, offerSnapshot.val());
        });
      }
    });
  });

  const answersUnsub = onValue(answersRef, (snapshot) => {
    snapshot.forEach((fromUserSnapshot) => {
      const fromUserId = fromUserSnapshot.key;
      fromUserSnapshot.forEach((answerSnapshot) => {
        handleAnswer(fromUserId, answerSnapshot.val());
      });
    });
  });

  const candidatesUnsub = onValue(candidatesRef, (snapshot) => {
    snapshot.forEach((fromUserSnapshot) => {
      const fromUserId = fromUserSnapshot.key;
      fromUserSnapshot.forEach((candidateSnapshot) => {
        handleIceCandidate(fromUserId, candidateSnapshot.val());
      });
    });
  });

  const answerOffer = async (fromUserId, offer) => {
    const pc = await initializePeerConnection(fromUserId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    const answerRef = ref(db, `rooms/${roomCode}/voiceAnswers/${userId}/${fromUserId}`);
    set(answerRef, answer);
  };

  const cleanup = () => {
    off(offersRef);
    off(answersRef);
    off(candidatesRef);
    Object.keys(peerConnections).forEach(cleanupPeerConnection);
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
  };

  return {
    startLocalStream: async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          } 
        });
        localStream = stream;
        return stream;
      } catch (error) {
        console.error('Error accessing microphone:', error);
        throw error;
      }
    },
    setSpeaking: (isSpeaking) => {
      if (isSpeaking) {
        currentSpeaker = userId;
      } else if (currentSpeaker === userId) {
        currentSpeaker = null;
      }
    },
    connectToUsers: (userIds) => {
      userIds.filter(id => id !== userId).forEach(createOffer);
    },
    cleanup
  };
};