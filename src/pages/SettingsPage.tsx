import { useState, useEffect } from 'react';
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

export default function SettingsPage() {
  const { user, isAdmin, updateProfile } = useAuth();
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');

  // Admin: Users
  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Admin: Business
  const [biz, setBiz] = useState<BusinessSettings>({ businessName: '', receiptFooter: '', defaultTaxRate: 15 });
  const [bizLoading, setBizLoading] = useState(false);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmDesc, setConfirmDesc] = useState('');

  useEffect(() => {
    if (isAdmin) {
      setUsersLoading(true);
      usersApi.list().then(setUsers).finally(() => setUsersLoading(false));
      settingsApi.getBusinessSettings().then(setBiz);
    }
  }, [isAdmin]);

  const saveProfile = () => {
    updateProfile({ name: profileName, phone: profilePhone });
    toast({ title: 'Profile updated' });
  };

  const handleRoleChange = (userId: string, role: 'ADMIN' | 'STAFF') => {
    setConfirmTitle('Change Role');
    setConfirmDesc(`Change this user's role to ${role}?`);
    setConfirmAction(() => async () => {
      await usersApi.updateRole(userId, role);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      toast({ title: 'Role updated' });
      setConfirmOpen(false);
    });
    setConfirmOpen(true);
  };

  const handleToggleStatus = (userId: string, isActive: boolean) => {
    setConfirmTitle(isActive ? 'Activate User' : 'Deactivate User');
    setConfirmDesc(`Are you sure you want to ${isActive ? 'activate' : 'deactivate'} this user?`);
    setConfirmAction(() => async () => {
      await usersApi.updateStatus(userId, isActive);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive } : u));
      toast({ title: `User ${isActive ? 'activated' : 'deactivated'}` });
      setConfirmOpen(false);
    });
    setConfirmOpen(true);
  };

  const saveBiz = async () => {
    setBizLoading(true);
    await settingsApi.updateBusinessSettings(biz);
    toast({ title: 'Settings saved' });
    setBizLoading(false);
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

        {/* Profile */}
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
            <Button onClick={saveProfile}>Save Profile</Button>
          </div>
        </TabsContent>

        {/* Users Management */}
        {isAdmin && (
          <TabsContent value="users">
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
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-muted/30">
                        <td className="px-5 py-3 font-medium">{u.name}</td>
                        <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                        <td className="px-5 py-3">
                          <Select value={u.role} onValueChange={(v: 'ADMIN' | 'STAFF') => handleRoleChange(u.id, v)}>
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
                          <Badge variant={u.isActive ? 'default' : 'secondary'} className="text-xs">
                            {u.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <Button
                            size="sm"
                            variant={u.isActive ? 'outline' : 'default'}
                            onClick={() => handleToggleStatus(u.id, !u.isActive)}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        )}

        {/* Business Settings */}
        {isAdmin && (
          <TabsContent value="business">
            <div className="bg-card rounded-2xl shadow-soft p-6 max-w-md space-y-4">
              <div className="space-y-1.5">
                <Label>Business Name</Label>
                <Input value={biz.businessName} onChange={e => setBiz(p => ({ ...p, businessName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Receipt Footer Text</Label>
                <Input value={biz.receiptFooter} onChange={e => setBiz(p => ({ ...p, receiptFooter: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Default Tax Rate (%)</Label>
                <Input type="number" value={biz.defaultTaxRate} onChange={e => setBiz(p => ({ ...p, defaultTaxRate: parseFloat(e.target.value) || 0 }))} />
              </div>
              <Button onClick={saveBiz} disabled={bizLoading}>
                {bizLoading ? 'Saving...' : 'Save Settings'}
              </Button>
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
