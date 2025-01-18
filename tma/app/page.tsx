"use client";

import { useState, useEffect } from "react";
import { ArgentTMA } from "@argent/tma-wallet";
import { CreateMultisigForm } from "@/components/forms/create-multisig-form";
import { SubmitTransactionForm } from "@/components/forms/submit-transaction-form";
import { TransactionsList } from "@/components/transactions/transaction-list";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, Send } from "lucide-react";
import type { Transaction } from "@/components/transactions/transaction-list";
import {
  Account,
  cairo,
  Contract,
  uint256,
  num,
  RPC,
  provider,
} from "starknet";
import { RpcProvider } from "starknet";

// Mock data for demonstration
const mockTransactions: Transaction[] = [
  {
    id: "1",
    receiver:
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    amount: "1.5",
    token: "ETH",
    confirmations: 2,
    requiredConfirmations: 3,
    signers: [
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "0x2234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    ],
    status: "pending",
    timestamp: Date.now(),
  },
];
const contractAddress =
  "0x0769541b749506a33525e4fef21f9772ef51380a72818c8b88678ef359db16da";
const argentTMA = ArgentTMA.init({
  environment: "sepolia",
  appName: "Argonaut",
  // appTelegramUrl: "https://t.me/theargonautbot/argonautapp",
  appTelegramUrl: "https://t.me/boottbot/bbooot",
  sessionParams: {
    allowedMethods: [
      // List of contracts/methods allowed to be called by the session key
      {
        contract: contractAddress,
        selector: "submit_transaction",
      },
      {
        contract: contractAddress,
        selector: "confirm_transaction",
      },
      {
        contract: contractAddress,
        selector: "revoke_confirmation",
      },
      {
        contract: contractAddress,
        selector: "execute_transaction",
      },
      {
        contract: contractAddress,
        selector: "get_transactions_len",
      },
      {
        contract: contractAddress,
        selector: "get_signers",
      },
      {
        contract: contractAddress,
        selector: "get_threshold",
      },
      {
        contract: contractAddress,
        selector: "get_transaction",
      },
      {
        contract: contractAddress,
        selector: "is_confirmed",
      },
    ],
    validityDays: 90, // session validity (in days) - default: 90
  },
});

export default function Home() {
  const [activeDialog, setActiveDialog] = useState<"create" | "submit" | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<any>(null);
  const [argentTMAInstance, setArgentTMAInstance] = useState<any>(null);
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [contractAbi, setContractAbi] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);

  const [data, setData] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refresh, setRefresh] = useState(0);

  // useEffect(() => {
  //   const connect = async () => {

  //     setArgentTMAInstance(argentTMA);
  //     console.log(argentTMA, "argentTMA");

  //     const res = await argentTMA.connect();
  //     setConnectionResult(res);
  //     console.log(res, "res");
  //   };
  //   connect();
  // }, []);

  useEffect(() => {
    // Call connect() as soon as the app is loaded
    argentTMA
      .connect()
      .then((res) => {
        if (!res) {
          // Not connected
          setIsConnected(false);
          return;
        }

        if (res.account.getSessionStatus() !== "VALID") {
          // Session has expired or scope (allowed methods) has changed
          // A new connection request should be triggered

          // The account object is still available to get access to user's address
          // but transactions can't be executed
          const { account } = res;

          setAccount(account);
          setIsConnected(false);
          return;
        }

        // Connected
        const { account, callbackData } = res;
        // The session account is returned and can be used to submit transactions
        setAccount(account);
        setIsConnected(true);
        setConnectionResult(res);

        // Custom data passed to the requestConnection() method is available here
        console.log("callback data:", callbackData);
      })
      .catch((err) => {
        console.error("Failed to connect", err);
      });
  }, []);

  const handleConnect = async () => {
    console.log("handleConnect");
    // await argentTMA.requestConnection({
    //   callbackData: "custom_callback",
    //   approvalRequests: [
    //     {
    //       tokenAddress:
    //         "0x049D36570D4e46f48e99674bd3fcc84644DdD6b96F7C741B1562B82f9e004dC7",
    //       amount: BigInt(1000000000000000000).toString(),
    //       spender: "spender_address",
    //     },
    //   ],
    // });

    // await argentTMA.connect();

    const provider = new RpcProvider({
      nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno",
    });
    const { abi: contractAbi } = await provider.getClassAt(contractAddress);
    if (contractAbi === undefined) {
      throw new Error("no abi.");
    }
    // setContractAbi(contractAbi);
    const contract = new Contract(contractAbi, contractAddress, provider);
    setContract(contract);
    // const privateKey0 = connectionResult?.account?.signer?.pk;
    // const account0Address = connectionResult?.account?.address;

    // const account = new Account(provider, account0Address, privateKey0);

    // 4. Connect account to contract (missing)
    contract.connect(account);

    await argentTMA.requestConnection({});
  };
  useEffect(() => {
    const getContract = async () => {
      const provider = new RpcProvider({
        nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno",
      });
      const { abi: contractAbi } = await provider.getClassAt(contractAddress);
      if (contractAbi === undefined) {
        throw new Error("no abi.");
      }
      const contract = new Contract(contractAbi, contractAddress, provider);
      contract.connect(account);
      setContract(contract);

      // Fetch signers
      const signersResult = await contract.get_signers();
      const hexSigners = signersResult.map(
        (signer: bigint) => "0x" + signer.toString(16).padStart(64, "0")
      );

      // Get transaction length
      const txLen = await contract.get_transactions_len();
      console.log("Transaction Length:", txLen.toString());

      const threshold = await contract.get_threshold();
      console.log("Threshold:", threshold.toString());

      // Fetch all transactions
      const allTxs: Transaction[] = [];
      for (let i = 0; i < Number(txLen.toString()); i++) {
        const tx = await contract.get_transaction(i);
        const isExecuted = await contract.is_executed(i);
        console.log(`Transaction ${i}:`, tx, "Executed:", isExecuted);

        const receiverHex =
          "0x" + BigInt(tx[0].to).toString(16).padStart(64, "0");

        allTxs.push({
          id: i.toString(),
          receiver: receiverHex,
          amount: "0.0001",
          token: "ETH",
          confirmations: Number(tx[0].confirmations),
          requiredConfirmations: Number(threshold.toString()),
          signers: hexSigners,
          status: Number(isExecuted) === 1 ? "executed" : "pending",
          timestamp: Date.now(),
        });
      }
      setTransactions(allTxs);

      // Update UI with signers and tx length
      setData(
        `Signers:\n${hexSigners.join(
          "\n"
        )}\n\nTransaction Length: ${txLen.toString()}`
      );
    };
    getContract();
  }, [account, refresh]);

  const getSigners = async () => {
    if (!contract) {
      console.log("Contract not initialized yet");
      return;
    }
    try {
      // Get signers
      const signersResult = await contract.get_signers();
      console.log("Signers:", signersResult);

      // Convert array of signers to hex strings
      const hexSigners = signersResult.map(
        (signer: bigint) => "0x" + signer.toString(16).padStart(64, "0")
      );

      // Get transaction length
      const txLen = await contract.get_transactions_len();
      console.log("Transaction Length:", txLen.toString());

      // Display both signers and transaction length
      setData(
        `Signers:\n${hexSigners.join(
          "\n"
        )}\n\nTransaction Length: ${txLen.toString()}`
      );
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    getSigners();
  }, [contract]);

  const handleCreateMultisig = async (signers: string[], threshold: number) => {
    console.log("Creating multisig:", { signers, threshold });
    if (isConnected && account) {
      const provider = new RpcProvider({});

      // Deploy Test contract in devnet
      // ClassHash of the already declared contract
      const testClassHash =
        "0x0438ef686034d51c428788b54d296be635785409e683bca6ec70286db41a7818";

      const deployResponse = await account.deployContract({
        classHash: testClassHash,
      });
      await provider.waitForTransaction(deployResponse.transaction_hash);

      // read abi of Test contract
      const { abi: testAbi } = await provider.getClassByHash(testClassHash);
      if (testAbi === undefined) {
        throw new Error("no abi.");
      }

      // Connect the new contract instance:
      const myTestContract = new Contract(
        testAbi,
        deployResponse.contract_address,
        provider
      );
      console.log("✅ Test Contract connected at =", myTestContract.address);
    }
    setActiveDialog(null);
  };

  const handleSubmitTransaction = async (
    receiver: string,
    amount: string,
    token: string
  ) => {
    getSigners();
    // console.log("Submitting transaction:", { receiver, amount, token });
    // const provider = new RpcProvider({
    //   nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno",
    // });

    // const ethAmount = Number(amount);
    // const weiAmount = ethAmount * 1e18; // 1 ETH = 1e18 wei

    // // Convert wei to BigInt
    // const bigIntAmount = BigInt(Math.floor(weiAmount));

    // // Convert to uint256
    // const uint256Value = uint256.bnToUint256(bigIntAmount);

    // const { abi: contractAbi } = await provider.getClassAt(contractAddress);
    // if (contractAbi === undefined) {
    //   throw new Error("no abi.");
    // }
    // // setContractAbi(contractAbi);
    // const contract = new Contract(contractAbi, contractAddress, provider);

    // // const privateKey0 = connectionResult?.account?.signer?.pk;
    // // const account0Address = connectionResult?.account?.address;

    // // const account = new Account(provider, account0Address, privateKey0);

    // // 4. Connect account to contract (missing)
    // contract.connect(account);

    // const txLen = await contract.get_transactions_len();
    // console.log("Transaction Length:", txLen.toString());

    // // Convert txLen to proper nonce format
    // const nonce = BigInt(txLen.toString()).toString(); // Use the txLen directly without adding 1

    // const calls = contract.populate("submit_transaction", [
    //   "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7", // to
    //   "0x0083afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e", // function_selector
    //   [
    //     // function_calldata (as array)
    //     receiver,
    //     uint256Value.low.toString(16),
    //     uint256Value.high.toString(16),
    //   ],
    //   nonce, // nonce
    // ]);

    // const maxQtyGasAuthorized = BigInt(1800); // max quantity of gas authorized
    // const maxPriceAuthorizeForOneGas = BigInt(40) * BigInt(1000000000000); // increased from 12 to 40 to cover current gas price

    // const { transaction_hash } = await account.execute(calls, {
    //   version: 3,
    //   maxFee: 10 ** 15,
    //   feeDataAvailabilityMode: RPC.EDataAvailabilityMode.L1,
    //   resourceBounds: {
    //     l1_gas: {
    //       max_amount: num.toHex(maxQtyGasAuthorized),
    //       max_price_per_unit: num.toHex(maxPriceAuthorizeForOneGas),
    //     },
    //     l2_gas: {
    //       max_amount: num.toHex(0),
    //       max_price_per_unit: num.toHex(0),
    //     },
    //   },
    // });

    // await provider.waitForTransaction(transaction_hash);

    // // Convert 0.0001 ETH to wei
    // const ethAmount = Number("0.0001");
    // const weiAmount = ethAmount * 1e18; // 1 ETH = 1e18 wei

    // // Convert wei to BigInt
    // const bigIntAmount = BigInt(Math.floor(weiAmount));

    // // Convert to uint256
    // const uint256Value = uint256.bnToUint256(bigIntAmount);

    // // Now you can use uint256Value.low and uint256Value.high in your calldata
    // const calldata = [
    //   "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7", // to
    //   "0x0083afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e", // selector
    //   "3", // calldata_len
    //   "0x033439fff5aa4782fd2323a01c5F51a1c1F98Cd6c1C824784EE45b3c4AFe1b79", // recipient
    //   uint256Value.low.toString(16), // amount low
    //   uint256Value.high.toString(16), // amount high
    //   "0", // salt
    // ];

    // const result = await account.execute({
    //   contractAddress: contractAddress,
    //   entrypoint: "submit_transaction",
    //   calldata: calldata,
    // });
    // console.log(result, "result");
    // await provider.waitForTransaction(result.transaction_hash);

    setActiveDialog(null);
  };

  const handleConfirmTransaction = async (txId: string) => {
    console.log("Confirming transaction:", txId);
    try {
      // Convert txId to nonce (u128)
      const nonce = BigInt(txId).toString();

      const calls = contract.populate("confirm_transaction", [nonce]);

      const maxQtyGasAuthorized = BigInt(1800); // max quantity of gas authorized
      const maxPriceAuthorizeForOneGas = BigInt(40) * BigInt(1000000000000); // max FRI authorized to pay 1 gas

      const { transaction_hash } = await account.execute(calls, {
        version: 3,
        maxFee: 10 ** 15,
        feeDataAvailabilityMode: RPC.EDataAvailabilityMode.L1,
        resourceBounds: {
          l1_gas: {
            max_amount: num.toHex(maxQtyGasAuthorized),
            max_price_per_unit: num.toHex(maxPriceAuthorizeForOneGas),
          },
          l2_gas: {
            max_amount: num.toHex(0),
            max_price_per_unit: num.toHex(0),
          },
        },
      });

      await contract.provider.waitForTransaction(transaction_hash);
      console.log("Transaction confirmed successfully");

      // Trigger refresh by incrementing the counter
      setRefresh((prev) => prev + 1);
    } catch (error) {
      console.error("Error confirming transaction:", error);
    }
  };

  const handleRevokeConfirmation = async (txId: string) => {
    console.log("Revoking confirmation:", txId);
  };

  const handleExecuteTransaction = async (txId: string) => {
    console.log("Executing transaction:", txId);
    try {
      // Convert txId to nonce (u128)
      const nonce = BigInt(txId).toString();

      const calls = contract.populate("execute_transaction", [nonce]);

      const maxQtyGasAuthorized = BigInt(1800); // max quantity of gas authorized
      const maxPriceAuthorizeForOneGas = BigInt(40) * BigInt(1000000000000); // max FRI authorized to pay 1 gas

      const { transaction_hash } = await account.execute(calls, {
        version: 3,
        maxFee: 10 ** 15,
        feeDataAvailabilityMode: RPC.EDataAvailabilityMode.L1,
        resourceBounds: {
          l1_gas: {
            max_amount: num.toHex(maxQtyGasAuthorized),
            max_price_per_unit: num.toHex(maxPriceAuthorizeForOneGas),
          },
          l2_gas: {
            max_amount: num.toHex(0),
            max_price_per_unit: num.toHex(0),
          },
        },
      });

      await contract.provider.waitForTransaction(transaction_hash);
      console.log("Transaction executed successfully");

      // Refresh the transactions list
      setRefresh((prev) => prev + 1);
    } catch (error) {
      console.error("Error executing transaction:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)]">
      <div className="container max-w-2xl mx-auto p-4 space-y-6">
        <div className="text-[var(--tg-theme-text-color)] space-y-4">
          <h2>Debug Info:</h2>
          <div>
            <h3>ArgentTMA Instance:</h3>
            <pre className="overflow-auto">
              {JSON.stringify(argentTMA, null, 2)}
            </pre>
          </div>
          <div>
            <h3>Connection Result:</h3>
            <pre className="overflow-auto">
              {JSON.stringify(connectionResult, null, 2)}
            </pre>
          </div>
          <div>
            <h3>Number of Transactions:</h3>
            <pre className="overflow-auto">{data ? data : "Loading..."}</pre>
          </div>
          {/* <div>
            <h3>Signers:</h3>
            <pre className="overflow-auto">
              {signers.length > 0
                ? signers.map((signer, index) => (
                    <div key={index}>{signer}</div>
                  ))
                : "Loading signers..."}
            </pre>
          </div> */}
        </div>

        <h1 className="text-[var(--tg-font-headline)] font-bold text-center mb-6 text-[var(--tg-theme-text-color)]">
          Multisig Wallet
        </h1>

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <p className="text-[var(--tg-theme-text-color)]">
              Connect your wallet to continue
            </p>
            <button
              className="tg-button h-12 px-6 flex items-center justify-center touch-feedback"
              onClick={handleConnect}
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            <div className="tg-card">
              <TransactionsList
                transactions={transactions}
                onConfirm={handleConfirmTransaction}
                onRevoke={handleRevokeConfirmation}
                onExecute={handleExecuteTransaction}
              />
            </div>

            {/* Action Buttons */}
            <div className="fixed bottom-6 left-0 right-0 px-4">
              <div className="container max-w-2xl mx-auto flex gap-4">
                <button
                  className="tg-button flex-1 h-12 flex items-center justify-center touch-feedback"
                  onClick={() => setActiveDialog("submit")}
                >
                  <Send className="w-5 h-5 mr-2" />
                  New Transaction
                </button>
                <button
                  className="tg-button flex-1 h-12 flex items-center justify-center touch-feedback"
                  onClick={() => setActiveDialog("create")}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Multisig
                </button>
              </div>
            </div>

            {/* Dialogs */}
            <Dialog
              open={activeDialog === "create"}
              onOpenChange={() => setActiveDialog(null)}
            >
              <DialogContent className="bg-[var(--tg-theme-modal-bg)] border-[var(--tg-theme-divider)] sm:max-w-[425px]">
                <CreateMultisigForm
                  onSubmit={handleCreateMultisig}
                  maxSigners={10}
                />
              </DialogContent>
            </Dialog>

            <Dialog
              open={activeDialog === "submit"}
              onOpenChange={() => setActiveDialog(null)}
            >
              <DialogContent className="bg-[var(--tg-theme-modal-bg)] border-[var(--tg-theme-divider)] sm:max-w-[425px]">
                <SubmitTransactionForm
                  onSubmit={handleSubmitTransaction}
                  supportedTokens={["ETH", "STRK"]}
                  estimatedGas="0.001 ETH"
                />
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}
