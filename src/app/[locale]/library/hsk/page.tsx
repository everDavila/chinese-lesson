import { Suspense } from "react";
import { HskLevelsScreen } from "@/components/manage/library-hsk";
import { ManageLoading } from "@/components/manage/loading";
import { hskLevelCounts } from "@/lib/content";
import { requireProfile } from "@/lib/guard";

export default function Page() {
  return <Suspense fallback={<ManageLoading />}><Content /></Suspense>;
}

async function Content() {
  const [profile, counts] = await Promise.all([requireProfile(), hskLevelCounts()]);
  return <HskLevelsScreen isAdmin={profile.role === "admin"} counts={counts} />;
}
