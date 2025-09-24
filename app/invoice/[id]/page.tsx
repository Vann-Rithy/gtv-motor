import InvoiceClientPage from "./InvoiceClientPage"

// Add generateStaticParams for static export
export async function generateStaticParams() {
  // Generate static params for common invoice IDs
  const invoiceIds = ["SR25-0207", "1", "2", "3", "4", "5"]

  return invoiceIds.map((id) => ({
    id: id,
  }))
}

export default function InvoicePage({ params }: { params: { id: string } }) {
  return <InvoiceClientPage params={params} />
}
