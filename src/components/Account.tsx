import { useAccount } from "wagmi";

export function Account() {
  const { address } = useAccount();

  return <div className="text-sm">Connected account: {address}</div>;
}
