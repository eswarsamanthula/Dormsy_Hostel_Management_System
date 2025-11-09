import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface CountRow {
  student_id: string;
  count: number;
}

interface StudentInfo {
  id: string;
  student_id: string;
  profile_id: string;
  name?: string;
}

const MessAttendanceHistoryWarden = () => {
  const { profile } = useAuth();
  const [rows, setRows] = useState<CountRow[]>([]);
  const [students, setStudents] = useState<Record<string, StudentInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!profile?.id) return;

        const { data: warden, error: wardenErr } = await supabase
          .from('wardens')
          .select('hostel_id')
          .eq('profile_id', profile.id)
          .maybeSingle();
        if (wardenErr) throw wardenErr;
        const hostelId = warden?.hostel_id;
        if (!hostelId) { setRows([]); setStudents({}); return; }

        const from = format(startOfMonth(new Date()), 'yyyy-MM-dd');
        const to = format(new Date(), 'yyyy-MM-dd');

        const { data: attendance, error: attErr } = await supabase
          .from('attendance')
          .select('student_id, status, mess_attendance')
          .eq('attendance_type', 'mess')
          .eq('hostel_id', hostelId)
          .gte('date', from)
          .lte('date', to);
        if (attErr) throw attErr;

        const present = (attendance || []).filter(a => a.status === 'present' || a.mess_attendance === true);
        const map = new Map<string, number>();
        present.forEach(a => {
          map.set(a.student_id as string, (map.get(a.student_id as string) || 0) + 1);
        });
        const counts: CountRow[] = Array.from(map.entries()).map(([student_id, count]) => ({ student_id, count }));

        const studentIds = counts.map(c => c.student_id);
        if (studentIds.length) {
          const { data: studs, error: studErr } = await supabase
            .from('students')
            .select('id, student_id, profile_id')
            .in('id', studentIds);
          if (studErr) throw studErr;

          const profileIds = (studs || []).map(s => s.profile_id);
          const { data: profiles, error: profErr } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', profileIds);
          if (profErr) throw profErr;

          const studentsMap: Record<string, StudentInfo> = {};
          (studs || []).forEach(s => {
            const p = (profiles || []).find(pr => pr.id === s.profile_id);
            studentsMap[s.id] = { ...s, name: p?.full_name || undefined } as StudentInfo;
          });
          setStudents(studentsMap);
        }

        setRows(counts.sort((a, b) => b.count - a.count));
      } catch (e) {
        console.error('Warden MessAttendanceHistory load error:', e);
        setRows([]);
        setStudents({});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.id]);

  const totalMeals = useMemo(() => rows.reduce((sum, r) => sum + r.count, 0), [rows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Mess Attendance (Current Month)</span>
          <Badge variant="outline">Total meals marked: {totalMeals}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-muted-foreground py-6">Loading attendance...</div>
        ) : rows.length === 0 ? (
          <div className="text-center text-muted-foreground py-6">No mess attendance yet this month.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead className="text-right">Days Attended</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const s = students[r.student_id];
                  return (
                    <TableRow key={r.student_id}>
                      <TableCell className="font-medium">{s?.name || '-'}</TableCell>
                      <TableCell>{s?.student_id || r.student_id}</TableCell>
                      <TableCell className="text-right">{r.count}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessAttendanceHistoryWarden;
