// lib/supabaseDb.ts
import { supabase } from "./supabaseClient";
import { type Message } from "@/stores";

export async function saveThreadMetadata(
  userId: string,
  threadId: string,
  data: Partial<any>
) {
  await supabase.from("threads").upsert(
    {
      id: threadId,
      user_id: userId,
      ...data,
    },
    { onConflict: "id" }
  );
}

export async function saveMessage(
  userId: string,
  threadId: string,
  message: Message,
  isGenerated = false
) {
  await supabase.from("messages").insert({
    user_id: userId,
    thread_id: threadId,
    text: message.text,
    sender: message.sender,
    created_at: message.createdAt,
    timestamp: message.timestamp,
    is_generated: isGenerated,
  });
}

export async function fetchThreadMessages(threadId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Message[];
}
