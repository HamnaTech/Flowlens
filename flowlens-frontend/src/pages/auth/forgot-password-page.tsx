import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronLeft, MailCheck } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { getErrorMessage } from '@/lib/api-client';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ForgotPasswordForm {
  email: string;
}

export function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  async function onSubmit(values: ForgotPasswordForm) {
    setIsSubmitting(true);
    try {
      // Backend intentionally responds identically whether or not the
      // email exists (anti-enumeration) — so the UI always shows the same
      // "check your email" state regardless of outcome. That's correct
      // behavior, not a bug to work around.
      await authApi.forgotPassword(values.email);
      setSent(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative w-full max-w-sm">
        <Card className="border-border/60 shadow-xl">
          <CardHeader className="items-center text-center">
            <Logo className="mb-3" iconClassName="h-8 w-8" textClassName="text-2xl" />
            <CardTitle className="text-xl">Reset your password</CardTitle>
            <CardDescription>We'll email you a reset link</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-4 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
                  <MailCheck className="h-6 w-6 text-success" />
                </div>
                <p className="text-sm text-muted-foreground">
                  If an account exists for that email, a reset link is on its way. Check your inbox.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" autoComplete="email" {...register('email', { required: 'Email is required' })} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
            )}
            <Link to="/login" className="mt-5 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-3.5 w-3.5" /> Back to login
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
