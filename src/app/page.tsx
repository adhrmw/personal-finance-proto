"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [inputCode, setInputCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"code" | "name">("code");

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) {
        toast.error("Kode belum diisi.");
        return;
    }

    setIsLoading(true);
    try {
      // Check if code exists
      const { data, error } = await supabase
        .from("users")
        .select("id, display_name, user_code")
        .eq("user_code", inputCode.trim())
        .single();

      if (error && error.code !== "PGRST116") {
         // Generic database error
         console.error(error);
         toast.error("Ada masalah koneksi. Coba lagi.");
         return;
      }

      if (data) {
        // CASE A: Code Exists -> Login
        localStorage.setItem("pf_user", JSON.stringify(data));
        toast.success(`Halo lagi, ${data.display_name}!`);
        router.push("/dashboard");
      } else {
        setStep("name"); 
      }
    } catch (error) {
      console.error(error);
      toast.error("Kesalahan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsLoading(true);
    try {
        // Create new user with the previously entered code
        // Note: The code might be simple, but that's what the flow implies.
        const { data, error } = await supabase
          .from("users")
          .insert([{ 
              display_name: displayName.trim(), 
              user_code: inputCode.trim() 
          }])
          .select()
          .single();

        if (error) {
            // If we hit a race condition collision
            if (error.code === '23505') {
                toast.error("Kode ini baru saja dipakai orang lain. Coba kode lain.");
                setStep("code"); // Go back
            } else {
                throw error;
            }
            return;
        }

        // Success
        localStorage.setItem("pf_user", JSON.stringify(data));
        toast.success("Akun dibuat!");
        router.push("/dashboard");

    } catch (err: unknown) {
        const error = err as { message?: string };
        console.error("Create User Error:", error);
        toast.error(`Gagal: ${error?.message || "Error"}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    const newCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setInputCode(newCode);
    setStep("name");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-sm shadow-xl border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Catetin</CardTitle>
          <CardDescription className="text-center">
            Catat pengeluaran tanpa ribet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "code" && (
            <div className="space-y-4">
                <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="code">Masuk</Label>
                    <Input
                    id="code"
                    placeholder="Kode kamu"
                    type="password"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    disabled={isLoading}
                    autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                    Kode ini dipakai buat masuk.
                    </p>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || !inputCode}>
                    {isLoading ? "Sebentar..." : "Lanjut"}
                </Button>
                </form>
                
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground dark:bg-zinc-950">
                        Atau
                        </span>
                    </div>
                </div>

                <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleSignUp}
                    disabled={isLoading}
                    type="button"
                >
                    Belum punya kode? Buat baru
                </Button>
            </div>
          )}

          {step === "name" && (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md text-sm border border-blue-100">
                    <span className="font-semibold block mb-1">Kode Akun Baru</span>
                    Simpan kode ini buat masuk nanti:
                    <div 
                        className="mt-2 bg-white p-2 rounded border border-blue-200 font-mono text-center text-lg tracking-wider select-all cursor-pointer active:scale-95 transition-transform"
                        onClick={() => {
                            navigator.clipboard.writeText(inputCode); 
                            toast.success("Kode disalin!");
                        }}
                    >
                        {inputCode}
                    </div>
                    <p className="text-xs mt-1 text-center text-blue-600">(Klik untuk salin)</p>
                </div>
                <Label htmlFor="name">Nama panggilan kamu?</Label>
                <Input
                  id="name"
                  placeholder="Isi nama kamu"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                    Nama ini cuma buat tampilan.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !displayName}>
                {isLoading ? "Menyimpan..." : "Mulai"}
              </Button>
               <Button 
                variant="ghost" 
                className="w-full text-xs text-muted-foreground"
                onClick={() => {
                    setStep("code");
                    setInputCode("");
                }}
                type="button"
                disabled={isLoading}
              >
                Ganti Kode
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
