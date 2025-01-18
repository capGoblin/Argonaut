"use client";

import { useState } from "react";
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
};

export function TransactionsList({
  transactions,
  onConfirm,
  onRevoke,
  onExecute,
}: TransactionsListProps) {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [loadingTxId, setLoadingTxId] = useState<string | null>(null);

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
      <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
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
                className="p-4 mb-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedTx(tx)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      To: {truncateAddress(tx.receiver)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tx.amount} {tx.token}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-muted-foreground">
                      {tx.confirmations}/{tx.requiredConfirmations}{" "}
                      confirmations
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
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
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Confirm
                        </Button>
                        {tx.confirmations >= tx.requiredConfirmations && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(tx.id, onExecute);
                            }}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Execute
                          </Button>
                        )}
                      </>
                    )}
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
      />
    </>
  );
}
