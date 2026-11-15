import { cookies } from "next/headers";
import { placeFromName, PLACE_COOKIE } from "@/lib/place";
import { TodayBoard } from "@/components/TodayBoard";

export default async function HomePage() {
  const cookieStore = await cookies();
  const place = placeFromName(cookieStore.get(PLACE_COOKIE)?.value);
  return <TodayBoard initialPlace={place} />;
}
