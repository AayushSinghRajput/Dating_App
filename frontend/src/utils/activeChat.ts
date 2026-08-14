// Tracks which chat screen (if any) is currently on-screen, so a global
// "new message" listener can skip showing a toast for a conversation the
// user is already looking at. ChatDetail sets this on mount and clears it
// on unmount.
let activeChatId: string | null = null;

export const setActiveChatId = (chatId: string | null) => {
  activeChatId = chatId;
};

export const getActiveChatId = () => activeChatId;
