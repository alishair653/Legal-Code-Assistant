'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const activeRef = useRef(false); // tracks actual recognition state, not just React state

  useEffect(() => {
    const supported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setIsSupported(supported);
    if (!supported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };

    recognition.onerror = () => {
      activeRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      activeRef.current = false;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return () => {
      activeRef.current = false;
      try { recognition.abort(); } catch {}
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (activeRef.current) return; // already running — do nothing

    try {
      recognitionRef.current.abort(); // reset any stale state
    } catch {}

    // small delay so abort finishes before start
    setTimeout(() => {
      try {
        setTranscript('');
        recognitionRef.current.start();
        activeRef.current = true;
        setIsListening(true);
      } catch (e) {
        activeRef.current = false;
        setIsListening(false);
      }
    }, 100);
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {}
    activeRef.current = false;
    setIsListening(false);
  }, []);

  return { isListening, transcript, startListening, stopListening, isSupported };
}
