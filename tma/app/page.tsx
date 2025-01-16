"use client";

import { useState } from "react";
import { CreateMultisigForm } from "@/components/forms/create-multisig-form";
import { SubmitTransactionForm } from "@/components/forms/submit-transaction-form";
import { TransactionsList } from "@/components/transactions/transaction-list";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, Send } from "lucide-react";

// Mock data for demonstration
const mockTransactions = [
  {
    id: "1",
    receiver: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
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

export default function Home() {
  const [activeDialog, setActiveDialog] = useState<"create" | "submit" | null>(null);

  const handleCreateMultisig = async (signers: string[], threshold: number) => {
    console.log("Creating multisig:", { signers, threshold });
    setActiveDialog(null);
  };

  const handleSubmitTransaction = async (
    receiver: string,
    amount: string,
    token: string
  ) => {
    console.log("Submitting transaction:", { receiver, amount, token });
    setActiveDialog(null);
  };

  const handleConfirmTransaction = async (txId: string) => {
    console.log("Confirming transaction:", txId);
  };

  const handleRevokeConfirmation = async (txId: string) => {
    console.log("Revoking confirmation:", txId);
  };

  const handleExecuteTransaction = async (txId: string) => {
    console.log("Executing transaction:", txId);
  };

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)]">
      {/* Main Transactions Dashboard */}
      <div className="container max-w-2xl mx-auto p-4 space-y-6">
        <h1 className="text-[var(--tg-font-headline)] font-bold text-center mb-6 text-[var(--tg-theme-text-color)]">
          Multisig Wallet
        </h1>
        
        <div className="tg-card">
          <TransactionsList
            transactions={mockTransactions}
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
      </div>

      {/* Dialogs */}
      <Dialog open={activeDialog === "create"} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="bg-[var(--tg-theme-modal-bg)] border-[var(--tg-theme-divider)] sm:max-w-[425px]">
          <CreateMultisigForm
            onSubmit={handleCreateMultisig}
            maxSigners={10}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === "submit"} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="bg-[var(--tg-theme-modal-bg)] border-[var(--tg-theme-divider)] sm:max-w-[425px]">
          <SubmitTransactionForm
            onSubmit={handleSubmitTransaction}
            supportedTokens={["ETH", "STRK"]}
            estimatedGas="0.001 ETH"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}