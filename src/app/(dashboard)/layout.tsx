import { WalletProviderWrapper } from "@/components/wallet/WalletProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WalletProviderWrapper>{children}</WalletProviderWrapper>;
}

