import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Sparkles, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function AuthPage() {
  const { login, isLoggingIn, user, loginError } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>
      
      <Card className="w-full max-w-md shadow-2xl shadow-primary/5 border-primary/10">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-display font-bold">Добро пожаловать в HR - просто</CardTitle>
            <CardDescription className="text-base">
              Создавайте, делитесь и управляйте вашими ТЗ
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => login(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Логин или email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Введите логин или email" 
                        className="h-11 bg-muted/50 focus:bg-background transition-colors"
                        data-testid="input-username"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Введите пароль" 
                          className="h-11 bg-muted/50 focus:bg-background transition-colors pr-10"
                          data-testid="input-password"
                          {...field} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {loginError && (
                <p className="text-sm text-destructive text-center" data-testid="text-login-error">
                  {loginError}
                </p>
              )}
              
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                disabled={isLoggingIn}
                data-testid="button-submit"
              >
                {isLoggingIn ? "Вход..." : "Продолжить"}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Если аккаунта нет — мы создадим его автоматически.
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
