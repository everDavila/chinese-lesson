import { Suspense } from "react";
import { HskLevelsScreen } from "@/components/manage/library-hsk";
import { ManageLoading } from "@/components/manage/loading";
import { listCollections } from "@/lib/content";
import { requireProfile } from "@/lib/guard";

export default function Page() {
  return <Suspense fallback={<ManageLoading />}><Content /></Suspense>;
}

async function Content() {
  const profile = await requireProfile();
  const templates = (await listCollections("templates")).filter((item) => /^HSK\s/i.test(item.title));
  return <HskLevelsScreen isAdmin={profile.role === "admin"} templates={templates} />;
}
