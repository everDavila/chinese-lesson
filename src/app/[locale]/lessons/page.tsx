import { Suspense } from "react";
import { ManageLoading } from "@/components/manage/loading";
import { TeacherLessonsScreen } from "@/components/manage/teacher-lessons";
import { listLooseLessons, listTeacherLessons, listTeacherPins } from "@/lib/content";
import { requireProfile } from "@/lib/guard";

export default function Page({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  return <Suspense fallback={<ManageLoading />}><Content searchParams={searchParams} /></Suspense>;
}

async function Content({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  const { create } = await searchParams;
  const profile = await requireProfile();
  const [lessons, loose, pins] = await Promise.all([listTeacherLessons(), listLooseLessons(), listTeacherPins()]);
  return <TeacherLessonsScreen isAdmin={profile.role === "admin"} lessons={lessons} loose={loose} pinnedIds={pins.filter((pin) => pin.kind === "lesson").map((pin) => pin.id)} createOnLoad={create === "1"} />;
}
