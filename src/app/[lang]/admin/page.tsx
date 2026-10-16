import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function AdminRootPage({ params }: Props) {
  const resolvedParams = await params;
  redirect(`/${resolvedParams.lang}/admin/dashboard`);
}
