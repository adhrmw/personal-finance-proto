"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { Plus, LogOut } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Transaction {
  id: number;
  amount: number;
  type: "income" | "expense";
  category: string;
  note: string;
  occurred_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; display_name: string } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [microCopy, setMicroCopy] = useState("");

  const fetchTransactions = async (userId: string) => {
    setIsLoading(true);
    try {
      // 3-Day Window: Today, Yesterday, 2 Days Ago
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(today.getDate() - 2);
      twoDaysAgo.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .gte("occurred_at", twoDaysAgo.toISOString())
        .lte("occurred_at", today.toISOString())
        .order("occurred_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat transaksi.");
    } finally {
      setIsLoading(false);
    }
  };

  const todayTransactions = transactions.filter(t => {
      const tDate = new Date(t.occurred_at);
      const today = new Date();
      return tDate.toDateString() === today.toDateString();
  });

  const totalIncome = todayTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = todayTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  useEffect(() => {
    // Auth Check & Initial Fetch
    const storedUser = localStorage.getItem("pf_user");
    if (!storedUser) {
      router.push("/");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    
    // Initial fetch
    if (transactions.length === 0) {
        fetchTransactions(parsedUser.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    // Micro-copy Logic
    const hour = new Date().getHours();
    let options: string[] = [];

    if (balance < 0) {
       // Negative Balance Flow
       if (hour >= 5 && hour < 11) {
        options = [
          "Pagi yang cukup sibuk.",
          "Lumayan banyak aktivitas awal ini.",
          "Perputaran pagi ini cukup terasa.",
        ];
      } else if (hour >= 11 && hour < 17) {
        options = [
          "Siang ini lumayan padat.",
          "Aktivitas hari ini terus berjalan.",
          "Hari ini cukup banyak cerita.",
        ];
      } else {
        if (hour >= 17) {
          options = [
            "Hari yang lumayan panjang.",
            "Satu hari yang cukup padat.",
            "Banyak hal lewat hari ini.",
          ];
        } else {
           options = ["Dunia sudah tidur."];
        }
      }
    } else {
      // Standard Flow
      if (hour >= 5 && hour < 11) {
        options = [
          "Masih pagi, belum terlalu ramai.",
          "Suasana pagi ini lumayan tenang.",
          "Belum banyak aktivitas hari ini.",
        ];
      } else if (hour >= 11 && hour < 17) {
        options = [
          "Setengah hari sudah terlewati.",
          "Hari ini berjalan seperti biasa.",
          "Masih ada sisa waktu hari ini.",
        ];
      } else {
        if (hour >= 17) {
          options = [
            "Satu hari hampir selesai.",
            "Waktunya mulai melambat.",
            "Malam yang cukup damai.",
          ];
        } else {
           options = ["Dunia sudah tidur."];
        }
      }
    }
    
    // Pick random
    const random = options[Math.floor(Math.random() * options.length)];
    setMicroCopy(random);
  }, [balance]);

  const handleTransactionSuccess = () => {
      if (user) fetchTransactions(user.id);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("pf_user");
    router.push("/");
  };

  // Formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Grouping Logic
  type GroupedTransactions = Record<string, Transaction[]>;
  
  const getRelativeDateLabel = (dateStr: string) => {
      const date = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(today.getDate() - 2);

      if (date.toDateString() === today.toDateString()) return "Hari Ini";
      if (date.toDateString() === yesterday.toDateString()) return "Kemarin";
      if (date.toDateString() === twoDaysAgo.toDateString()) {
          return "2 hari lalu";
      }
      return date.toLocaleDateString('id-ID', { weekday: 'long' }); // Fallback
  };

  const groupedTransactions: GroupedTransactions = transactions.reduce((groups, t) => {
      const date = new Date(t.occurred_at).toDateString();
      if (!groups[date]) {
          groups[date] = [];
      }
      groups[date].push(t);
      return groups;
  }, {} as GroupedTransactions);

  // Sort groups keys (dates) descending
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
  });


  if (!user) return null; // Or generic loading spinner

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
             <h1 className="text-xl font-bold">Halo, {user.display_name}</h1>
             <p className="text-sm text-gray-500">Ada transaksi apa hari ini?</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Summary Card */}
        <Card className="shadow-sm border-0 bg-white dark:bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Saldo Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-4xl font-bold tracking-tight", balance < 0 ? "text-red-500" : "text-zinc-900 dark:text-zinc-50")}>
              {formatCurrency(balance)}
            </div>
            <div className="mt-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3 text-xs text-zinc-500 italic">
               {microCopy || "..."}
            </div>
          </CardContent>
        </Card>

        {/* FAB */}
        <div className="fixed bottom-6 right-6 md:relative md:bottom-auto md:right-auto md:flex md:justify-center transition-all duration-300">
          <Button 
            size="lg" 
            className={cn(
                "rounded-full h-14 w-14 shadow-lg md:w-full md:rounded-md transition-all duration-300",
                saveSuccess ? "bg-green-600 hover:bg-green-700" : ""
            )}
            onClick={() => setIsDialogOpen(true)}
          >
            {saveSuccess ? <span className="text-xl">✓</span> : <Plus className="h-6 w-6" />}
            <span className="sr-only md:not-sr-only md:ml-2">
                {saveSuccess ? "Tersimpan" : "Tambah Catatan"}
            </span>
          </Button>
        </div>

        {/* Transactions List */}
        <div className="space-y-6">
           {isLoading ? (
             <p className="text-center text-sm text-gray-400 py-4">Lagi ambil data...</p>
           ) : transactions.length === 0 ? (
             <div className="text-center py-12 px-4">
               <div className="mb-3 text-4xl">😴</div>
               <p className="text-gray-900 font-medium dark:text-gray-100">Belum ada catatan</p>
               <p className="text-sm text-gray-500 mt-1">
                 Klik tombol + buat mulai mencatat.
               </p>
             </div>
           ) : (
             sortedDates.map((dateKey) => (
                 <div key={dateKey} className="space-y-3">
                     <h3 className="text-sm font-medium text-gray-500 pl-1">
                         {getRelativeDateLabel(dateKey)}
                     </h3>
                     <div className="space-y-3">
                        {groupedTransactions[dateKey].map((t) => (
                            <Card key={t.id} className="border-0 shadow-none bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{t.category}</span>
                                    {t.note && <span className="text-xs text-gray-400 truncate max-w-37.5">{t.note}</span>}
                                </div>
                                <span className={cn("font-medium", t.type === "income" ? "text-green-600 font-bold" : "text-gray-500 dark:text-gray-400")}>
                                    {t.type === "income" ? "+" : "−"} {formatCurrency(t.amount)}
                                </span>
                            </CardContent>
                            </Card>
                        ))}
                     </div>
                 </div>
             ))
           )}
        </div>
      </div>

      <AddTransactionDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        onSuccess={handleTransactionSuccess}
        userId={user.id}
      />
    </div>
  );
}
