import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { usersApi } from '@/api/users.api';
import { authApi } from '@/api/auth.api';
import { getErrorMessage } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ListSkeleton } from '@/components/empty-error-states';
import { initials, cn } from '@/lib/utils';
import { User, Lock, ShieldCheck, Palette, Check, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '@/context/theme-context';

type SettingsSection = 'profile' | 'appearance' | 'security' | 'account';

const sections: { id: SettingsSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'account', label: 'Account', icon: ShieldCheck },
];

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Appearance</CardTitle>
        <CardDescription>Choose how FlowLens looks on this device.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              aria-pressed={theme === value}
              className={cn(
                'relative flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                theme === value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/30 hover:bg-accent/50',
              )}
            >
              {theme === value && <Check className="absolute right-2 top-2 h-3.5 w-3.5" />}
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileSection() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ['profile'], queryFn: () => usersApi.getProfile() });
  const { register, handleSubmit, reset } = useForm<{ displayName: string }>();

  const updateMutation = useMutation({
    mutationFn: (values: { displayName: string }) => usersApi.updateProfile(values),
    onSuccess: () => {
      toast.success('Profile updated.');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (profileQuery.isLoading) return <ListSkeleton rows={2} />;
  const profile = profileQuery.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Profile</CardTitle>
        <CardDescription>Your account details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/15 text-base font-semibold text-secondary shadow-sm">
            {profile ? initials(profile.displayName) : '—'}
          </div>
          <div>
            <p className="text-sm font-semibold">{profile?.displayName}</p>
            <p className="text-xs text-muted-foreground">{profile?.email}</p>
          </div>
        </div>
        <form
          onSubmit={handleSubmit((v) => updateMutation.mutate(v))}
          className="space-y-4"
          onFocus={() => reset({ displayName: profile?.displayName })}
        >
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" defaultValue={profile?.displayName} {...register('displayName', { required: true, maxLength: 100 })} />
          </div>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SecuritySection() {
  const { register, handleSubmit, reset } = useForm<{ currentPassword: string; newPassword: string }>();

  const mutation = useMutation({
    mutationFn: (values: { currentPassword: string; newPassword: string }) => authApi.changePassword(values.currentPassword, values.newPassword),
    onSuccess: () => {
      toast.success('Password changed. You may need to log in again on other devices.');
      reset();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Password</CardTitle>
        <CardDescription>Change your account password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input id="currentPassword" type="password" {...register('currentPassword', { required: true })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" type="password" {...register('newPassword', { required: true, minLength: 8 })} />
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Updating…' : 'Change password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DangerZoneSection() {
  const { logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => usersApi.deactivateAccount(),
    onSuccess: () => {
      toast.success('Account deactivated.');
      logout();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-sm text-destructive">Danger zone</CardTitle>
        <CardDescription>Deactivating your account signs you out everywhere.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
          Deactivate account
        </Button>
      </CardContent>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Deactivate your account?"
        description="You can contact support to reactivate later, but you'll be logged out immediately."
        confirmLabel="Deactivate"
        isLoading={mutation.isPending}
        onConfirm={() => mutation.mutate()}
      />
    </Card>
  );
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="rounded-xl border border-border/60 bg-card p-1.5 shadow-sm">
        <div className="flex gap-1 overflow-x-auto">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                'relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 focus-ring',
                activeSection === id ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
              )}
            >
              {activeSection === id && (
                <motion.span
                  layoutId="settings-active"
                  className="absolute inset-0 rounded-lg bg-primary/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeSection === 'profile' && <ProfileSection />}
        {activeSection === 'appearance' && <AppearanceSection />}
        {activeSection === 'security' && <SecuritySection />}
        {activeSection === 'account' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-secondary" />
                  Account
                </CardTitle>
                <CardDescription>Manage your account settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Your account is active and in good standing.</p>
              </CardContent>
            </Card>
            <DangerZoneSection />
          </div>
        )}
      </motion.div>
    </div>
  );
}