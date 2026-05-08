import { redirect } from "next/navigation";
import { getSequences } from "@/lib/api";
import { HomeSearchPage } from "@/components/home-search-page";
import { normalizeSearchTerm } from "@/lib/search";

type HomePageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const rawQ = (await searchParams).q;
  const searchTerm = normalizeSearchTerm(rawQ);
  if (rawQ !== undefined && !searchTerm) redirect("/");
  const result = await getSequences(searchTerm);
  return (
    <HomeSearchPage initialResult={result} initialSearchTerm={searchTerm} />
  );
}
