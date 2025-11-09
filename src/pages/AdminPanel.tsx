import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Building, Users, Home, BarChart3, Settings, FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReportsInsights from '@/components/admin/ReportsInsights';
import SystemAnalytics from '@/components/admin/SystemAnalytics';
import AttendanceAnalytics from '@/components/admin/AttendanceAnalytics';
import AuditLogs from "@/components/admin/AuditLogs";
import DataExport from "@/components/admin/DataExport";
import UserManagement from "@/components/admin/UserManagement";
import NotificationBroadcast from "@/components/admin/NotificationBroadcast";
import FeeManagement from "@/components/admin/FeeManagement";
import EmailNotifications from "@/components/admin/EmailNotifications";
import SystemHealth from "@/components/admin/SystemHealth";
import MessAttendanceHistoryAdmin from "@/components/admin/MessAttendanceHistoryAdmin";

const useSEO = (title: string, description: string, canonicalPath: string) => {
  useEffect(() => {
    document.title = title;
    const metaDesc = document.querySelector('head meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', description);
    const link: HTMLLinkElement = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', window.location.origin + canonicalPath);
    if (!link.parentElement) document.head.appendChild(link);
  }, [title, description, canonicalPath]);
};

const AdminPanel = () => {
  useSEO('Admin Panel • Dormsy', 'Admin: manage colleges, hostels, rooms and wardens.', '/admin');
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('colleges');

  // Colleges
  const { data: colleges, isLoading: collegesLoading } = useQuery({
    queryKey: ['colleges'],
    queryFn: async () => {
      const { data, error } = await supabase.from('colleges').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  useEffect(() => {
    if (!collegesLoading) {
      setInitialLoading(false);
    }
  }, [collegesLoading]);

  const addCollege = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from('colleges').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['colleges'] });
      toast({ title: 'College created' });
    },
    onError: (e: any) => toast({ title: 'Failed to create college', description: e.message, variant: 'destructive' })
  });

  const deleteCollege = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('colleges').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['colleges'] });
      toast({ title: 'College deleted' });
    },
    onError: (e: any) => toast({ title: 'Failed to delete college', description: e.message, variant: 'destructive' })
  });

  // Hostels
  const { data: hostels } = useQuery({
    queryKey: ['hostels'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hostels').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const addHostel = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from('hostels').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hostels'] });
      toast({ title: 'Hostel created' });
    },
    onError: (e: any) => toast({ title: 'Failed to create hostel', description: e.message, variant: 'destructive' })
  });

  const deleteHostel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hostels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hostels'] });
      toast({ title: 'Hostel deleted' });
    },
    onError: (e: any) => toast({ title: 'Failed to delete hostel', description: e.message, variant: 'destructive' })
  });

  // Rooms
  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await supabase.from('rooms').select('*').order('room_number');
      if (error) throw error;
      return data || [];
    }
  });

  const addRoom = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from('rooms').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: 'Room created' });
    },
    onError: (e: any) => toast({ title: 'Failed to create room', description: e.message, variant: 'destructive' })
  });

  const deleteRoom = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rooms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: 'Room deleted' });
    },
    onError: (e: any) => toast({ title: 'Failed to delete room', description: e.message, variant: 'destructive' })
  });

  // Wardens
  const { data: wardens } = useQuery({
    queryKey: ['wardens'],
    queryFn: async () => {
      const { data, error } = await supabase.from('wardens').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const addWarden = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from('wardens').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wardens'] });
      toast({ title: 'Warden assigned' });
    },
    onError: (e: any) => toast({ title: 'Failed to assign warden', description: e.message, variant: 'destructive' })
  });

  // Local form states
  const [collegeForm, setCollegeForm] = useState({ name: '', code: '', contact_email: '', contact_phone: '', address: '' });
  const [hostelForm, setHostelForm] = useState({ name: '', type: 'boys', college_id: '', floors: 1, rooms_per_floor: 10, total_capacity: 0 });
  const [roomForm, setRoomForm] = useState({ hostel_id: '', room_number: '', floor_number: 1, capacity: 2 });
  const [wardenForm, setWardenForm] = useState({ email: '', employee_id: '', college_id: '', hostel_id: '' });
  const selectedCollegeHostels = useMemo(() => hostels?.filter((h: any) => h.college_id === hostelForm.college_id) || [], [hostels, hostelForm.college_id]);

  const findProfileByEmail = async (email: string) => {
    const { data, error } = await supabase.rpc('admin_find_profile_by_email', { p_email: email });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  };

  const handleCreateCollege = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeForm.name || !collegeForm.code) return toast({ title: 'Name and code are required', variant: 'destructive' });
    addCollege.mutate({
      name: collegeForm.name,
      code: collegeForm.code,
      contact_email: collegeForm.contact_email || null,
      contact_phone: collegeForm.contact_phone || null,
      address: collegeForm.address || null,
    });
    setCollegeForm({ name: '', code: '', contact_email: '', contact_phone: '', address: '' });
  };

  const handleCreateHostel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostelForm.name || !hostelForm.college_id || !hostelForm.type) return toast({ title: 'Fill all required fields', variant: 'destructive' });
    addHostel.mutate({
      name: hostelForm.name,
      college_id: hostelForm.college_id,
      type: hostelForm.type,
      floors: hostelForm.floors,
      rooms_per_floor: hostelForm.rooms_per_floor,
      total_capacity: hostelForm.total_capacity,
    });
    setHostelForm({ name: '', type: 'boys', college_id: '', floors: 1, rooms_per_floor: 10, total_capacity: 0 });
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.hostel_id || !roomForm.room_number) return toast({ title: 'Fill all required fields', variant: 'destructive' });
    addRoom.mutate({
      hostel_id: roomForm.hostel_id,
      room_number: roomForm.room_number,
      floor_number: roomForm.floor_number,
      capacity: roomForm.capacity,
    });
    setRoomForm({ hostel_id: '', room_number: '', floor_number: 1, capacity: 2 });
  };

  const [foundProfile, setFoundProfile] = useState<any>(null);
  const handleFindProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const profile = await findProfileByEmail(wardenForm.email);
      if (!profile) return toast({ title: 'No profile found for that email', variant: 'destructive' });
      setFoundProfile(profile);
      toast({ title: 'Profile found', description: profile.full_name || profile.email });
    } catch (e: any) {
      toast({ title: 'Lookup failed', description: e.message, variant: 'destructive' });
    }
  };

  const handleAssignWarden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundProfile?.id || !wardenForm.employee_id || !wardenForm.college_id) return toast({ title: 'Fill all required fields', variant: 'destructive' });
    addWarden.mutate({
      profile_id: foundProfile.id,
      employee_id: wardenForm.employee_id,
      college_id: wardenForm.college_id,
      hostel_id: wardenForm.hostel_id || null,
    });
    setWardenForm({ email: '', employee_id: '', college_id: '', hostel_id: '' });
    setFoundProfile(null);
  };

  if (initialLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-primary/10 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading admin panel...</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-primary/10">
      <section className="container mx-auto px-4 py-8 overflow-y-auto">
        <header className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-soft">
            <Building className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage colleges, hostels, rooms, and wardens</p>
          </div>
          <Badge variant="outline" className="ml-auto">Admin</Badge>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="inline-flex w-full overflow-x-auto overflow-y-hidden flex-nowrap justify-start gap-1 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="colleges" className="whitespace-nowrap">Colleges</TabsTrigger>
            <TabsTrigger value="hostels" className="whitespace-nowrap">Hostels</TabsTrigger>
            <TabsTrigger value="rooms" className="whitespace-nowrap">Rooms</TabsTrigger>
            <TabsTrigger value="wardens" className="whitespace-nowrap">Wardens</TabsTrigger>
            <TabsTrigger value="fees" className="whitespace-nowrap">Fee Management</TabsTrigger>
            <TabsTrigger value="notifications" className="whitespace-nowrap">Notifications</TabsTrigger>
            <TabsTrigger value="analytics" className="whitespace-nowrap">Analytics</TabsTrigger>
            <TabsTrigger value="attendance" className="whitespace-nowrap">Attendance</TabsTrigger>
            <TabsTrigger value="audit" className="whitespace-nowrap">Audit Logs</TabsTrigger>
            <TabsTrigger value="export" className="whitespace-nowrap">Data Export</TabsTrigger>
            <TabsTrigger value="users" className="whitespace-nowrap">Users</TabsTrigger>
            <TabsTrigger value="reports" className="whitespace-nowrap">Reports</TabsTrigger>
            <TabsTrigger value="emails" className="whitespace-nowrap">Email</TabsTrigger>
            <TabsTrigger value="health" className="whitespace-nowrap">System Health</TabsTrigger>
          </TabsList>

          <TabsContent value="colleges">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Home className="h-4 w-4"/>Create College</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCollege} className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={collegeForm.name} onChange={(e) => setCollegeForm({ ...collegeForm, name: e.target.value })} placeholder="e.g. Springfield University" />
                    </div>
                    <div>
                      <Label>Code</Label>
                      <Input value={collegeForm.code} onChange={(e) => setCollegeForm({ ...collegeForm, code: e.target.value.toUpperCase() })} placeholder="e.g. SPU" />
                    </div>
                    <div>
                      <Label>Contact Email</Label>
                      <Input type="email" value={collegeForm.contact_email} onChange={(e) => setCollegeForm({ ...collegeForm, contact_email: e.target.value })} />
                    </div>
                    <div>
                      <Label>Contact Phone</Label>
                      <Input value={collegeForm.contact_phone} onChange={(e) => setCollegeForm({ ...collegeForm, contact_phone: e.target.value })} />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Input value={collegeForm.address} onChange={(e) => setCollegeForm({ ...collegeForm, address: e.target.value })} />
                    </div>
                    <Button type="submit" className="w-full"><Plus className="h-4 w-4 mr-2"/>Create</Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Colleges</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {colleges?.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.code}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.contact_email || '-'}{c.contact_phone ? ` • ${c.contact_phone}` : ''}</TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="mr-2"><Edit className="h-3 w-3 mr-1"/>Edit</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit College</DialogTitle>
                                </DialogHeader>
                                <EditCollegeForm college={c} onSaved={() => qc.invalidateQueries({ queryKey: ['colleges'] })} />
                              </DialogContent>
                            </Dialog>
                            <Button variant="destructive" size="sm" onClick={() => deleteCollege.mutate(c.id)}>
                              <Trash2 className="h-3 w-3 mr-1"/>Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="hostels">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Create Hostel</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateHostel} className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={hostelForm.name} onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })} placeholder="e.g. Alpha Block" />
                    </div>
                    <div>
                      <Label>College</Label>
                      <Select value={hostelForm.college_id} onValueChange={(v) => setHostelForm({ ...hostelForm, college_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select college" />
                        </SelectTrigger>
                        <SelectContent>
                          {colleges?.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select value={hostelForm.type} onValueChange={(v) => setHostelForm({ ...hostelForm, type: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="boys">Boys</SelectItem>
                          <SelectItem value="girls">Girls</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Floors</Label>
                        <Input type="number" min={1} value={hostelForm.floors} onChange={(e) => setHostelForm({ ...hostelForm, floors: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label>Rooms/Floor</Label>
                        <Input type="number" min={1} value={hostelForm.rooms_per_floor} onChange={(e) => setHostelForm({ ...hostelForm, rooms_per_floor: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label>Total Capacity</Label>
                        <Input type="number" min={0} value={hostelForm.total_capacity} onChange={(e) => setHostelForm({ ...hostelForm, total_capacity: Number(e.target.value) })} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full"><Plus className="h-4 w-4 mr-2"/>Create</Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Hostels</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>College</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hostels?.map((h: any) => (
                        <TableRow key={h.id}>
                          <TableCell className="font-medium">{h.name}</TableCell>
                          <TableCell>{h.type}</TableCell>
                          <TableCell>{colleges?.find((c: any) => c.id === h.college_id)?.name || '-'}</TableCell>
                          <TableCell>{h.total_capacity}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="destructive" size="sm" onClick={() => deleteHostel.mutate(h.id)}>
                              <Trash2 className="h-3 w-3 mr-1"/>Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rooms">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Create Room</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateRoom} className="space-y-4">
                    <div>
                      <Label>Hostel</Label>
                      <Select value={roomForm.hostel_id} onValueChange={(v) => setRoomForm({ ...roomForm, hostel_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select hostel" />
                        </SelectTrigger>
                        <SelectContent>
                          {hostels?.map((h: any) => (
                            <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Floor</Label>
                        <Input type="number" min={0} value={roomForm.floor_number} onChange={(e) => setRoomForm({ ...roomForm, floor_number: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label>Room #</Label>
                        <Input value={roomForm.room_number} onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })} />
                      </div>
                      <div>
                        <Label>Capacity</Label>
                        <Input type="number" min={1} value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full"><Plus className="h-4 w-4 mr-2"/>Create</Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Rooms</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room</TableHead>
                        <TableHead>Hostel</TableHead>
                        <TableHead>Floor</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rooms?.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.room_number}</TableCell>
                          <TableCell>{hostels?.find((h: any) => h.id === r.hostel_id)?.name || '-'}</TableCell>
                          <TableCell>{r.floor_number}</TableCell>
                          <TableCell>{r.capacity}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="destructive" size="sm" onClick={() => deleteRoom.mutate(r.id)}>
                              <Trash2 className="h-3 w-3 mr-1"/>Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="wardens">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4"/>Assign Warden</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFindProfile} className="space-y-4">
                    <div>
                      <Label>User Email</Label>
                      <Input type="email" value={wardenForm.email} onChange={(e) => setWardenForm({ ...wardenForm, email: e.target.value })} placeholder="user@example.com" />
                    </div>
                    <Button type="submit" variant="outline">Find Profile</Button>
                  </form>

                  {foundProfile && (
                    <div className="mt-6 space-y-4">
                      <div className="text-sm">
                        <div><span className="text-muted-foreground">Name:</span> {foundProfile.full_name || '-'}</div>
                        <div><span className="text-muted-foreground">Email:</span> {foundProfile.email}</div>
                        <div><span className="text-muted-foreground">Current Role:</span> {foundProfile.role}</div>
                      </div>
                      <form onSubmit={handleAssignWarden} className="space-y-4">
                        <div>
                          <Label>Employee ID</Label>
                          <Input value={wardenForm.employee_id} onChange={(e) => setWardenForm({ ...wardenForm, employee_id: e.target.value })} />
                        </div>
                        <div>
                          <Label>College</Label>
                          <Select value={wardenForm.college_id} onValueChange={(v) => setWardenForm({ ...wardenForm, college_id: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select college" />
                            </SelectTrigger>
                            <SelectContent>
                              {colleges?.map((c: any) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Hostel (optional)</Label>
                          <Select value={wardenForm.hostel_id} onValueChange={(v) => setWardenForm({ ...wardenForm, hostel_id: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Assign to hostel" />
                            </SelectTrigger>
                            <SelectContent>
                              {hostels?.filter((h: any) => !wardenForm.college_id || h.college_id === wardenForm.college_id).map((h: any) => (
                                <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">Assign</Button>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Wardens</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>College</TableHead>
                        <TableHead>Hostel</TableHead>
                        <TableHead>Profile ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wardens?.map((w: any) => (
                        <TableRow key={w.id}>
                          <TableCell>{w.employee_id}</TableCell>
                          <TableCell>{colleges?.find((c: any) => c.id === w.college_id)?.name || '-'}</TableCell>
                          <TableCell>{hostels?.find((h: any) => h.id === w.hostel_id)?.name || '-'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{w.profile_id}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

            <TabsContent value="analytics">
              <SystemAnalytics />
            </TabsContent>
            
            <TabsContent value="attendance" className="space-y-6">
              <AttendanceAnalytics />
              <MessAttendanceHistoryAdmin />
            </TabsContent>
            
            <TabsContent value="audit">
              <AuditLogs />
            </TabsContent>
            
            <TabsContent value="export">
              <DataExport />
            </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsInsights />
          </TabsContent>

          <TabsContent value="emails">
            <EmailNotifications />
          </TabsContent>

          <TabsContent value="health">
            <SystemHealth />
          </TabsContent>
          
          <TabsContent value="fees">
            <FeeManagement />
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationBroadcast />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
};

const EditCollegeForm = ({ college, onSaved }: { college: any, onSaved: () => void }) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: college.name || '',
    code: college.code || '',
    contact_email: college.contact_email || '',
    contact_phone: college.contact_phone || '',
    address: college.address || '',
    is_active: college.is_active,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('colleges').update({
      name: form.name,
      code: form.code,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      address: form.address || null,
      is_active: form.is_active,
    }).eq('id', college.id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'College updated' });
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <Label>Code</Label>
        <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Contact Email</Label>
          <Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
        </div>
        <div>
          <Label>Contact Phone</Label>
          <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
        </div>
      </div>
      <div>
        <Label>Address</Label>
        <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
};

export default AdminPanel;
