"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ExternalLink, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TransactionDetailsModal } from "./transaction-details-modal";

type Transaction = {
  id: string;
  receiver: string;
  amount: string;
  token: string;
  confirmations: number;
  requiredConfirmations: number;
  signers: string[];
  status: "pending" | "executed" | "failed";
  timestamp: number;
};

export type { Transaction };

type TransactionsListProps = {
  transactions: Transaction[];
  onConfirm: (txId: string) => Promise<void>;
  onRevoke: (txId: string) => Promise<void>;
  onExecute: (txId: string) => Promise<void>;
  contract: any;
  signerAddress: string;
};

export function TransactionsList({
  transactions,
  onConfirm,
  onRevoke,
  onExecute,
  contract,
  signerAddress,
}: TransactionsListProps) {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [loadingTxId, setLoadingTxId] = useState<string | null>(null);
  const [confirmedTxs, setConfirmedTxs] = useState<{ [key: string]: boolean }>(
    {}
  );

  useEffect(() => {
    const checkConfirmations = async () => {
      if (!contract || !signerAddress) return;

      const confirmationStatus: { [key: string]: boolean } = {};

      for (const tx of transactions) {
        const isConfirmed = await contract.is_confirmed(
          BigInt(tx.id).toString(),
          signerAddress
        );
        confirmationStatus[tx.id] = Number(isConfirmed) === 1;
      }

      setConfirmedTxs(confirmationStatus);
    };

    checkConfirmations();
  }, [transactions, contract, signerAddress]);

  const handleAction = async (
    txId: string,
    action: (txId: string) => Promise<void>
  ) => {
    setLoadingTxId(txId);
    try {
      await action(txId);
    } finally {
      setLoadingTxId(null);
    }
  };

  const truncateAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <>
      <ScrollArea className="h-[calc(100vh-12rem)] pr-0">
        <AnimatePresence initial={false}>
          {transactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card
                className="p-3 mb-3 cursor-pointer hover:shadow-md transition-shadow w-full"
                onClick={() => setSelectedTx(tx)}
              >
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="truncate">
                      <p className="font-medium">
                        To: {truncateAddress(tx.receiver)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tx.amount} {tx.token}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm text-muted-foreground">
                      {tx.confirmations}/{tx.requiredConfirmations}{" "}
                      confirmations
                    </div>

                    <div className="flex items-center gap-2">
                      {loadingTxId === tx.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(tx.id, onConfirm);
                            }}
                            disabled={confirmedTxs[tx.id]}
                          >
                            {confirmedTxs[tx.id] ? (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Confirmed
                              </>
                            ) : (
                              <>
                                {/* <Check className="w-4 h-4 mr-1" /> */}
                                Confirm
                              </>
                            )}
                          </Button>
                          {tx.confirmations >= tx.requiredConfirmations && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(tx.id, onExecute);
                              }}
                              disabled={tx.status === "executed"}
                            >
                              {tx.status === "executed" ? (
                                <>
                                  <Check className="w-4 h-4 mr-1" />
                                  Executed
                                </>
                              ) : (
                                <>Execute</>
                              )}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </ScrollArea>

      <TransactionDetailsModal
        transaction={selectedTx}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        onConfirm={onConfirm}
        onRevoke={onRevoke}
        onExecute={onExecute}
        isConfirmed={selectedTx ? confirmedTxs[selectedTx.id] : false}
      />
    </>
  );
}
