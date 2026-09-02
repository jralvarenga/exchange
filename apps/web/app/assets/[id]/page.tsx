export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <div>AssetDetailPage {id}</div>
}