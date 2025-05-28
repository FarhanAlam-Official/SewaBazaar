import { supabase } from "@/lib/supabase"

export const uploadFile = async (file: File, bucket = "sewabazaar", folder = ""): Promise<string | null> => {
  try {
    // Create a unique file name
    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`

    // Determine the file path
    const filePath = folder ? `${folder}/${fileName}` : fileName

    // Upload the file
    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file)

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return null
    }

    // Get the public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)

    return data.publicUrl
  } catch (error) {
    console.error("Error in uploadFile:", error)
    return null
  }
}

export const deleteFile = async (filePath: string, bucket = "sewabazaar"): Promise<boolean> => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath])

    if (error) {
      console.error("Error deleting file:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteFile:", error)
    return false
  }
}
