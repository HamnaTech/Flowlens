import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronLeft, MailCheck } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { AuthLayout } from './auth-layout';

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
    <AuthLayout
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="Enter the email tied to your account and we&apos;ll send a secure reset link."
      footer={
        <Link to="/login" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-3.5 w-3.5" /> Back to login
        </Link>
      }
    >
      {sent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-mint/40 p-5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success/20">
            <MailCheck className="h-5 w-5 text-success" />
          </div>
          <p className="text-sm leading-relaxed text-foreground">
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
    </AuthLayout>
  );
}
