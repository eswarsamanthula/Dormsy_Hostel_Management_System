import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, UserCheck, UserX, Shield, User, GraduationCap } from "lucide-react";

const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const { data: profiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: students } = useQuery({
    queryKey: ['students-with-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id, student_id, profile_id,
          profiles!inner(id, email, full_name, is_active)
        `);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: wardens } = useQuery({
    queryKey: ['wardens-with-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wardens')
        .select(`
          id, employee_id, profile_id,
          profiles!inner(id, email, full_name, is_active)
        `);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: admins } = useQuery({
    queryKey: ['admins-with-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admins')
        .select(`
          id, employee_id, profile_id,
          profiles!inner(id, email, full_name, is_active)
        `);
      if (error) throw error;
      return data || [];
    }
  });

  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['students-with-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['wardens-with-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admins-with-profiles'] });
      toast({ title: 'User status updated successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update user status', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  // Combine all users with their roles
  const allUsers = [
    ...(students?.map(s => ({
      id: s.profile_id,
      email: s.profiles.email,
      full_name: s.profiles.full_name,
      is_active: s.profiles.is_active,
      role: 'student',
      identifier: s.student_id
    })) || []),
    ...(wardens?.map(w => ({
      id: w.profile_id,
      email: w.profiles.email,
      full_name: w.profiles.full_name,
      is_active: w.profiles.is_active,
      role: 'warden',
      identifier: w.employee_id
    })) || []),
    ...(admins?.map(a => ({
      id: a.profile_id,
      email: a.profiles.email,
      full_name: a.profiles.full_name,
      is_active: a.profiles.is_active,
      role: 'admin',
      identifier: a.employee_id
    })) || [])
  ];

  // Filter users
  const filteredUsers = allUsers.filter(user => {
    const matchesEmail = !searchEmail || 
      user.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchEmail.toLowerCase());
    const matchesRole = !roleFilter || roleFilter === 'all' || user.role === roleFilter;
    return matchesEmail && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'warden': return <UserCheck className="h-4 w-4" />;
      case 'student': return <GraduationCap className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'warden': return 'default';
      case 'student': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{allUsers.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Students</p>
                <p className="text-2xl font-bold">{students?.length || 0}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Wardens</p>
                <p className="text-2xl font-bold">{wardens?.length || 0}</p>
              </div>
              <UserCheck className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{admins?.length || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by email or name..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="warden">Warden</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.full_name || user.email}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleColor(user.role) as any} className="flex items-center gap-1 w-fit">
                      {getRoleIcon(user.role)}
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{user.identifier}</TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "outline"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={user.is_active ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleUserStatus.mutate({
                        userId: user.id,
                        isActive: user.is_active
                      })}
                    >
                      {user.is_active ? (
                        <>
                          <UserX className="h-3 w-3 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3 w-3 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;