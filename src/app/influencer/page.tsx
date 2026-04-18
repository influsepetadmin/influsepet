import { redirect } from "next/navigation";

/** Eski uzun panel URL’si → yeni genel bakış. */
export default function InfluencerRootPage() {
  redirect("/influencer/overview");
}
