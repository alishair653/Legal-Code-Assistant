'use client';

import { create } from 'zustand';

export interface Message {
  text: string;
  isBot: boolean;
  image?: string; // base64 data URL
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  role: string;
  createdAt: Date;
}

interface ChatStore {
  chats: Chat[];
  activeChatId: string | null;
  isLoggedIn: boolean;
  isPro: boolean;
  user: { name: string; email: string; avatar: string } | null;
  addChat: (role: string) => string;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  setActiveChat: (id: string) => void;
  addMessage: (chatId: string, text: string, isBot: boolean, image?: string) => void;
  login: (email: string, password: string) => void;
  signup: (name: string, email: string, password: string) => void;
  logout: () => void;
  upgradeToPro: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

export const useChatStore = create<ChatStore>((set) => ({
  chats: [
    {
      id: 'demo-1',
      title: 'PPC Section 302 - Murder',
      messages: [
        { text: "Welcome! I'm your Legal Code Assistant for Pakistani criminal law. How can I help?", isBot: true },
        { text: 'What is the punishment for murder under PPC?', isBot: false },
        { text: "Under PPC Section 302, murder (Qatl-i-Amd) is punishable by death as Qisas, or imprisonment for life as Ta'zir with possible fine. The heirs of the victim may also opt for Diyat (blood money) under Section 310.", isBot: true },
      ],
      role: 'citizen',
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      id: 'demo-2',
      title: 'Bail Eligibility Query',
      messages: [
        { text: "Welcome, Counsellor. How can I assist you today?", isBot: true },
        { text: 'Is bail available for Section 420 fraud cases?', isBot: false },
        { text: 'Section 420 (cheating/fraud) is a non-bailable offense. Bail requires court discretion under CrPC Section 497. However, anticipatory bail may be sought under Section 498 in some circumstances.', isBot: true },
      ],
      role: 'lawyer',
      createdAt: new Date(Date.now() - 3600000),
    },
  ],
  activeChatId: null,
  isLoggedIn: false,
  isPro: false,
  user: null,

  addChat: (role) => {
    const id = generateId();
    set((state) => ({
      chats: [
        {
          id,
          title: 'New Chat',
          messages: [{ text: "Welcome! I'm your Legal Code Assistant. Ask me anything about Pakistani law.", isBot: true }],
          role,
          createdAt: new Date(),
        },
        ...state.chats,
      ],
      activeChatId: id,
    }));
    return id;
  },

  deleteChat: (id) =>
    set((state) => ({
      chats: state.chats.filter((c) => c.id !== id),
      activeChatId: state.activeChatId === id ? null : state.activeChatId,
    })),

  renameChat: (id, title) =>
    set((state) => ({
      chats: state.chats.map((c) => (c.id === id ? { ...c, title } : c)),
    })),

  setActiveChat: (id) => set({ activeChatId: id }),

  addMessage: (chatId, text, isBot, image) =>
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: [...c.messages, { text, isBot, image }],
              title: c.title === 'New Chat' && !isBot ? text.slice(0, 40) + (text.length > 40 ? '...' : '') : c.title,
            }
          : c
      ),
    })),

  login: (email, _password) =>
    set({ isLoggedIn: true, user: { name: email.split('@')[0], email, avatar: '' } }),

  signup: (name, email, _password) =>
    set({ isLoggedIn: true, user: { name, email, avatar: '' } }),

  logout: () => set({ isLoggedIn: false, user: null, isPro: false }),

  upgradeToPro: () => set({ isPro: true }),
}));
