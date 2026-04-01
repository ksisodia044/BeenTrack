import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { usersApi, settingsApi } from '@/api/client';
import { toast } from '@/hooks/use-toast';
import type { AppUser, BusinessSettings } from '@/types';

const defaultBusinessSettings: BusinessSettings = {
  businessName: '',
  receiptFooter: '',
  defaultTaxRate: 15,
};

export default function SettingsPage() {
  const { user, isAdmin, updateProfile } = useAuth();
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);

  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [biz, setBiz] = useState<BusinessSettings>(defaultBusinessSettings);
  const [bizLoading, setBizLoading] = useState(false);
  const [bizError, setBizError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => Promise<void>>(async () => {});
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmDesc, setConfirmDesc] = useState('');

  useEffect(() => {
    setProfileName(user?.name || '');
    setProfilePhone(user?.phone || '');
  }, [user?.name, user?.phone]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);

    try {
      const loadedUsers = await usersApi.list();
      setUsers(loadedUsers);
    } catch {
      setUsersError('Failed to load users.');
      toast({ title: 'Failed to load users', variant: 'destructive' });
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadBusinessSettings = useCallback(async () => {
    setBizLoading(true);
    setBizError(null);

    try {
      const loadedSettings = await settingsApi.getBusinessSettings();
      setBiz(loadedSettings);
    } catch {
      setBizError('Failed to load business settings.');
      toast({ title: 'Failed to load business settings', variant: 'destructive' });
    } finally {
      setBizLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    void loadUsers();
    void loadBusinessSettings();
  }, [isAdmin, loadBusinessSettings, loadUsers]);

  const saveProfile = async () => {
    setProfileSaving(true);

    try {
      await updateProfile({ name: profileName, phone: profilePhone });
      toast({ title: 'Profile updated' });
    } catch {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleRoleChange = (userId: string, role: 'ADMIN' | 'STAFF') => {
    setConfirmTitle('Change Role');
    setConfirmDesc(`Change this user's role to ${role}?`);
    setConfirmAction(() => async () => {
      try {
        await usersApi.updateRole(userId, role);
        setUsers(prev => prev.map(existingUser => (
          existingUser.id === userId ? { ...existingUser, role } : existingUser
        )));
        toast({ title: 'Role updated' });
        setConfirmOpen(false);
      } catch {
        toast({ title: 'Failed to update role', variant: 'destructive' });
      }
    });
    setConfirmOpen(true);
  };

  const handleToggleStatus = (userId: string, isActive: boolean) => {
    setConfirmTitle(isActive ? 'Activate User' : 'Deactivate User');
    setConfirmDesc(`Are you sure you want to ${isActive ? 'activate' : 'deactivate'} this user?`);
    setConfirmAction(() => async () => {
      try {
        await usersApi.updateStatus(userId, isActive);
        setUsers(prev => prev.map(existingUser => (
          existingUser.id === userId ? { ...existingUser, isActive } : existingUser
        )));
        toast({ title: `User ${isActive ? 'activated' : 'deactivated'}` });
        setConfirmOpen(false);
      } catch {
        toast({ title: `Failed to ${isActive ? 'activate' : 'deactivate'} user`, variant: 'destructive' });
      }
    });
    setConfirmOpen(true);
  };

  const saveBiz = async () => {
    setBizLoading(true);
    setBizError(null);

    try {
      const updatedSettings = await settingsApi.updateBusinessSettings(biz);
      setBiz(updatedSettings);
      toast({ title: 'Settings saved' });
    } catch {
      setBizError('Failed to save business settings.');
      toast({ title: 'Failed to save business settings', variant: 'destructive' });
    } finally {
      setBizLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {isAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
          {isAdmin && <TabsTrigger value="business">Business</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <div className="bg-card rounded-2xl shadow-soft p-6 max-w-md space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={profileName} onChange={e => setProfileName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Phone (optional)</Label>
              <Input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="+1-555-0000" />
            </div>
            <Button onClick={() => void saveProfile()} disabled={profileSaving}>
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users">
            <div className="space-y-3">
              {usersError && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-sm text-destructive">{usersError}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => void loadUsers()}>
                    Retry
                  </Button>
                </div>
              )}

              <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-[11px] text-muted-foreground uppercase tracking-wider">
                        <th className="px-5 py-3">Name</th>
                        <th className="px-5 py-3">Email</th>
                        <th className="px-5 py-3">Role</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {users.map(existingUser => (
                        <tr key={existingUser.id} className="hover:bg-muted/30">
                          <td className="px-5 py-3 font-medium">{existingUser.name}</td>
                          <td className="px-5 py-3 text-muted-foreground">{existingUser.email}</td>
                          <td className="px-5 py-3">
                            <Select value={existingUser.role} onValueChange={(value: 'ADMIN' | 'STAFF') => handleRoleChange(existingUser.id, value)}>
                              <SelectTrigger className="w-28 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="STAFF">Staff</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant={existingUser.isActive ? 'default' : 'secondary'} className="text-xs">
                              {existingUser.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-5 py-3">
                            <Button
                              size="sm"
                              variant={existingUser.isActive ? 'outline' : 'default'}
                              onClick={() => handleToggleStatus(existingUser.id, !existingUser.isActive)}
                            >
                              {existingUser.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {!usersLoading && users.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-6 text-center text-sm text-muted-foreground">
                            No users found.
                          </td>
                        </tr>
                      )}
                      {usersLoading && (
                        <tr>
                          <td colSpan={5} className="px-5 py-6 text-center text-sm text-muted-foreground">
                            Loading users...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="business">
            <div className="space-y-3">
              {bizError && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-sm text-destructive">{bizError}</p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => void loadBusinessSettings()}>
                      Retry Load
                    </Button>
                  </div>
                </div>
              )}

              <div className="bg-card rounded-2xl shadow-soft p-6 max-w-md space-y-4">
                <div className="space-y-1.5">
                  <Label>Business Name</Label>
                  <Input value={biz.businessName} onChange={e => setBiz(prev => ({ ...prev, businessName: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Receipt Footer Text</Label>
                  <Input value={biz.receiptFooter} onChange={e => setBiz(prev => ({ ...prev, receiptFooter: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Default Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={biz.defaultTaxRate}
                    onChange={e => setBiz(prev => ({ ...prev, defaultTaxRate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <Button onClick={() => void saveBiz()} disabled={bizLoading}>
                  {bizLoading ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmTitle}
        description={confirmDesc}
        onConfirm={confirmAction}
      />
    </div>
  );
}
