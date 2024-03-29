import {
  useAccount,
  useContractRead,
  useBalance,
  useToken,
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";

import { Account } from "./components/Account";
import { Connect } from "./components/Connect";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import Event from "./components/Event";
import {
  daoTokenContractConfig,
  paymentTokenContractConfig,
  DAOContractConfig,
} from "./utils/contracts";
import Donate from "./components/Donate";
import { ethers } from "ethers";
import { useEffect } from "react";

export function App() {
  const { isConnected, address } = useAccount();

  const { data: daoTokenBalance } = useBalance({
    token: daoTokenContractConfig.address,
    address,
  });
  const { data: paymentTokenBalance } = useBalance({
    token: paymentTokenContractConfig.address,
    address,
  });

  const { data: userDaoTokenAllowance, refetch: userDaoTokenAllowanceRefetch } =
    useContractRead({
      address: daoTokenContractConfig.address,
      abi: daoTokenContractConfig.abi,
      functionName: "allowance",
      args: address ? [address, DAOContractConfig.address] : undefined,
    });

  const { config: createAllowanceConfig } = usePrepareContractWrite({
    address: daoTokenContractConfig.address,
    abi: daoTokenContractConfig.abi,
    functionName: "approve",
    args: [DAOContractConfig.address, ethers.toBigInt(ethers.MaxUint256)],
  });

  const { write: allowanceSettingWrite, data: setAllowanceCallData } =
    useContractWrite(createAllowanceConfig);

  const events = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const rawEvents = await axios.get("http://localhost:8080/serveEvents");
      for (const event of rawEvents.data.proposalsCreated) {
        event.deadline = new Date(event.deadline * 1000);
      }
      rawEvents.data.proposalsExecuted = rawEvents.data.proposalsExecuted.map(
        (p: any) => p.proposalId
      );
      return rawEvents.data;
    },
  });

  const { isSuccess: allowanceTransactionFinished } = useWaitForTransaction({
    hash: setAllowanceCallData?.hash,
  });
  useEffect(() => {
    if (allowanceTransactionFinished) {
      window.location.reload();
    }
  }, [allowanceTransactionFinished]);

  return (
    <main className="pb-5 px-[5vw] h-[100vh] overflow-y-auto relative">
      <header className="flex justify-between mb-4 items-center sticky top-[0] z-10 bg-[#343434]">
        <div className="flex items-center">
          <img
            src="./tech-logo.jpeg"
            className="inline-block h-14 w-14 rounded-full mx-3"
          />
          <h1 className="bg-red text-3xl font-bold inline-block">
            Charity DAO
          </h1>
        </div>
        <Connect />
      </header>

      {isConnected && (
        <>
          <Account />
          <p className="text-sm">
            Funding coin Balance: {paymentTokenBalance?.formatted}{" "}
            {paymentTokenContractConfig?.symbol}
          </p>
          <p className="text-sm">
            DAO coin Balance: {daoTokenBalance?.formatted}{" "}
            {daoTokenContractConfig?.symbol}
          </p>
          <Donate
            daoTokenBalance={daoTokenBalance}
            paymentTokenBalance={paymentTokenBalance}
          />
          <h2 className="text-xl">Active proposals:</h2>
          {events.isFetched && (
            <div className="flex my-7 max-w-[95vw] overflow-x-auto">
              {events.data.proposalsCreated
                .filter((event: any) => event.deadline > new Date())
                .map((event: any) => (
                  <Event
                    event={event}
                    key={event.proposalId}
                    daoTokenBalance={daoTokenBalance}
                    userDaoTokenAllowance={userDaoTokenAllowance}
                    allowanceSettingWrite={allowanceSettingWrite}
                    votes={events.data.proposalsVoted.filter(
                      (vote: any) => vote.proposalId === event.proposalId
                    )}
                    refetchEvents={events.refetch}
                  />
                ))}
            </div>
          )}
          {events.isLoading && <p>Loading...</p>}
          {events.isError && <p>Load error</p>}
          <h2 className="text-xl">Expired proposals:</h2>
          {events.isFetched && (
            <div className="flex my-7 max-w-[95vw] overflow-x-auto">
              {events.data.proposalsCreated
                .filter(
                  (event: any) =>
                    event.deadline <= new Date() &&
                    !events.data.proposalsExecuted.includes(event.proposalId)
                )
                .map((event: any) => (
                  <Event
                    event={event}
                    key={event.proposalId}
                    votes={events.data.proposalsVoted.filter(
                      (vote: any) => vote.proposalId === event.proposalId
                    )}
                  />
                ))}
            </div>
          )}
          {events.isLoading && <p>Loading...</p>}
          {events.isError && <p>Load error</p>}
          <h2 className="text-xl">Executed proposals:</h2>
          {events.isFetched && (
            <div className="flex my-7 max-w-[95vw] overflow-x-auto">
              {events.data.proposalsCreated
                .filter(
                  (event: any) =>
                    event.deadline <= new Date() &&
                    events.data.proposalsExecuted.includes(event.proposalId)
                )
                .map((event: any) => (
                  <Event
                    event={event}
                    key={event.proposalId}
                    votes={events.data.proposalsVoted.filter(
                      (vote: any) => vote.proposalId === event.proposalId
                    )}
                    hasBeenExecuted={true}
                  />
                ))}
            </div>
          )}
          {events.isLoading && <p>Loading...</p>}
          {events.isError && <p>Load error</p>}
        </>
      )}
      {!isConnected && (
        <>
          <h1 className="text-3xl mt-12 mb-5 text-center">
            Welcome to the Charity DAO
          </h1>
          <p className="text-xl text-center">
            Please connect your wallet to participate
          </p>
        </>
      )}
    </main>
  );
}
