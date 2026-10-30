export type Role = 'student' | 'instructor' | 'admin';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'pending' | 'published' | 'rejected';

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  fullName: string;
  avatarUrl: string;
  bio: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  courseCount?: number;
}

export interface CourseAggregates {
  ratingAverage: number;
  totalReviews: number;
  enrollmentCount: number;
  totalLessons: number;
  totalDurationMinutes: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  categoryId: string;
  level: CourseLevel;
  price: number;
  language: string;
  whatYouWillLearn: string[];
  requirements: string[];
  status: CourseStatus;
  instructorId: string;
  createdAt: string;
  aggregates?: CourseAggregates;
  instructor?: Profile;
  category?: Category;
}

export interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  videoUrl: string;
  videoType: 'youtube' | 'upload';
  durationMinutes: number;
  position: number;
  isFreePreview: boolean;
  resourcesUrl?: string;
}

export interface Section {
  id: string;
  courseId: string;
  title: string;
  position: number;
  lessons?: Lesson[];
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  completedAt?: string | null;
  certificateId?: string | null;
}

export interface Review {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: Profile;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  passPercentage: number;
}

export interface QuizQuestion {
  id: string;
  quizId?: string;
  question: string;
  options: string[];
  correctIndex?: number;
  explanation?: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  passed: boolean;
  answers: Record<string, number>;
  createdAt: string;
}

export interface EnrolledCourseItem {
  enrollment: Enrollment;
  course: Course;
  instructor?: Profile;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  nextLessonId?: string | null;
}

export interface CertificateData {
  certificateId: string;
  issuedAt: string;
  studentName: string;
  courseTitle: string;
  courseSlug: string;
  instructorName: string;
  totalDurationMinutes: number;
  totalLessons: number;
}
