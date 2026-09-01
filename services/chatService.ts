import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDocs,
  increment,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Conversation, Message } from "../types/chat";

function conversationIdFor(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join("_");
}

// ── Find-or-create a conversation between two users ─────────────────
// Deterministic ID (sorted uids) means "find" is just a getDoc, and
// duplicate conversations between the same two people are impossible
// by construction — no array-contains query + client filter needed.
export async function getOrCreateConversation(params: {
  currentUserId: string;
  currentUserName: string;
  partnerId: string;
  partnerName: string;
}): Promise<string> {
  const { currentUserId, currentUserName, partnerId, partnerName } = params;

  if (currentUserId === partnerId) {
    throw new Error("Can't start a conversation with yourself");
  }

  const conversationId = conversationIdFor(currentUserId, partnerId);
  const ref = doc(db, "conversations", conversationId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [currentUserId, partnerId],
      participantNames: {
        [currentUserId]: currentUserName,
        [partnerId]: partnerName,
      },
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      lastSenderId: "",
      unreadCounts: {
        [currentUserId]: 0,
        [partnerId]: 0,
      },
      createdAt: serverTimestamp(),
    });
  }

  return conversationId;
}

// ── Live list of the current user's conversations ───────────────────
export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", userId),
    orderBy("lastMessageAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const conversations: Conversation[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        participants: data.participants,
        participantNames: data.participantNames,
        lastMessage: data.lastMessage ?? "",
        lastMessageAt: data.lastMessageAt?.toDate?.().toISOString() ?? null,
        lastSenderId: data.lastSenderId ?? "",
        unreadCount: data.unreadCounts?.[userId] ?? 0,
      };
    });
    callback(conversations);
  });
}

// ── Live message list for one conversation ───────────────────────────
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snap) => {
    const messages: Message[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        senderId: data.senderId,
        text: data.text,
        createdAt:
          data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
        read: data.read ?? false,
      };
    });
    callback(messages);
  });
}

// ── Send a message ───────────────────────────────────────────────────
export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  partnerId: string;
  text: string;
}) {
  const { conversationId, senderId, partnerId, text } = params;
  const trimmed = text.trim();
  if (!trimmed) return;

  const messagesRef = collection(db, "conversations", conversationId, "messages");
  await addDoc(messagesRef, {
    senderId,
    text: trimmed,
    createdAt: serverTimestamp(),
    read: false,
  });

  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
    lastSenderId: senderId,
    [`unreadCounts.${partnerId}`]: increment(1),
  });
}

// ── Mark a conversation as read for the current user ──────────────────
// Resets their unread badge and flips `read` on any unread messages the
// partner sent, so the sender's checkmark UI updates.
export async function markConversationRead(
  conversationId: string,
  currentUserId: string,
  partnerId: string
) {
  await updateDoc(doc(db, "conversations", conversationId), {
    [`unreadCounts.${currentUserId}`]: 0,
  });

  const unreadQuery = query(
    collection(db, "conversations", conversationId, "messages"),
    where("senderId", "==", partnerId),
    where("read", "==", false)
  );
  const snap = await getDocs(unreadQuery);
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}
export function subscribeToUnreadMessageCount(
  userId: string,
  callback: (count: number) => void
): Unsubscribe {
  return subscribeToConversations(userId, (conversations) => {
    const conversationsWithUnread = conversations.filter((c) => c.unreadCount > 0).length;
    callback(conversationsWithUnread);
  });
}