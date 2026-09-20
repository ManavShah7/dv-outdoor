import { AcceptInvite } from "@/components/auth/AcceptInvite";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <AcceptInvite token={token} />;
}
