import { supabase } from "@/lib";
import { v4 as uuidv4 } from "uuid";

export const uploadImage = async (
  userId: string,
  file: File
): Promise<string | null> => {
  try {
    const ext = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${ext}`;
    const path = `${userId}/${fileName}`;
    const { error } = await supabase.storage.from("images").upload(path, file);
    if (error) {
      console.error("Error uploading image:", error);
      return null;
    }
    return path;
  } catch (err) {
    console.error("Error uploading image:", err);
    return null;
  }
};
