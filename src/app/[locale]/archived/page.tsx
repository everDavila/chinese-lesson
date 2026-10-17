import { Suspense } from "react";
import { ArchivedScreen } from "@/components/manage/archived";
import { ManageLoading } from "@/components/manage/loading";
import { listArchived } from "@/lib/content";
import { requireProfile } from "@/lib/guard";

// Lecciones y colecciones archivadas por la docente: restaurar o borrar.
export default function Page() {
  return <Suspense fallback={<ManageLoading />}><Content /></Suspense>;
}

async function Content() {
  const [profile, archived] = await Promise.all([requireProfile(), listArchived()]);
  return <ArchivedScreen isAdmin={profile.role === "admin"} archived={archived} />;
}
