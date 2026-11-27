import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

type CallType = 'audio' | 'video';
type CallRow = {
  id: string;
  caller_id: string;
  callee_id: string;
  call_type: CallType;
  status: 'ringing' | 'accepted' | 'rejected' | 'ended' | 'missed';
  offer: RTCSessionDescriptionInit | null;
  answer: RTCSessionDescriptionInit | null;
};

export const CallControls: React.FC<{
  userId: string;
  contactId: string;
  contactName: string;
  disabled?: boolean;
}> = ({ userId, contactId, contactName, disabled = false }) => {
  const [call, setCall] = useState<CallRow | null>(null);
  const [incoming, setIncoming] = useState<CallRow | null>(null);
  const [callError, setCallError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const [localReady, setLocalReady] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const callRef = useRef<CallRow | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const processedCandidateIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => { callRef.current = call; }, [call]);

  const closeMedia = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    pendingCandidatesRef.current = [];
    processedCandidateIdsRef.current.clear();
    setLocalReady(false);
    setRemoteReady(false);
    setMuted(false);
    setCameraOff(false);
    setConnecting(false);
  }, []);

  const preparePeer = useCallback(async (callId: string, type: CallType) => {
    if (!supabase) throw new Error('کال سروس دستیاب نہیں۔ دوبارہ لاگ اِن کریں۔');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video' ? { facingMode: 'user' } : false,
    });
    localStreamRef.current = stream;
    setLocalReady(true);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
      void localVideoRef.current.play().catch(() => {});
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    pcRef.current = pc;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    pc.ontrack = (event) => {
      const incomingStream = event.streams[0];
      if (!incomingStream) return;
      remoteStreamRef.current = incomingStream;
      setRemoteReady(true);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = incomingStream;
        void remoteVideoRef.current.play().catch(() => {});
      }
    };
    pc.onicecandidate = (event) => {
      if (event.candidate && supabase) {
        void supabase.from('call_ice_candidates').insert({
          call_id: callId,
          sender_id: userId,
          candidate: event.candidate.toJSON(),
        });
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
        if (pc.connectionState !== 'closed') setCallError('کنکشن منقطع ہو گیا۔ دوبارہ کال کرنے کی کوشش کریں۔');
      }
    };
    return pc;
  }, [userId]);

  const flushCandidates = useCallback(async (pc: RTCPeerConnection) => {
    const queued = pendingCandidatesRef.current.splice(0);
    for (const candidate of queued) {
      try { await pc.addIceCandidate(candidate); } catch { /* Ignore stale ICE candidates. */ }
    }
  }, []);

  useEffect(() => {
    if (!supabase || !userId) return;
    let alive = true;
    const receive = (row: CallRow) => {
      if (!alive || row.caller_id === userId || row.status !== 'ringing') return;
      setIncoming((current) => current ?? row);
    };
    void supabase.from('call_sessions').select('*').eq('callee_id', userId).eq('status', 'ringing')
      .order('created_at', { ascending: false }).limit(1).then(({ data }) => {
        if (alive && data?.[0]) receive(data[0] as CallRow);
      });
    const channel = supabase.channel(`incoming-calls-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_sessions', filter: `callee_id=eq.${userId}` },
        (payload) => receive(payload.new as CallRow))
      .subscribe();
    return () => {
      alive = false;
      void supabase?.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!supabase || !call?.id) return;
    const callChannel = supabase.channel(`call-session-${call.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'call_sessions', filter: `id=eq.${call.id}` }, async (payload) => {
        const row = payload.new as CallRow;
        setCall(row);
        if (row.status === 'ended' || row.status === 'rejected' || row.status === 'missed') {
          closeMedia();
          setCall(null);
          setCallError(row.status === 'rejected' ? 'سامنے والے نے کال قبول نہیں کی۔' : 'کال ختم ہو گئی۔');
          return;
        }
        const pc = pcRef.current;
        if (row.answer && pc && !pc.currentRemoteDescription && row.caller_id === userId) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(row.answer));
            await flushCandidates(pc);
            setConnecting(false);
          } catch { setCallError('کال کنکشن قائم نہیں ہو سکا۔'); }
        }
      })
      .subscribe();
    const iceChannel = supabase.channel(`call-ice-${call.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_ice_candidates', filter: `call_id=eq.${call.id}` }, async (payload) => {
        const row = payload.new as { id: number; sender_id: string; candidate: RTCIceCandidateInit };
        if (row.sender_id === userId || processedCandidateIdsRef.current.has(row.id)) return;
        processedCandidateIdsRef.current.add(row.id);
        const pc = pcRef.current;
        if (!pc?.remoteDescription) pendingCandidatesRef.current.push(row.candidate);
        else {
          try { await pc.addIceCandidate(row.candidate); } catch { /* Ignore late candidates. */ }
        }
      })
      .subscribe();
    return () => {
      void supabase?.removeChannel(callChannel);
      void supabase?.removeChannel(iceChannel);
    };
  }, [call?.id, userId, closeMedia, flushCandidates]);

  const startCall = async (type: CallType) => {
    if (!supabase || disabled || call || incoming) return;
    setCallError('');
    setConnecting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === 'undefined') {
        throw new Error('اس براؤزر میں کالنگ سپورٹ دستیاب نہیں۔ Chrome یا Safari کا تازہ ورژن استعمال کریں۔');
      }
      const id = crypto.randomUUID();
      const pc = await preparePeer(id, type);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const { data, error } = await supabase.from('call_sessions').insert({
        id, caller_id: userId, callee_id: contactId, call_type: type,
        status: 'ringing', offer: pc.localDescription?.toJSON() ?? offer,
      }).select('*').single();
      if (error) throw error;
      setCall(data as CallRow);
    } catch (error) {
      closeMedia();
      setCallError(error instanceof Error ? error.message : 'کال شروع نہیں ہو سکی۔');
    } finally {
      setConnecting(false);
    }
  };

  const acceptCall = async () => {
    if (!supabase || !incoming) return;
    setCallError('');
    setConnecting(true);
    const current = incoming;
    try {
      if (!current.offer) throw new Error('کال کی تفصیل موصول نہیں ہوئی۔');
      if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === 'undefined') {
        throw new Error('اس براؤزر میں کالنگ سپورٹ دستیاب نہیں۔');
      }
      const pc = await preparePeer(current.id, current.call_type);
      await pc.setRemoteDescription(new RTCSessionDescription(current.offer));
      await flushCandidates(pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      const { data, error } = await supabase.from('call_sessions').update({
        status: 'accepted', answer: pc.localDescription?.toJSON() ?? answer,
      }).eq('id', current.id).eq('callee_id', userId).select('*').single();
      if (error) throw error;
      setCall(data as CallRow);
      setIncoming(null);
    } catch (error) {
      closeMedia();
      setCallError(error instanceof Error ? error.message : 'کال قبول نہیں ہو سکی۔');
    } finally {
      setConnecting(false);
    }
  };

  const rejectCall = async () => {
    if (!supabase || !incoming) return;
    await supabase.from('call_sessions').update({ status: 'rejected' }).eq('id', incoming.id);
    setIncoming(null);
  };

  const endCall = async () => {
    const current = callRef.current;
    if (supabase && current) {
      await supabase.from('call_sessions').update({ status: 'ended' }).eq('id', current.id);
    }
    closeMedia();
    setCall(null);
  };

  const toggleMute = () => {
    const next = !muted;
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !next; });
    setMuted(next);
  };
  const toggleCamera = () => {
    const next = !cameraOff;
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = !next; });
    setCameraOff(next);
  };

  useEffect(() => () => closeMedia(), [closeMedia]);

  return (
    <>
      <div className="flex items-center gap-1">
        <button type="button" title="آڈیو کال" aria-label="آڈیو کال" disabled={disabled || connecting || Boolean(call) || Boolean(incoming)}
          onClick={() => void startCall('audio')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-40">
          <span className="material-symbols-outlined text-[20px]">call</span>
        </button>
        <button type="button" title="ویڈیو کال" aria-label="ویڈیو کال" disabled={disabled || connecting || Boolean(call) || Boolean(incoming)}
          onClick={() => void startCall('video')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-40">
          <span className="material-symbols-outlined text-[20px]">videocam</span>
        </button>
      </div>

      {callError && !call && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[95] max-w-[90vw] rounded-xl bg-error-container text-on-error-container px-4 py-3 text-xs shadow-lg">
          {callError}
          <button type="button" className="ml-3 font-bold" onClick={() => setCallError('')}>بند</button>
        </div>
      )}

      {incoming && !call && (
        <div className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-5">
          <div className="w-full max-w-sm rounded-3xl bg-surface-container-lowest p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">{incoming.call_type === 'video' ? 'videocam' : 'call'}</span>
            </div>
            <h2 className="text-lg font-bold text-on-surface">آنے والی {incoming.call_type === 'video' ? 'ویڈیو' : 'آڈیو'} کال</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{contactName}</p>
            <div className="mt-6 flex gap-3">
              <button type="button" disabled={connecting} onClick={() => void rejectCall()} className="flex-1 rounded-xl bg-error px-4 py-3 text-white font-semibold">رد کریں</button>
              <button type="button" disabled={connecting} onClick={() => void acceptCall()} className="flex-1 rounded-xl bg-primary px-4 py-3 text-white font-semibold">{connecting ? 'جوڑ رہے ہیں…' : 'قبول کریں'}</button>
            </div>
          </div>
        </div>
      )}

      {call && (
        <div className="fixed inset-0 z-[110] bg-slate-950 text-white flex flex-col">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <div className="font-semibold">{contactName}</div>
              <div className="text-xs text-white/65">{connecting || call.status === 'ringing' ? 'کال ملائی جا رہی ہے…' : remoteReady ? 'کال جاری ہے' : 'دوسرے صارف کا انتظار ہے…'}</div>
            </div>
            <span className="text-xs rounded-full bg-white/10 px-3 py-1">{call.call_type === 'video' ? 'ویڈیو' : 'آڈیو'}</span>
          </div>
          <div className="relative flex-1 min-h-0 flex items-center justify-center p-3">
            {call.call_type === 'video' ? (
              <>
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover rounded-2xl bg-slate-900" />
                {!remoteReady && <div className="absolute text-sm text-white/70">رابطہ قائم ہو رہا ہے…</div>}
                <video ref={localVideoRef} autoPlay playsInline muted className="absolute right-6 top-6 w-28 sm:w-40 aspect-[3/4] object-cover rounded-xl border border-white/30 bg-slate-800" />
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto w-28 h-28 rounded-full bg-white/10 flex items-center justify-center"><span className="material-symbols-outlined text-5xl">person</span></div>
                <p className="mt-4 text-white/70">{remoteReady ? 'آڈیو کال منسلک ہے' : 'کال کنیکٹ ہو رہی ہے…'}</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-5 p-7">
            <button type="button" onClick={toggleMute} className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center" aria-label="مائیکروفون بند یا کھولیں"><span className="material-symbols-outlined">{muted ? 'mic_off' : 'mic'}</span></button>
            {call.call_type === 'video' && <button type="button" onClick={toggleCamera} className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center" aria-label="کیمرہ بند یا کھولیں"><span className="material-symbols-outlined">{cameraOff ? 'videocam_off' : 'videocam'}</span></button>}
            <button type="button" onClick={() => void endCall()} className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center" aria-label="کال ختم کریں"><span className="material-symbols-outlined text-2xl">call_end</span></button>
          </div>
          {!localReady && <div className="pb-3 text-center text-xs text-white/50">مائیکروفون/کیمرہ کی اجازت درکار ہے</div>}
        </div>
      )}
    </>
  );
};
