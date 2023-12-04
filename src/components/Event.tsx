import { useEffect, useMemo, useState } from "react";
import {
  useContractWrite,
  usePrepareContractWrite,
  useAccount,
  useWaitForTransaction,
} from "wagmi";
import Button from "./Button";
import { ethers } from "ethers";
import {
  DAOContractConfig,
  daoTokenContractConfig,
  paymentTokenContractConfig,
} from "../utils/contracts";

type EventProps = {
  event: any;
  daoTokenBalance?: any;
  userDaoTokenAllowance?: bigint;
  allowanceSettingWrite?: () => void;
  votes?: any[];
  hasBeenExecuted?: boolean;
  refetchEvents?: () => void;
};

function Event({
  event,
  daoTokenBalance,
  userDaoTokenAllowance,
  allowanceSettingWrite,
  votes,
  hasBeenExecuted,
  refetchEvents,
}: EventProps) {
  const { address } = useAccount();
  const [voteAmount, setVoteAmount] = useState(1);

  const alreadyVoted = useMemo(() => {
    return (votes || []).find((vote) => vote.voter === address);
  }, [votes, address]);

  const voteAddress =
    event.deadline > new Date() &&
    userDaoTokenAllowance &&
    voteAmount > 0 &&
    !alreadyVoted
      ? DAOContractConfig.address
      : undefined;

  const { config: trueVoteConfig } = usePrepareContractWrite({
    address: voteAddress,
    abi: DAOContractConfig.abi,
    functionName: "vote",
    args: [event.proposalId, ethers.toBigInt(voteAmount), true],
  });

  const { config: falseVoteConfig } = usePrepareContractWrite({
    address: voteAddress,
    abi: DAOContractConfig.abi,
    functionName: "vote",
    args: [event.proposalId, ethers.toBigInt(voteAmount), false],
  });

  // const { data, isLoading, isSuccess, write } = useContractWrite(config);
  const trueVote = useContractWrite(trueVoteConfig);
  const falseVote = useContractWrite(falseVoteConfig);

  // Wait for transactions to finish
  const { isSuccess: trueVoteTransactionFinished } = useWaitForTransaction({
    hash: trueVote.data?.hash,
  });
  const { isSuccess: falseVoteTransactionFinished } = useWaitForTransaction({
    hash: falseVote.data?.hash,
    confirmations: 3,
  });

  useEffect(() => {
    if (trueVoteTransactionFinished || falseVoteTransactionFinished) {
      setTimeout(() => {
        refetchEvents?.();
      }, 10000);
    }
  }, [trueVoteTransactionFinished, falseVoteTransactionFinished]);

  const loading = trueVote.isLoading || falseVote.isLoading;
  const error = trueVote.error || falseVote.error;
  const isSuccess = trueVote.isSuccess || falseVote.isSuccess;

  const vote = async (vote: boolean) => {
    if (voteAmount < 1) {
      console.log("you must at least cast 1 vote");

      return;
    }
    if (vote) {
      trueVote.write?.();
    } else {
      falseVote.write?.();
    }
  };
  const setAllowance = async () => {
    allowanceSettingWrite?.();
  };

  const canBeExecuted =
    event.deadline < new Date() &&
    !hasBeenExecuted &&
    votes &&
    votes.length >= event.minimumVotes &&
    votes.filter((v) => v.inSupport === "true").length >
      votes.filter((v) => v.inSupport !== "true").length;

  const { config: executionConfig } = usePrepareContractWrite({
    address: canBeExecuted ? DAOContractConfig.address : undefined,
    abi: DAOContractConfig.abi,
    functionName: "executeProposal",
    args: [event.proposalId],
  });

  const executeProposal = useContractWrite(executionConfig);

  if (canBeExecuted) {
    console.log({ executeProposal });
  }

  return (
    <div className="p-4 mx-5 relative rounded bg-[#282828]">
      <p className="text-lg font-bold green-underline">
        {event.metadata.title}
      </p>
      <img src={event.metadata.imageURL} className="w-full h-[200px]" alt="" />
      <p>{event.metadata.description}</p>
      <p className="text-xs">Deadline: {event.deadline.toString()}</p>
      <p className="text-xs">Minimum Votes: {event.minimumVotes}</p>
      <p className="text-xs">
        Proposed Donation Amount:{" "}
        {ethers.formatUnits(
          event.proposedDonationAmount,
          paymentTokenContractConfig.decimals
        )}{" "}
        {paymentTokenContractConfig?.symbol}
      </p>
      <p className="text-xs">Recipient: {event.recipient}</p>
      {votes && (
        <>
          <br />
          <p className="text-xs">
            YES votes: {votes.filter((v) => v.inSupport === "true").length}
          </p>
          <p className="text-xs">
            NO votes: {votes.filter((v) => v.inSupport !== "true").length}
          </p>
        </>
      )}
      {event.deadline > new Date() && (
        <>
          <br />
          <p className="text-xs">Votes to cast:</p>
          <input
            className="bg-transparent border-white border-2 rounded"
            type="number"
            defaultValue={voteAmount}
            onChange={(e) => setVoteAmount(Number(e.target.value))}
          />
          <p className="text-xs">
            Cost of voting: {voteAmount ** 2} {daoTokenContractConfig?.symbol}{" "}
            tokens{" "}
            {!!daoTokenBalance && (
              <>
                (current balance {daoTokenBalance.formatted}{" "}
                {daoTokenContractConfig?.symbol})
              </>
            )}
          </p>
          {!loading && !error && !isSuccess && !alreadyVoted && (
            <>
              {userDaoTokenAllowance &&
              userDaoTokenAllowance > voteAmount ** 2 ? (
                <>
                  <Button onClick={() => vote(true)}>Vote YES</Button>
                  <Button onClick={() => vote(false)} type="secondary">
                    Vote NO
                  </Button>
                </>
              ) : (
                <>
                  <p>
                    Allowing the DAO contract to take{" "}
                    {daoTokenContractConfig?.symbol} tokens from your account is
                    necessary before voting
                  </p>
                  <Button onClick={setAllowance} type="primary">
                    Allow DAO to take {daoTokenContractConfig?.symbol} tokens
                  </Button>
                </>
              )}
            </>
          )}
          <br />
        </>
      )}
      {alreadyVoted && (
        <p>
          You voted {alreadyVoted.inSupport === "true" ? "YES" : "NO"} on this
          proposal
        </p>
      )}
      {canBeExecuted &&
        !executeProposal.isLoading &&
        !executeProposal.isSuccess && (
          <>
            <br />
            <p>This proposal has passed voting and can now be executed </p>
            <Button onClick={() => executeProposal.write?.()}>Execute</Button>
          </>
        )}
      {canBeExecuted && executeProposal.isLoading && (
        <>
          <br />
          Executing proposal...
        </>
      )}
      {canBeExecuted && executeProposal.isSuccess && (
        <>
          <br />
          Proposal executed!
        </>
      )}
    </div>
  );
}

export default Event;
