import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import elibestLogo from "@/assets/elibest-logo.svg";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) navigate("/");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You've successfully signed in." });
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast({ title: "Account created!", description: "You can now sign in." });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({ title: "Authentication failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--sidebar-background)' }}>
      {/* ── Background Decoration ── */}
      <div className="absolute inset-0 z-0 bg-muted/40" />
      <div 
        className="absolute inset-0 z-0" 
        style={{
          background: "radial-gradient(circle at top left, hsl(var(--primary)/0.08) 0%, transparent 40%), radial-gradient(circle at bottom right, hsl(196 80% 50%/0.05) 0%, transparent 40%)"
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse-slow" />
      
      {/* ── Theme Toggle ── */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* ── Glassmorphic Modal ── */}
      <div 
        className="relative z-10 w-full max-w-[420px] mx-4 p-8 sm:p-10 rounded-3xl bg-card/70 backdrop-blur-xl shadow-[var(--shadow-lg)] border border-border/50 page-enter"
        style={{ animationDuration: '0.4s' }}
      >
        <div className="flex flex-col items-center mb-8">
          <img src={elibestLogo} alt="Elibest" className="h-12 object-contain dark:invert mb-2" />
          <p className="text-muted-foreground mt-4 text-center text-[15px]">
            {isLogin ? "Sign in to your dashboard" : "Create your admin account"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1.5">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 bg-background/50 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/50 text-base rounded-xl transition-colors hover:bg-background/80"
            />
          </div>

          <div className="space-y-1.5 relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-12 bg-background/50 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/50 pr-12 text-base rounded-xl transition-colors hover:bg-background/80"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <Button
            type="submit"
            className="w-full h-12 font-semibold text-[15px] mt-4 rounded-xl shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 transition-all"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : null}
            {isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="mt-8 text-center text-[14px]">
          <span className="text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-semibold hover:underline"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
