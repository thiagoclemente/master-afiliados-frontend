import PromoterListsScreen from "@/components/promoter/PromoterListsScreen";

type PromoterListsDetailPageProps = {
  params: Promise<{
    documentId: string;
  }>;
};

export default async function PromoterListsDetailPage({
  params,
}: PromoterListsDetailPageProps) {
  const resolvedParams = await params;

  return (
    <PromoterListsScreen
      routeMode="detail"
      routeDocumentId={resolvedParams.documentId}
    />
  );
}
