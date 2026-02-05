export type UserRole = "admin" | "teacher" | "student" | "parent"

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  phone?: string
  date_of_birth?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  name: string
  description?: string
  code: string
  teacher_id: string
  grade_level?: string
  subject?: string
  max_students?: number
  status: "active" | "inactive" | "archived"
  created_at: string
  updated_at: string
  teacher?: Profile
}

export interface Enrollment {
  id: string
  course_id: string
  student_id: string
  enrolled_at: string
  status: "active" | "completed" | "dropped"
  course?: Course
  student?: Profile
}

export interface Schedule {
  id: string
  course_id: string
  day_of_week: number
  start_time: string
  end_time: string
  room?: string
  course?: Course
}

export interface Attendance {
  id: string
  schedule_id: string
  student_id: string
  date: string
  status: "present" | "absent" | "late" | "excused"
  notes?: string
  schedule?: Schedule
  student?: Profile
}

export interface Material {
  id: string
  course_id: string
  title: string
  description?: string
  file_url?: string
  file_type?: string
  uploaded_by: string
  created_at: string
  course?: Course
}

export interface Assignment {
  id: string
  course_id: string
  title: string
  description?: string
  due_date?: string
  max_score?: number
  created_at: string
  course?: Course
}

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  content?: string
  file_url?: string
  submitted_at: string
  assignment?: Assignment
  student?: Profile
}

export interface Grade {
  id: string
  student_id: string
  course_id: string
  assignment_id?: string
  score: number
  max_score: number
  graded_by: string
  graded_at: string
  comments?: string
}

export interface Meeting {
  id: string
  title: string
  description?: string
  meeting_type: "class" | "parent_teacher" | "staff" | "general"
  scheduled_at: string
  duration_minutes?: number
  location?: string
  meeting_url?: string
  created_by: string
  created_at: string
}

export interface Permission {
  id: string
  student_id: string
  requested_by: string
  permission_type: "absence" | "early_leave" | "late_arrival" | "other"
  start_date: string
  end_date: string
  reason?: string
  status: "pending" | "approved" | "denied"
  approved_by?: string
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  target_role?: UserRole
  course_id?: string
  created_by: string
  created_at: string
  expires_at?: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  notification_type: string
  is_read: boolean
  created_at: string
}
