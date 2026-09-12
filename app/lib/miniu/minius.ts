import type { Miniu } from "./types";

export type MiniuRow = {
  id: string;
  user_id: string;
  name: string;
  preset: string;
  hair_style: string;
  hair_color: string;
  skin_tone: string;
  face_shape: string;
  expression: string;
  created_at: string;
  updated_at: string;
};

export function toMiniu(row: MiniuRow): Miniu {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    preset: row.preset,
    hairStyle: row.hair_style,
    hairColor: row.hair_color,
    skinTone: row.skin_tone,
    faceShape: row.face_shape,
    expression: row.expression,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
