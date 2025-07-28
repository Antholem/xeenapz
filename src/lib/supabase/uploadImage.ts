import { supabase } from "./client";
import { v4 as uuidv4 } from "uuid";

export const uploadChatImage = async (
  file: File,
  userId: string,
  threadId: string
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${userId}/chats/${threadId}/${uuidv4()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("images")
      .upload(filePath, file, { upsert: false });

    if (error) {
      console.error("Error uploading image:", error.message);
      return null;
    }

    const { data } = supabase.storage.from("images").getPublicUrl(filePath);
    return data.publicUrl || null;
  } catch (err) {
    console.error("Unexpected error uploading image:", err);
    return null;
  }
};
