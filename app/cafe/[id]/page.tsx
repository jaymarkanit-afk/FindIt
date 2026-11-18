import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Placeholder } from "@/components/Placeholder";
import { RememberCafe } from "@/components/RememberCafe";
import styles from "@/components/placeholder.module.css";
import { getCafe, type Cafe } from "@/lib/api";

type Props = { params: Promise<{ id: string }> };

async function cafeFor(params: Props["params"]): Promise<Cafe | undefined> {
  const { id } = await params;
  return /^\d+$/.test(id) ? getCafe(Number(id)) : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cafe = await cafeFor(params);
  return cafe ? { title: cafe.name, description: `${cafe.name}, ${cafe.address}` } : { title: "Café not found" };
}

export default async function CafePage({ params }: Props) {
  const cafe = await cafeFor(params);
  if (!cafe) notFound();
  return (
    <Placeholder title={cafe.name}>
      <RememberCafe id={cafe.id} />
      <p className={styles.meta}>{cafe.address}</p>
      <p className={styles.meta}>
        ★ {cafe.rating} · {cafe.reviews} reviews · {cafe.tags.join(" · ")}
      </p>
    </Placeholder>
  );
}
