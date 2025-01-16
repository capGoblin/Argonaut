"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { DialogTitle } from "@/components/ui/dialog";

const starknetAddressRegex = /^0x[a-fA-F0-9]{63,64}$/;

const createMultisigSchema = z.object({
  signers: z.array(
    z.object({
      address: z.string().regex(starknetAddressRegex, "Invalid Starknet address")
    })
  ).min(1, "At least one signer is required"),
  threshold: z.number().min(1).max(10)
});

type CreateMultisigFormProps = {
  onSubmit: (signers: string[], threshold: number) => Promise<void>;
  maxSigners?: number;
};

export function CreateMultisigForm({ onSubmit, maxSigners = 10 }: CreateMultisigFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    resolver: zodResolver(createMultisigSchema),
    defaultValues: {
      signers: [{ address: "" }],
      threshold: 1
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "signers"
  });

  const signersCount = fields.length;

  const onSubmitForm = async (data: z.infer<typeof createMultisigSchema>) => {
    try {
      setIsSubmitting(true);
      await onSubmit(
        data.signers.map(s => s.address),
        data.threshold
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <DialogTitle className="text-xl font-semibold mb-4">Create Multisig Wallet</DialogTitle>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Signers</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ address: "" })}
              disabled={signersCount >= maxSigners}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Signer
            </Button>
          </div>

          <AnimatePresence initial={false}>
            {fields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`signers.${index}.address`}>
                      Signer {index + 1} Address
                    </Label>
                    <Input
                      {...register(`signers.${index}.address`)}
                      placeholder="0x..."
                      className="mt-1"
                    />
                    {errors.signers?.[index]?.address && (
                      <p className="mt-1 text-sm text-destructive">
                        {errors.signers[index]?.address?.message}
                      </p>
                    )}
                  </div>
                  {signersCount > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-8"
                      onClick={() => remove(index)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-6">
          <Label htmlFor="threshold">Required Confirmations</Label>
          <Input
            type="number"
            {...register("threshold", { valueAsNumber: true })}
            min={1}
            max={signersCount}
            className="mt-1"
          />
          {errors.threshold && (
            <p className="mt-1 text-sm text-destructive">
              {errors.threshold.message}
            </p>
          )}
        </div>
      </Card>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Create Multisig Wallet
      </Button>
    </form>
  );
}