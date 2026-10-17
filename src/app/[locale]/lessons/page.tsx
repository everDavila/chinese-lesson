import { Suspense } from "react";
import { ManageLoading } from "@/components/manage/loading";
import { TeacherLessonsScreen } from "@/components/manage/teacher-lessons";
import { listLooseLessons, listTeacherLessons } from "@/lib/content";
import { requireProfile } from "@/lib/guard";

export default function Page() {
  return <Suspense fallback={<ManageLoading />}><Content /></Suspense>;
}

async function Content() {
  const profile = await requireProfile();
  const [lessons, loose] = await Promise.all([listTeacherLessons(), listLooseLessons()]);
  return <TeacherLessonsScreen isAdmin={profile.role === "admin"} lessons={lessons} loose={loose} />;
}
