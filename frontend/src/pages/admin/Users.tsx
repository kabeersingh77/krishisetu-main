import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { ShieldCheck, UserCheck, Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import api from '@/services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleVerify = async (userId: string) => {
    try {
      await api.patch(`/users/${userId}/verify`);
      toast({ title: 'Producer Verified Successfully', description: 'Farmer/FPO now holds official verification badge.' });
      fetchUsers();
    } catch (e) {
      toast({ title: 'Failed to verify', variant: 'destructive' });
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Platform Users & Verification</h1>
          <p className="text-muted-foreground text-sm">KYC verification for farmers, FPOs, and institutional buyers.</p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Registered Accounts ({filtered.length})</CardTitle>
          <CardDescription>Role-based access control and verification status</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>User Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Farm / Org</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const isVerified = u.farmerProfile?.verified || u.fpo?.verified;
                  const farmName = u.farmerProfile?.farmName || u.fpo?.name;
                  return (
                    <TableRow key={u.id} className="hover:bg-muted/20">
                      <TableCell className="font-semibold text-sm">{u.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs uppercase font-medium">
                          {u.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {farmName || '—'}
                      </TableCell>
                      <TableCell>
                        {isVerified ? (
                          <Badge className="bg-emerald-600 gap-1 text-xs">
                            <ShieldCheck className="h-3 w-3" /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 dark:border-amber-800 text-xs">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isVerified && (u.farmerProfile || u.fpo) && (
                          <Button size="sm" className="h-7 text-xs bg-emerald-600 text-white gap-1" onClick={() => handleVerify(u.id)}>
                            <UserCheck className="h-3.5 w-3.5" /> Approve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
