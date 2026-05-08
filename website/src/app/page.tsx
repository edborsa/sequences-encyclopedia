import { redirect } from "next/navigation";
import { HomeSearchPage } from "@/components/home-search-page";
import { getSequences } from "@/lib/api";
import { buildHomePath, normalizeSearchTerm } from "@/lib/search";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const rawQ = (await searchParams).q;
  const searchTerm = normalizeSearchTerm(rawQ);

  if (rawQ !== undefined && !searchTerm) {
    redirect(buildHomePath());
  }

  const sequences = await getSequences(searchTerm);

  return <HomeSearchPage searchTerm={searchTerm} sequences={sequences} />;
}
