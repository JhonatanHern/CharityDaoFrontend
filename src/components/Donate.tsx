import { useEffect, useState } from "react";
import {
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useAccount,
  useWaitForTransaction,
} from "wagmi";
import Button from "./Button";
import { ethers } from "ethers";
import {
  DAOContractConfig,
  paymentTokenContractConfig,
  daoTokenContractConfig,
} from "../utils/contracts";

type DonateProps = {
  daoTokenBalance?: any;
  paymentTokenBalance?: any;
};

function Donate({ paymentTokenBalance }: DonateProps) {
  const { address } = useAccount();
  const [donationAmount, setDonationAmount] = useState(100);

  const { data: allowance } = useContractRead({
    address: paymentTokenContractConfig.address,
    abi: paymentTokenContractConfig.abi,
    functionName: "allowance",
    args: address ? [address, DAOContractConfig.address] : undefined,
  });
  const { config: createAllowanceConfig } = usePrepareContractWrite({
    address: paymentTokenContractConfig.address,
    abi: paymentTokenContractConfig.abi,
    functionName: "approve",
    args: [DAOContractConfig.address, ethers.toBigInt(ethers.MaxUint256)],
  });
  const setAllowanceCall = useContractWrite(createAllowanceConfig);

  const { config } = usePrepareContractWrite({
    address: DAOContractConfig.address,
    abi: DAOContractConfig.abi,
    functionName: "donate",
    enabled:
      donationAmount > 0 &&
      !!allowance &&
      allowance >=
        BigInt(donationAmount) *
          BigInt(10) ** BigInt(paymentTokenContractConfig.decimals) &&
      (paymentTokenBalance.value || 0) >=
        BigInt(donationAmount) *
          BigInt(10) ** BigInt(paymentTokenContractConfig.decimals),
    args: [
      BigInt(donationAmount) *
        BigInt(10) ** BigInt(paymentTokenContractConfig.decimals),
    ],
  });
  const donateCall = useContractWrite(config);

  const donate = async () => {
    if (donationAmount <= 0) {
      alert("Donation amount must be greater than 0");
    }
    donateCall.write?.();
  };
  const setAllowance = async () => {
    setAllowanceCall.write?.();
  };

  // Wait for transactions to finish
  const { isSuccess: allowanceTransactionFinished } = useWaitForTransaction({
    hash: setAllowanceCall.data?.hash,
  });
  const { isSuccess: donateTransactionFinished } = useWaitForTransaction({
    hash: donateCall.data?.hash,
    confirmations: 3,
  });

  // Refresh balances after transactions
  useEffect(() => {
    if (allowanceTransactionFinished) {
      window.location.reload();
    }
  }, [allowanceTransactionFinished]);
  useEffect(() => {
    if (donateTransactionFinished) {
      window.location.reload();
    }
  }, [donateTransactionFinished]);
  return (
    <div className="inline-block p-4 m-5 rounded bg-[#282828]">
      <p className="text-lg font-bold mb-3 green-underline">
        Donate {paymentTokenContractConfig?.symbol} to the Charity DAO (you get{" "}
        {daoTokenContractConfig?.symbol} in return)
      </p>
      <div>
        Donation Amount:
        <input
          className="bg-transparent border-white border-2 rounded"
          type="number"
          defaultValue={donationAmount}
          onChange={(e) => setDonationAmount(Number(e.target.value))}
        />
        {(allowance || 0) < donationAmount ? (
          <>
            <p>
              Allowing the DAO contract to take{" "}
              {paymentTokenContractConfig?.symbol} tokens from your account is
              necessary before donating
            </p>
            <Button onClick={setAllowance} type="primary">
              Set Allowance
            </Button>
          </>
        ) : (
          <Button onClick={donate} type="primary">
            Donate
          </Button>
        )}
      </div>
    </div>
  );
}

export default Donate;
