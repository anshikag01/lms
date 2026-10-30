import { Course, Category, Profile, Role, EnrolledCourseItem, Review, QuizAttempt, CertificateData } from '../types';

const TOKEN_KEY = 'learnhub_auth_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  signup: (payload: { email: string; password: string; fullName: string; role?: 'student' | 'instructor' }) =>
    fetchApi<{ user: { id: string; email: string }; profile: Profile; role: Role; token: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  login: (payload: { email: string; password: string }) =>
    fetchApi<{ user: { id: string; email: string }; profile: Profile; role: Role; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  logout: () =>
    fetchApi<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  getMe: () =>
    fetchApi<{ user: { id: string; email: string } | null; profile: Profile | null; role: Role | null }>('/api/auth/me'),

  resetPassword: (email: string) =>
    fetchApi<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    fetchApi<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  updateProfile: (payload: { fullName?: string; bio?: string; avatarUrl?: string }) =>
    fetchApi<{ profile: Profile }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  // Stats & Categories
  getStats: () =>
    fetchApi<{ totalCourses: number; totalStudents: number; totalInstructors: number; averageRating: number }>('/api/stats'),

  getCategories: () =>
    fetchApi<Category[]>('/api/categories'),

  // Courses
  getCourses: (params?: { search?: string; category?: string; level?: string; price?: string; rating?: string; sort?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.append(k, v);
      });
    }
    return fetchApi<Course[]>(`/api/courses?${query.toString()}`);
  },

  getCourseDetail: (slug: string) =>
    fetchApi<{
      course: Course;
      instructor: Profile;
      category: Category;
      aggregates: any;
      curriculum: any[];
      reviews: Review[];
      enrollment: any;
      completedLessonIds: string[];
    }>(`/api/courses/${slug}`),

  enrollCourse: (courseId: string) =>
    fetchApi<{ success: boolean; enrollment: any; message?: string }>(`/api/courses/${courseId}/enroll`, {
      method: 'POST'
    }),

  // Student Dashboard
  getStudentDashboard: () =>
    fetchApi<{
      stats: { enrolledCount: number; completedCount: number; hoursLearned: number };
      inProgressCourses: EnrolledCourseItem[];
      completedCourses: EnrolledCourseItem[];
      allCourses: EnrolledCourseItem[];
    }>('/api/student/dashboard'),

  // Learning Player
  getLearnCourse: (courseSlug: string) =>
    fetchApi<{
      course: Course;
      curriculum: any[];
      isEnrolled: boolean;
      isInstructor: boolean;
      isAdmin: boolean;
      enrollment: any;
      completedLessons: Record<string, boolean>;
      notes: Record<string, string>;
      quiz: { id: string; title: string; passPercentage: number } | null;
      latestQuizAttempt: QuizAttempt | null;
    }>(`/api/learn/${courseSlug}`),

  updateLessonProgress: (payload: { lessonId: string; courseId: string; completed: boolean }) =>
    fetchApi<{
      success: boolean;
      completed: boolean;
      completedCount: number;
      totalCount: number;
      enrollment: any;
      newlyCompleted: boolean;
    }>('/api/learn/progress', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  saveLessonNote: (lessonId: string, content: string) =>
    fetchApi<{ success: boolean; note: any }>('/api/learn/notes', {
      method: 'POST',
      body: JSON.stringify({ lessonId, content })
    }),

  // Reviews
  addReview: (courseId: string, payload: { rating: number; comment: string }) =>
    fetchApi<{ success: boolean; review: Review }>(`/api/courses/${courseId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Quiz
  getQuiz: (courseSlug: string) =>
    fetchApi<{
      quiz: { id: string; courseId: string; title: string; passPercentage: number };
      courseTitle: string;
      courseSlug: string;
      questions: { id: string; question: string; options: string[] }[];
      attempts: QuizAttempt[];
    }>(`/api/learn/${courseSlug}/quiz`),

  submitQuizAttempt: (courseSlug: string, answers: Record<string, number>) =>
    fetchApi<{
      attempt: QuizAttempt;
      feedback: {
        questionId: string;
        question: string;
        selectedIndex: number;
        correctIndex: number;
        isCorrect: boolean;
        explanation: string;
      }[];
      certificateId: string | null;
    }>(`/api/learn/${courseSlug}/quiz/attempt`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    }),

  // Certificate
  getCertificate: (certificateId: string) =>
    fetchApi<CertificateData>(`/api/certificates/${certificateId}`),

  // Instructor
  getInstructorDashboard: () =>
    fetchApi<{
      stats: { totalCourses: number; totalStudents: number; avgRating: number; totalEarnings: number };
      courses: Course[];
    }>('/api/instructor/dashboard'),

  createCourse: (payload: any) =>
    fetchApi<{ success: boolean; course: Course }>('/api/instructor/courses', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateCourse: (id: string, payload: any) =>
    fetchApi<{ success: boolean; course: Course }>(`/api/instructor/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteCourse: (id: string) =>
    fetchApi<{ success: boolean; message: string }>(`/api/instructor/courses/${id}`, {
      method: 'DELETE'
    }),

  getCourseStudents: (courseId: string) =>
    fetchApi<{ courseTitle: string; students: any[] }>(`/api/instructor/courses/${courseId}/students`),

  // Admin
  getAdminDashboard: () =>
    fetchApi<{
      stats: { totalUsers: number; totalCourses: number; totalEnrollments: number; totalRevenue: number };
      enrollmentTrends: { month: string; enrollments: number; revenue: number }[];
      coursesByCategory: { name: string; fullName: string; courses: number }[];
    }>('/api/admin/dashboard'),

  getAdminUsers: () =>
    fetchApi<any[]>('/api/admin/users'),

  updateUserRole: (userId: string, role: Role) =>
    fetchApi<{ success: boolean; message: string }>(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    }),

  deleteUser: (userId: string) =>
    fetchApi<{ success: boolean; message: string }>(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    }),

  getAdminCourses: () =>
    fetchApi<Course[]>('/api/admin/courses'),

  updateCourseStatus: (courseId: string, status: string) =>
    fetchApi<{ success: boolean; course: Course }>(`/api/admin/courses/${courseId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

  createCategory: (payload: { name: string; icon?: string }) =>
    fetchApi<{ category: Category }>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  deleteCategory: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/admin/categories/${id}`, {
      method: 'DELETE'
    }),

  resetDatabase: () =>
    fetchApi<{ success: boolean; message: string }>('/api/admin/reset-database', {
      method: 'POST'
    })
};
