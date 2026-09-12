import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { fail, ok } from "@/app/lib/miniu/http";
import { supabaseStorageFetch } from "@/app/lib/miniu/supabase";
import { ApiError } from "@/app/lib/miniu/validation";

const bucketName = "miniu-letter-attachments";
const maxImageBytes = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!(await getSupabaseConnectedCouple(user.id))) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ApiError(400, "VALIDATION_ERROR", "첨부할 이미지를 선택해 주세요.", { file: "required" });
    }
    if (!file.type.startsWith("image/")) {
      throw new ApiError(400, "VALIDATION_ERROR", "이미지만 첨부할 수 있어요.", { file: "image" });
    }
    if (file.size <= 0 || file.size > maxImageBytes) {
      throw new ApiError(400, "VALIDATION_ERROR", "이미지는 5MB 이하만 첨부할 수 있어요.", { file: "max_5mb" });
    }

    const storagePath = `${user.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    await supabaseStorageFetch(`/object/${bucketName}/${encodeStoragePath(storagePath)}`, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
        "x-upsert": "false",
      },
      body: await file.arrayBuffer(),
    });

    return ok({
      attachment: {
        storagePath,
        mimeType: file.type,
        sizeBytes: file.size,
      },
    }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

function safeFileName(name: string): string {
  const extension = name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return extension ? `image.${extension}` : "image";
}

function encodeStoragePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}
