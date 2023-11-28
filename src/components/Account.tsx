import { useAccount } from "wagmi";

export function Account() {
  const { address } = useAccount();

  return <div>Connected account: {address}</div>;
}
