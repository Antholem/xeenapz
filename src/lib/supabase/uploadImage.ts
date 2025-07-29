import { v4 as uuidv4 } from "uuid";
import { supabase } from "./client";

export const uploadImage = async (
  file: File | Blob,
  userId: string
): Promise<string | null> => {
  const ext = file instanceof File && file.name.includes(".")
    ? file.name.split(".").pop()!
    : "jpg";
  const fileName = `${uuidv4()}.${ext}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from("images")
    .upload(filePath, file, { upsert: true, contentType: file.type || "image/jpeg" });

  if (error) {
    console.error("Error uploading image:", error.message);
    return null;
  }

  return filePath;
};
