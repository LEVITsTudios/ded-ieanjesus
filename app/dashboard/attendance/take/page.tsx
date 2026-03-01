"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Course {
  id: string;
  name: string;
}

interface Student {
  id: string;
  full_name: string;
}

export default function TakeAttendancePage() {
  const supabase = createClient();
  const router = useRouter();

  const [userRole, setUserRole] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [meetings, setMeetings] = useState<Array<{ id: string; title: string; meeting_date: string; course_id: string }>>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedMeeting, setSelectedMeeting] = useState<string>("all");
  const [students, setStudents] = useState<Student[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        router.replace("/dashboard/attendance");
        return;
      }
      const role = user.user_metadata?.role || "student";
      setUserRole(role);
      if (role !== "teacher" && role !== "admin") {
        router.replace("/dashboard/attendance");
        return;
      }

      // load courses and meetings for this teacher or all if admin
      let courseQuery = supabase.from("courses").select("id, name");
      if (role === "teacher") {
        courseQuery = courseQuery.eq("teacher_id", user.id);
      }
      const { data: courseData, error: courseErr } = await courseQuery;
      if (courseErr) {
        console.error(courseErr);
        setError("Error cargando cursos");
      } else {
        setCourses(courseData || []);
      }

      // load meetings related to those courses where teacher is organizer or participant
      let meetingQuery = supabase.from("meetings").select("id, title, meeting_date, course_id, organizer_id");
      if (role === "teacher") {
        meetingQuery = meetingQuery.or(
          `organizer_id.eq.${user.id},participants.user_id.eq.${user.id}`
        )
      }
      const { data: meetData, error: meetErr } = await meetingQuery;
      if (meetErr) {
        console.error(meetErr);
      } else {
        setMeetings(meetData || []);
      }
    };
    init();
  }, [router, supabase]);

  useEffect(() => {
    const loadStudents = async () => {
      const courseToUse =
        selectedMeeting !== "all"
          ? meetings.find((m) => m.id === selectedMeeting)?.course_id
          : selectedCourse;
      if (!courseToUse || courseToUse === "all") {
        setStudents([]);
        return;
      }
      setLoading(true);
      const { data: enrolls, error: enrollErr } = await supabase
        .from("enrollments")
        .select("student:profiles(id, full_name)")
        .eq("course_id", courseToUse);
      if (enrollErr) {
        console.error('[TakeAttendance] enrollments error', enrollErr);
        setError(`Error cargando estudiantes: ${enrollErr.message}`);
      } else {
        setStudents((enrolls || []).map((e: any) => e.student));
        const m: Record<string, string> = {};
        (enrolls || []).forEach((e: any) => (m[e.student.id] = "present"));
        setStatusMap(m);
      }
      setLoading(false);
    };
    loadStudents();
  }, [selectedCourse, selectedMeeting, meetings, supabase]);

  const handleSubmit = async () => {
    if (!window.confirm("Registrar asistencia para todos los estudiantes?")) return;
    setLoading(true);
    try {
      // verify session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("Sesión expirada, por favor inicia sesión nuevamente.")
      }

      const payloads = students.map((s) => ({
        student_id: s.id,
        course_id: selectedCourse,
        meeting_id: selectedMeeting !== 'all' ? selectedMeeting : undefined,
        date: format(date, "yyyy-MM-dd"),
        status: statusMap[s.id] || "present",
      }));

      for (const p of payloads) {
        const token = session.access_token
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify(p),
        });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || "Error al crear");
        }
      }
      alert("Asistencia registrada");
      router.replace("/dashboard/attendance");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Fallo al enviar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Pasar Lista</h1>
      {error && <p className="text-destructive">{error}</p>}

      <div className="flex gap-4">
        <Select value={selectedCourse} onValueChange={(v) => { setSelectedCourse(v); setSelectedMeeting('all'); }}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Seleccionar curso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Selecciona un curso</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedMeeting} onValueChange={(v) => setSelectedMeeting(v)}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Seleccionar reunión" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Selecciona una reunión</SelectItem>
            {meetings
              .filter((m) => selectedCourse === 'all' || m.course_id === selectedCourse)
              .map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {`${m.title || 'Clase'} (${new Date(m.meeting_date).toLocaleDateString()})`}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {students.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium">Fecha: {format(date, "PPP", { locale: es })}</p>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="border p-2">Estudiante</th>
                <th className="border p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border">
                  <td className="p-2">{s.full_name}</td>
                  <td className="p-2">
                    <div className="relative inline-block w-56">
                    <select
                        value={statusMap[s.id]}
                        onChange={(e) =>
                        setStatusMap((prev) => ({ ...prev, [s.id]: e.target.value }))
                        }
                        className="
                        w-full
                        appearance-none
                        px-4 py-3 pr-10
                        text-sm font-semibold
                        border border-indigo-500
                        rounded-xl
                        shadow-[inset_0_2px_6px_rgba(255,255,255,0.7),0_8px_20px_rgba(0,0,0,0.15)]
                        backdrop-blur-md
                        transition-all duration-300 ease-out
                        hover:shadow-[inset_0_2px_8px_rgba(255,255,255,0.8),0_12px_25px_rgba(0,0,0,0.2)]
                        hover:-translate-y-0.5
                        focus:outline-none
                        focus:ring-2 focus:ring-indigo-400
                        focus:shadow-[0_0_0_4px_rgba(99,102,241,0.3),0_10px_30px_rgba(0,0,0,0.25)]
                        focus:-translate-y-1
                        cursor-pointer
                        "
                    >
                        <option value="present">🟢 Presente</option>
                        <option value="absent">🔴 Ausente</option>
                        <option value="late">🟡 Tarde</option>
                        <option value="excused">🔵 Justificado</option>
                    </select>

                    {/* Icono personalizado */}
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button onClick={handleSubmit} disabled={loading} className="mt-4">
            {loading ? "Enviando..." : "Registrar Asistencia"}
          </Button>
        </div>
      )}

      {students.length === 0 && selectedCourse !== "all" && !loading && (
        <p>No hay estudiantes inscritos en este curso.</p>
      )}
    </div>
  );
}
