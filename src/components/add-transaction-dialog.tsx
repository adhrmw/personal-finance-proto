"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  onSuccess,
  userId,
}: AddTransactionDialogProps) {
  const [displayAmount, setDisplayAmount] = useState("");
  const [rawValue, setRawValue] = useState(0);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setDisplayAmount("");
    setRawValue(0);
    setType("expense");
    setCategory("");
    setNote("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetForm();
    onOpenChange(newOpen);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-digit chars
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
        setDisplayAmount("");
        setRawValue(0);
        return;
    }
    const val = parseInt(raw, 10);
    setRawValue(val);
    // Format with dots
    setDisplayAmount(new Intl.NumberFormat("id-ID").format(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rawValue <= 0) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("transactions").insert([
        {
          user_id: userId,
          amount: rawValue,
          type,
          category: category || "Umum", // Default if empty
          note,
          occurred_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast.success("Tersimpan!");
      onSuccess();
      handleOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan transaksi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-106">
        <DialogHeader>
          <DialogTitle>Tambah Catatan</DialogTitle>
          <DialogDescription>
            Catat pemasukan atau pengeluaran hari ini.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          
          <div className="flex flex-col gap-2">
             <div className="flex gap-2">
                <Button
                    type="button"
                    variant={type === "expense" ? "default" : "outline"}
                    className={cn(
                        "flex-1", 
                        type === "expense" ? "bg-red-600 hover:bg-red-700 text-white" : ""
                    )}
                    onClick={() => setType("expense")}
                >
                    <Minus className="mr-2 h-4 w-4" />
                    Pengeluaran
                </Button>
                <Button
                    type="button"
                    variant={type === "income" ? "default" : "outline"}
                    className={cn(
                        "flex-1",
                        type === "income" ? "bg-green-600 hover:bg-green-700 text-white" : ""
                    )}
                    onClick={() => setType("income")}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Pemasukan
                </Button>
             </div>
             <p className="text-center text-xs text-muted-foreground min-h-5">
                 {type === "expense" ? "Pengeluaran hari ini" : "Pemasukan hari ini"}
             </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount" className="text-base font-semibold">Nominal</Label>
            <Input
              id="amount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={displayAmount}
              onChange={handleAmountChange}
              autoFocus
              required
              className="text-2xl h-14 font-bold tracking-tight"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Kategori</Label>
            <Input
              id="category"
              placeholder="Makan, transport, gaji, dll"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">Catatan (opsional)</Label>
            <Textarea
              id="note"
              placeholder="Tambahan info kalau perlu"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading || rawValue <= 0} className="w-full text-lg h-12">
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
