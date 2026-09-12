import "../home.css";
import "./note.css";
import NoteListClient from "./NoteListClient";

export const metadata = {
  title: "MINIU 기록",
  description: "미니미 기록 목록 및 작성 화면",
};

export default function NotePage() {
  return <NoteListClient />;
}
