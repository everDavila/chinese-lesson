import { Suspense } from "react";
import { LibraryScreen } from "@/components/manage/collections";
import { ManageLoading } from "@/components/manage/loading";
import { listCollections } from "@/lib/content";
import { requireTeacher } from "@/lib/guard";

export default function Page() {
  return <Suspense fallback={<ManageLoading />}><Content /></Suspense>;
}

async function Content() {
  const profile = await requireTeacher();
  const templates = await listCollections("templates");
  return <LibraryScreen isAdmin={profile.role === "admin"} templates={templates} />;
}
