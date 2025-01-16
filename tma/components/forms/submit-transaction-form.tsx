"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const submitTransactionSchema = z.object({
  receiver: z.string().regex(/^0x[a-fA-F0-9]{63,64}$/, "Invalid Starknet address"),
  amount: z.string().min(1, "Amount is required"),
  token: z.string()
});

type SubmitTransactionFormProps = {
  onSubmit: (receiver: string, amount: string, token: string) => Promise<void>;
  supportedTokens: string[];
  estimatedGas?: string;
};

export function SubmitTransactionForm({
  onSubmit,
  supportedTokens,
  estimatedGas
}: SubmitTransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(submitTransactionSchema),
    defaultValues: {
      receiver: "",
      amount: "",
      token: supportedTokens[0]
    }
  });

  const onSubmitForm = async (data: z.infer<typeof submitTransactionSchema>) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data.receiver, data.amount, data.token);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <DialogTitle className="text-xl font-semibold mb-4">Submit Transaction</DialogTitle>
      <Card className="p-6 space-y-4">
        <div>
          <Label htmlFor="receiver">Receiver Address</Label>
          <Input
            {...register("receiver")}
            placeholder="0x..."
            className="mt-1"
          />
          {errors.receiver && (
            <p className="mt-1 text-sm text-destructive">
              {errors.receiver.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              {...register("amount")}
              type="number"
              step="any"
              min="0"
              placeholder="0.0"
              className="mt-1"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-destructive">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div>
            <Label>Token</Label>
            <Select
              value={watch("token")}
              onValueChange={(value) => setValue("token", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedTokens.map((token) => (
                  <SelectItem key={token} value={token}>
                    {token}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {estimatedGas && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground"
          >
            Estimated Gas: {estimatedGas}
          </motion.div>
        )}
      </Card>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Submit Transaction
      </Button>
    </form>
  );
}