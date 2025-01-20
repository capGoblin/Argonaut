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
// const contractAddress =
//   "0x0769541b749506a33525e4fef21f9772ef51380a72818c8b88678ef359db16da";
// const contractAddress =
//   "0x01346651bbe36a643d0c1463c3fb545c7c7b8ed6d966cc718318e27fe45fe99d";
const contractAddress =
  "0x021a9763bc727b5cb431364acadbaa76b6c616b80d08713ae194a83eed78de4e";

const argentTMA = ArgentTMA.init({
  environment: "sepolia",
  appName: "Argonaut",
  appTelegramUrl: "https://t.me/theargonautbot/argonautapp",
  // appTelegramUrl: "https://t.me/boottbot/bbooot",
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
    ],
    validityDays: 30, // session validity (in days) - default: 90
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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const [data, setData] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

    const provider = new RpcProvider({
      nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno",
    });
    const { abi: contractAbi } = await provider.getClassAt(contractAddress);
    if (contractAbi === undefined) {
      throw new Error("no abi.");
    }
    const contract = new Contract(contractAbi, contractAddress, provider);
    setContract(contract);
    contract.connect(account);

    await argentTMA.requestConnection({});
  };
  useEffect(() => {
    const getContract = async () => {
      if (!account) {
        console.log("Account not initialized yet");
        return;
      }

      const provider = new RpcProvider({
        nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno",
      });

      const { abi: contractAbi } = await provider.getClassAt(contractAddress);
      if (contractAbi === undefined) {
        throw new Error("no abi.");
      }
      const newContract = new Contract(contractAbi, contractAddress, provider);
      newContract.connect(account);
      setContract(newContract);

      // Now fetch data
      const signersResult = await newContract.get_signers();
      const hexSigners = signersResult.map(
        (signer: bigint) => "0x" + signer.toString(16).padStart(64, "0")
      );

      const txLen = await newContract.get_transactions_len();
      const threshold = await newContract.get_threshold();

      // Fetch all transactions
      const allTxs: Transaction[] = [];
      for (let i = 0; i < Number(txLen.toString()); i++) {
        const tx = await newContract.get_transaction(i);
        const isExecuted = await newContract.is_executed(i);
        console.log(`Transaction ${i}:`, tx);

        // Get the receiver address from calldata[0]
        const receiverHex =
          tx[1] && tx[1][0]
            ? "0x" + BigInt(tx[1][0]).toString(16).padStart(64, "0")
            : "0x" + BigInt(tx[0].to).toString(16).padStart(64, "0");

        // Get amount from calldata[1] and calldata[2] if they exist
        const amountLow = tx[1] && tx[1][1] ? BigInt(tx[1][1]) : BigInt(0);
        const amountHigh = tx[1] && tx[1][2] ? BigInt(tx[1][2]) : BigInt(0);
        const amount = ((amountHigh << BigInt(128)) + amountLow).toString();
        const ethAmount = Number(amount) / 1e18; // Convert from wei to ETH

        allTxs.push({
          id: i.toString(),
          receiver: receiverHex,
          amount: ethAmount.toFixed(4),
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

  // const getSigners = async () => {
  //   if (!contract) {
  //     console.log("Contract not initialized yet");
  //     return;
  //   }
  //   try {
  //     // Get signers
  //     const signersResult = await contract.get_signers();
  //     console.log("Signers:", signersResult);

  //     // Convert array of signers to hex strings
  //     const hexSigners = signersResult.map(
  //       (signer: bigint) => "0x" + signer.toString(16).padStart(64, "0")
  //     );

  //     // Get transaction length
  //     const txLen = await contract.get_transactions_len();
  //     console.log("Transaction Length:", txLen.toString());

  //     // Display both signers and transaction length
  //     setData(
  //       `Signers:\n${hexSigners.join(
  //         "\n"
  //       )}\n\nTransaction Length: ${txLen.toString()}`
  //     );
  //   } catch (error) {
  //     console.error("Error:", error);
  //   }
  // };

  // useEffect(() => {
  //   getSigners();
  // }, [contract]);

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
  const handleDisconnect = async () => {
    try {
      await argentTMA.clearSession();
      setIsConnected(false);
      setAccount(null);
      setConnectionResult(null);
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };
  const handleSubmitTransaction = async (
    receiver: string,
    amount: string,
    token: string
  ) => {
    // setDebugInfo([]); // Clear previous debug info
    try {
      // setDebugInfo((prev) => [
      //   ...prev,
      //   "🚀 Starting transaction submission...",
      // ]);
      // setDebugInfo((prev) => [...prev, `📍 Receiver: ${receiver}`]);
      // setDebugInfo((prev) => [...prev, `💰 Amount: ${amount} ${token}`]);

      const provider = new RpcProvider({
        nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno",
      });

      const ethAmount = Number(amount);
      const weiAmount = ethAmount * 1e18;
      // setDebugInfo((prev) => [...prev, `🔢 Wei Amount: ${weiAmount}`]);

      const bigIntAmount = BigInt(Math.floor(weiAmount));
      const uint256Value = uint256.bnToUint256(bigIntAmount);
      // setDebugInfo((prev) => [
      //   ...prev,
      //   `📊 Amount Low: ${uint256Value.low.toString(16)}`,
      // ]);
      // setDebugInfo((prev) => [
      //   ...prev,
      //   `📊 Amount High: ${uint256Value.high.toString(16)}`,
      // ]);

      const { abi: contractAbi } = await provider.getClassAt(contractAddress);
      if (contractAbi === undefined) {
        throw new Error("no abi.");
      }
      const contract = new Contract(contractAbi, contractAddress, provider);
      contract.connect(account);

      const txLen = await contract.get_transactions_len();
      const nonce = BigInt(txLen.toString()).toString();
      // setDebugInfo((prev) => [...prev, `🔄 Nonce: ${nonce}`]);

      const calls = contract.populate("submit_transaction", [
        "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7", // Using receiver as 'to' parameter
        "0x0083afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e",
        [
          receiver,
          uint256Value.low.toString(16),
          uint256Value.high.toString(16),
        ],
        nonce,
      ]);
      // setDebugInfo((prev) => [...prev, "📝 Populated transaction call"]);

      const maxQtyGasAuthorized = BigInt(4000);
      const maxPriceAuthorizeForOneGas = BigInt(70) * BigInt(1000000000000);

      // setDebugInfo((prev) => [...prev, `⛽ Gas Limit: ${maxQtyGasAuthorized}`]);
      // setDebugInfo((prev) => [
      //   ...prev,
      //   `💰 Gas Price: ${maxPriceAuthorizeForOneGas}`,
      // ]);

      // setDebugInfo((prev) => [...prev, "⏳ Executing transaction..."]);
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

      // setDebugInfo((prev) => [
      //   ...prev,
      //   `📜 Transaction Hash: ${transaction_hash}`,
      // ]);
      // setDebugInfo((prev) => [
      //   ...prev,
      //   "⌛ Waiting for transaction confirmation...",
      // ]);

      await provider.waitForTransaction(transaction_hash);
      // setDebugInfo((prev) => [
      //   ...prev,
      //   "✅ Transaction confirmed successfully!",
      // ]);

      // setTimeout(() => {
      //   setDebugInfo([]);
      // }, 5000);
      setActiveDialog(null);
    } catch (error: any) {
      // setDebugInfo((prev) => [...prev, `❌ Error: ${error.message}`]);
      console.error("Error submitting transaction:", error);
    }
  };

  const handleConfirmTransaction = async (txId: string) => {
    setError(null);
    setIsLoading(true);
    try {
      if (!contract || !account) {
        throw new Error("Please connect your wallet first");
      }

      const provider = new RpcProvider({
        nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno",
      });

      const nonce = BigInt(txId).toString();
      const calls = contract.populate("confirm_transaction", [nonce]);

      const maxQtyGasAuthorized = BigInt(4000);
      const maxPriceAuthorizeForOneGas = BigInt(70) * BigInt(1000000000000);

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

      await provider.waitForTransaction(transaction_hash);
      setRefresh((prev) => prev + 1);
    } catch (error: any) {
      setError(error.message || "Failed to confirm transaction");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeConfirmation = async (txId: string) => {
    console.log("Revoking confirmation:", txId);
    try {
      // Convert txId to nonce (u128)
      const nonce = BigInt(txId).toString();

      const calls = contract.populate("revoke_confirmation", [nonce]);

      const maxQtyGasAuthorized = BigInt(4000); // max quantity of gas authorized
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
      console.log("Confirmation revoked successfully");

      // Refresh the transactions list
      setRefresh((prev) => prev + 1);
    } catch (error) {
      console.error("Error revoking confirmation:", error);
    }
  };

  const handleExecuteTransaction = async (txId: string) => {
    setError(null);
    setIsLoading(true);
    try {
      if (!contract || !account) {
        throw new Error("Please connect your wallet first");
      }

      const provider = new RpcProvider({
        nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno",
      });

      const nonce = BigInt(txId).toString();
      const calls = contract.populate("execute_transaction", [nonce]);

      const maxQtyGasAuthorized = BigInt(4000);
      const maxPriceAuthorizeForOneGas = BigInt(70) * BigInt(1000000000000);

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

      await provider.waitForTransaction(transaction_hash);
      setRefresh((prev) => prev + 1);
    } catch (error: any) {
      setError(error.message || "Failed to execute transaction");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)]">
      <div className="container max-w-2xl mx-auto p-4 space-y-6">
        {/* <div className="text-[var(--tg-theme-text-color)] space-y-4">
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
        </div> */}

        <h1 className="text-[var(--tg-font-headline)] font-bold text-center mb-6 text-[var(--tg-theme-text-color)]">
          Argonaut Multisig Wallet
        </h1>
        {/* <div className="flex justify-between items-center">
          <h1 className="text-[var(--tg-font-headline)] font-bold text-center mb-6 text-[var(--tg-theme-text-color)]">
            Argonaut Multisig Wallet
          </h1>
          {isConnected && (
            <button
              className="tg-button-secondary h-10 px-4 flex items-center justify-center touch-feedback"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          )}
        </div> */}

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
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                {error}
              </div>
            )}
            <div className="tg-card px-2 sm:px-4">
              <TransactionsList
                transactions={transactions}
                onConfirm={handleConfirmTransaction}
                onRevoke={handleRevokeConfirmation}
                onExecute={handleExecuteTransaction}
                contract={contract}
                signerAddress={connectionResult?.account?.address}
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
                  estimatedGas="0.00001 ETH"
                />
              </DialogContent>
            </Dialog>

            {isConnected && debugInfo.length > 0 && (
              <div className="fixed top-4 right-4 left-4 z-50">
                <div className="bg-black/90 text-green-400 p-4 rounded-lg shadow-lg font-mono text-sm max-h-[70vh] overflow-y-auto">
                  <h3 className="text-white mb-2">Debug Information:</h3>
                  {debugInfo.map((info, index) => (
                    <div key={index} className="mb-1">
                      {info}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
