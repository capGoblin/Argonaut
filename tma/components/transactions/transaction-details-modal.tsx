"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Check, X, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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

type TransactionDetailsModalProps = {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (txId: string) => Promise<void>;
  onRevoke: (txId: string) => Promise<void>;
  onExecute: (txId: string) => Promise<void>;
  isConfirmed: boolean;
};

export function TransactionDetailsModal({
  transaction,
  isOpen,
  onClose,
  onConfirm,
  onRevoke,
  onExecute,
  isConfirmed,
}: TransactionDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!transaction) return null;

  const handleAction = async (action: (txId: string) => Promise<void>) => {
    setIsLoading(true);
    try {
      await action(transaction.id);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const truncateAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <Dialog open={isOpen} onOpenChange={() => !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100vh-12rem)] mt-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Transaction Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To:</span>
                  <span className="font-mono">
                    {truncateAddress(transaction.receiver)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span>
                    {transaction.amount} {transaction.token}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{format(transaction.timestamp, "PPp")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="capitalize">{transaction.status}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2">Confirmations</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Progress:</span>
                  <span>
                    {transaction.confirmations}/
                    {transaction.requiredConfirmations}
                  </span>
                </div>
                <div className="space-y-1">
                  {transaction.signers.map((signer, index) => (
                    <div
                      key={signer}
                      className="flex justify-between items-center"
                    >
                      <span className="font-mono">
                        {truncateAddress(signer)}
                      </span>
                      <span className="text-muted-foreground">
                        Signer {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-6">
          {isLoading ? (
            <Button disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleAction(onConfirm)}
                disabled={isConfirmed}
              >
                {isConfirmed ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Confirmed
                  </>
                ) : (
                  <>Confirm</>
                )}
              </Button>
              {isConfirmed && transaction.status === "pending" && (
                <Button
                  variant="outline"
                  onClick={() => handleAction(onRevoke)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Revoke
                </Button>
              )}
              {transaction.confirmations >=
                transaction.requiredConfirmations && (
                <Button
                  variant="default"
                  onClick={() => handleAction(onExecute)}
                  disabled={transaction.status === "executed"}
                >
                  {transaction.status === "executed" ? (
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
      </DialogContent>
    </Dialog>
  );
}
