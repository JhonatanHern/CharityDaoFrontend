import { BaseError } from "viem";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import Button from "./Button";

export function Connect() {
  const { connector, isConnected } = useAccount();
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div>
      <div>
        {isConnected && (
          <Button onClick={() => disconnect()} type="secondary">
            Disconnect from {connector?.name}
          </Button>
        )}

        {connectors
          .filter((x) => x.ready && x.id !== connector?.id)
          .map((x) => (
            <Button key={x.id} onClick={() => connect({ connector: x })}>
              Connect with {x.name}
              {isLoading && x.id === pendingConnector?.id && " (connecting)"}
            </Button>
          ))}
      </div>

      {error && <div>{(error as BaseError).shortMessage}</div>}
    </div>
  );
}
