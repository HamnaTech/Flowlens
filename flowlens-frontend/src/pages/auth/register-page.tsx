import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { AuthLayout } from './auth-layout';

interface RegisterForm {
  displayName: string;
  email: string;
  password: string;
}

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>();

  async function onSubmit(values: RegisterForm) {
    setIsSubmitting(true);
    try {
      await registerUser(values.email, values.password, values.displayName);
      toast.success('Account created — welcome to FlowLens.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      subtitle="Start tracking what&apos;s actually wasting your team&apos;s time — no credit card required."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Name</Label>
          <Input
            id="displayName"
            autoComplete="name"
            {...register('displayName', { required: 'Name is required', maxLength: { value: 100, message: 'Max 100 characters' } })}
          />
          {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email', { required: 'Email is required' })} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'At least 8 characters' },
              // Mirrors the backend's actual regex in RegisterDto — an
              // uppercase letter, a lowercase letter, and a digit.
              pattern: {
                value: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Needs an uppercase letter, a lowercase letter, and a number',
              },
            })}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
