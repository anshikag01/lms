import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { StatCard } from '../components/StatCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import {
  BookOpen,
  Users,
  Star,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
  Upload,
  Video,
  X
} from 'lucide-react';

export const InstructorDashboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'courses' | 'students'>('courses');
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState<string | null>(null);

  // Course Builder Modal State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [builderStep, setBuilderStep] = useState<1 | 2 | 3>(1);

  // Course Form State
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [courseLevel, setCourseLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [coursePrice, setCoursePrice] = useState(79.99);
  const [courseShortDesc, setCourseShortDesc] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [whatYouLearnInput, setWhatYouLearnInput] = useState('');
  const [requirementsInput, setRequirementsInput] = useState('');
  const [courseThumbnail, setCourseThumbnail] = useState('/src/assets/images/course_banner_coding_1793389667734.jpg');

  // Curriculum Form State (Sections and lessons)
  const [sectionsState, setSectionsState] = useState<
    { title: string; lessons: { title: string; videoUrl: string; durationMinutes: number; isFreePreview: boolean }[] }[]
  >([
    {
      title: 'Module 1: Getting Started & Foundations',
      lessons: [
        {
          title: '01. Architecture Overview',
          videoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
          durationMinutes: 12,
          isFreePreview: true
        }
      ]
    }
  ]);

  // Delete Dialog State
  const [courseToDelete, setCourseToDelete] = useState<{ id: string; title: string } | null>(null);

  // Queries
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['instructorDashboard'],
    queryFn: () => api.getInstructorDashboard()
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories()
  });

  const { data: studentsData, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['courseStudents', selectedCourseForStudents],
    queryFn: () => api.getCourseStudents(selectedCourseForStudents!),
    enabled: !!selectedCourseForStudents
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => api.createCourse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructorDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsBuilderOpen(false);
      resetBuilderForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.updateCourse(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructorDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsBuilderOpen(false);
      resetBuilderForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructorDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setCourseToDelete(null);
    }
  });

  const resetBuilderForm = () => {
    setEditingCourseId(null);
    setCourseTitle('');
    setCourseCategory(categories?.[0]?.id || 'cat-1');
    setCourseLevel('beginner');
    setCoursePrice(79.99);
    setCourseShortDesc('');
    setCourseDesc('');
    setWhatYouLearnInput('');
    setRequirementsInput('');
    setCourseThumbnail('/src/assets/images/course_banner_coding_1793389667734.jpg');
    setSectionsState([
      {
        title: 'Module 1: Getting Started & Foundations',
        lessons: [
          {
            title: '01. Architecture Overview',
            videoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
            durationMinutes: 12,
            isFreePreview: true
          }
        ]
      }
    ]);
    setBuilderStep(1);
  };

  const handleOpenCreate = () => {
    resetBuilderForm();
    if (categories && categories.length > 0) {
      setCourseCategory(categories[0].id);
    }
    setIsBuilderOpen(true);
  };

  const handleOpenEdit = (course: any) => {
    setEditingCourseId(course.id);
    setCourseTitle(course.title);
    setCourseCategory(course.categoryId);
    setCourseLevel(course.level);
    setCoursePrice(course.price);
    setCourseShortDesc(course.shortDescription || '');
    setCourseDesc(course.description || '');
    setWhatYouLearnInput(course.whatYouWillLearn?.join('\n') || '');
    setRequirementsInput(course.requirements?.join('\n') || '');
    setCourseThumbnail(course.thumbnailUrl);
    setBuilderStep(1);
    setIsBuilderOpen(true);
  };

  const handleSaveCourse = () => {
    const payload = {
      title: courseTitle,
      categoryId: courseCategory,
      level: courseLevel,
      price: Number(coursePrice),
      shortDescription: courseShortDesc,
      description: courseDesc,
      whatYouWillLearn: whatYouLearnInput.split('\n').filter((l) => l.trim().length > 0),
      requirements: requirementsInput.split('\n').filter((l) => l.trim().length > 0),
      thumbnailUrl: courseThumbnail,
      sections: sectionsState
    };

    if (editingCourseId) {
      updateMutation.mutate({ id: editingCourseId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Section manipulation helpers
  const addSection = () => {
    setSectionsState((prev) => [
      ...prev,
      {
        title: `Module ${prev.length + 1}: Advanced Topics`,
        lessons: [
          {
            title: `01. Core Concepts`,
            videoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
            durationMinutes: 10,
            isFreePreview: false
          }
        ]
      }
    ]);
  };

  const addLessonToSection = (sectionIndex: number) => {
    setSectionsState((prev) => {
      const copy = [...prev];
      const sec = copy[sectionIndex];
      sec.lessons.push({
        title: `Lesson ${sec.lessons.length + 1}`,
        videoUrl: 'https://www.youtube.com/watch?v=Ke90Tje7VS0',
        durationMinutes: 15,
        isFreePreview: false
      });
      return copy;
    });
  };

  const removeSection = (index: number) => {
    setSectionsState((prev) => prev.filter((_, i) => i !== index));
  };

  const removeLesson = (secIndex: number, lesIndex: number) => {
    setSectionsState((prev) => {
      const copy = [...prev];
      copy[secIndex].lessons = copy[secIndex].lessons.filter((_, i) => i !== lesIndex);
      return copy;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <TableSkeleton rows={4} />
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || { totalCourses: 0, totalStudents: 0, avgRating: 0, totalEarnings: 0 };
  const courses = dashboardData?.courses || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* HEADER STRIP */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Instructor Studio
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Manage video curriculum, publish modules, track enrolled students, and inspect performance analytics.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Course</span>
          </button>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="My Courses"
            value={stats.totalCourses}
            subtitle="Published & in-review"
            icon={<BookOpen className="w-5 h-5" />}
          />
          <StatCard
            label="Enrolled Students"
            value={stats.totalStudents}
            subtitle="Global student reach"
            icon={<Users className="w-5 h-5 text-indigo-500" />}
          />
          <StatCard
            label="Average Rating"
            value={stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)} / 5` : 'New'}
            subtitle="Verified reviews"
            icon={<Star className="w-5 h-5 text-amber-500" />}
          />
          <StatCard
            label="Estimated Earnings"
            value={`$${stats.totalEarnings.toLocaleString()}`}
            subtitle="80% revenue share"
            icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
          />
        </div>

        {/* TABS */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'courses'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Curriculum ({courses.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('students');
                if (courses.length > 0 && !selectedCourseForStudents) {
                  setSelectedCourseForStudents(courses[0].id);
                }
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'students'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Enrolled Students
            </button>
          </div>

          {/* TAB 1: COURSES TABLE */}
          {activeTab === 'courses' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 overflow-hidden shadow-xs">
              {courses.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No courses published yet"
                  description="Start sharing your architecture knowledge. Click Create New Course to launch your first masterclass."
                  actionText="Launch Course Builder"
                  onAction={handleOpenCreate}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-3.5">Course</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Price</th>
                        <th className="px-5 py-3.5">Students</th>
                        <th className="px-5 py-3.5">Rating</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {courses.map((course) => (
                        <tr key={course.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={course.thumbnailUrl}
                                alt=""
                                className="w-12 h-8 rounded-lg object-cover shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="truncate max-w-xs sm:max-w-sm">
                                <div className="font-bold text-slate-900 dark:text-white truncate">
                                  {course.title}
                                </div>
                                <div className="text-[11px] text-slate-400 capitalize">
                                  {course.level} · {course.aggregates?.totalLessons || 12} lessons
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                                course.status === 'published'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                  : course.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {course.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                            {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
                          </td>

                          <td className="px-5 py-4 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                            {course.aggregates?.enrollmentCount || 0}
                          </td>

                          <td className="px-5 py-4 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                            ★ {(course.aggregates?.ratingAverage || 0).toFixed(1)}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`/courses/${course.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Preview Public Page"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleOpenEdit(course)}
                                className="p-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                                title="Edit Course"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setCourseToDelete({ id: course.id, title: course.title })}
                                className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                title="Delete Course"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ENROLLED STUDENTS PER COURSE */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              
              {/* Select course dropdown */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Course:
                </span>
                <select
                  value={selectedCourseForStudents || ''}
                  onChange={(e) => setSelectedCourseForStudents(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Students Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 overflow-hidden shadow-xs">
                {isStudentsLoading ? (
                  <div className="p-6">
                    <TableSkeleton rows={3} />
                  </div>
                ) : !studentsData || studentsData.students.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-500">
                    No students currently enrolled in this specific course.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-3.5">Student</th>
                        <th className="px-5 py-3.5">Enrolled Date</th>
                        <th className="px-5 py-3.5">Progress</th>
                        <th className="px-5 py-3.5">Milestones</th>
                        <th className="px-5 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {studentsData.students.map((st: any) => (
                        <tr key={st.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={st.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(st.fullName)}`}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white">
                                  {st.fullName}
                                </div>
                                <div className="text-[11px] text-slate-500">{st.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-slate-500 font-mono text-[11px]">
                            {new Date(st.enrolledAt).toLocaleDateString()}
                          </td>

                          <td className="px-5 py-4">
                            <div className="w-32">
                              <div className="flex justify-between text-[11px] font-mono mb-1">
                                <span>{st.progressPercent}%</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-full rounded-full"
                                  style={{ width: `${st.progressPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 font-mono tabular-nums text-slate-500 text-[11px]">
                            {st.completedLessons} / {st.totalLessons} lessons
                          </td>

                          <td className="px-5 py-4">
                            {st.completedAt ? (
                              <span className="text-emerald-600 font-semibold flex items-center gap-1 text-[11px]">
                                <CheckCircle className="w-3.5 h-3.5" /> Certified
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">In Progress</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* MULTI-STEP COURSE BUILDER MODAL */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full my-8 p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingCourseId ? 'Edit Course Masterclass' : 'Create New Course Masterclass'}
                </h2>
                <p className="text-xs text-slate-500">
                  Step {builderStep} of 3 · {builderStep === 1 ? 'Basic Details' : builderStep === 2 ? 'Curriculum Builder' : 'Review & Publish'}
                </p>
              </div>
              <button
                onClick={() => setIsBuilderOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: BASIC DETAILS */}
            {builderStep === 1 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g., Enterprise Distributed Systems with Kafka"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Category *
                    </label>
                    <select
                      value={courseCategory}
                      onChange={(e) => setCourseCategory(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                    >
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Level
                    </label>
                    <select
                      value={courseLevel}
                      onChange={(e) => setCourseLevel(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Price (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={coursePrice}
                      onChange={(e) => setCoursePrice(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Short Description (1 sentence summary)
                  </label>
                  <input
                    type="text"
                    value={courseShortDesc}
                    onChange={(e) => setCourseShortDesc(e.target.value)}
                    placeholder="Concise overview shown on catalog cards..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Full Description *
                  </label>
                  <textarea
                    rows={4}
                    value={courseDesc}
                    onChange={(e) => setCourseDesc(e.target.value)}
                    placeholder="Comprehensive explanation of concepts covered, projects built, and methodologies..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      What Students Will Learn (1 per line)
                    </label>
                    <textarea
                      rows={3}
                      value={whatYouLearnInput}
                      onChange={(e) => setWhatYouLearnInput(e.target.value)}
                      placeholder="Build production microservices&#10;Implement zero-trust security..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Prerequisites (1 per line)
                    </label>
                    <textarea
                      rows={3}
                      value={requirementsInput}
                      onChange={(e) => setRequirementsInput(e.target.value)}
                      placeholder="Basic familiarity with JavaScript or TypeScript&#10;Local terminal setup..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: CURRICULUM BUILDER */}
            {builderStep === 2 && (
              <div className="space-y-6 text-xs max-h-[50vh] overflow-y-auto pr-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Curriculum Sections & Video Lessons
                  </span>
                  <button
                    onClick={addSection}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Module Section</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {sectionsState.map((sec, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => {
                            const copy = [...sectionsState];
                            copy[sIdx].title = e.target.value;
                            setSectionsState(copy);
                          }}
                          className="font-bold text-xs bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-lg flex-1 text-slate-900 dark:text-white"
                          placeholder="Section Title"
                        />
                        <button
                          onClick={() => removeSection(sIdx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                          title="Remove Section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Lessons inside Section */}
                      <div className="space-y-2 pl-3 border-l-2 border-slate-200 dark:border-slate-800">
                        {sec.lessons.map((les, lIdx) => (
                          <div
                            key={lIdx}
                            className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap sm:flex-nowrap items-center gap-2"
                          >
                            <input
                              type="text"
                              value={les.title}
                              onChange={(e) => {
                                const copy = [...sectionsState];
                                copy[sIdx].lessons[lIdx].title = e.target.value;
                                setSectionsState(copy);
                              }}
                              placeholder="Lesson Title"
                              className="flex-1 p-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-900 dark:text-white"
                            />
                            <input
                              type="text"
                              value={les.videoUrl}
                              onChange={(e) => {
                                const copy = [...sectionsState];
                                copy[sIdx].lessons[lIdx].videoUrl = e.target.value;
                                setSectionsState(copy);
                              }}
                              placeholder="YouTube URL"
                              className="w-44 p-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-900 dark:text-white font-mono"
                            />
                            <input
                              type="number"
                              value={les.durationMinutes}
                              onChange={(e) => {
                                const copy = [...sectionsState];
                                copy[sIdx].lessons[lIdx].durationMinutes = parseInt(e.target.value) || 5;
                                setSectionsState(copy);
                              }}
                              placeholder="Mins"
                              className="w-16 p-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-900 dark:text-white font-mono"
                            />
                            <button
                              onClick={() => removeLesson(sIdx, lIdx)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <button
                          onClick={() => addLessonToSection(sIdx)}
                          className="mt-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Lesson
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW & PUBLISH */}
            {builderStep === 3 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{courseTitle || 'Untitled Course'}</h3>
                  <p className="text-slate-500">{courseShortDesc}</p>
                  <div className="pt-2 flex items-center gap-4 text-slate-600 dark:text-slate-400 font-mono">
                    <span>Price: ${coursePrice.toFixed(2)}</span>
                    <span>Level: {courseLevel}</span>
                    <span>Sections: {sectionsState.length}</span>
                    <span>Total Lessons: {sectionsState.reduce((acc, s) => acc + s.lessons.length, 0)}</span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Submitting this course will mark it as Pending for platform administrator moderation.</span>
                </div>
              </div>
            )}

            {/* Bottom Stepper Controls */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {builderStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setBuilderStep((prev) => (prev - 1) as any)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {builderStep < 3 ? (
                <button
                  type="button"
                  disabled={!courseTitle.trim() || !courseDesc.trim()}
                  onClick={() => setBuilderStep((prev) => (prev + 1) as any)}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveCourse}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving Masterclass...'
                    : editingCourseId
                    ? 'Save Changes'
                    : 'Submit Course for Review'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!courseToDelete}
        title="Delete Course Masterclass?"
        message={`Are you sure you want to permanently delete "${courseToDelete?.title}"? All associated sections, lessons, and enrollment records will be permanently removed.`}
        confirmText="Yes, Delete Course"
        confirmVariant="danger"
        onConfirm={() => courseToDelete && deleteMutation.mutate(courseToDelete.id)}
        onCancel={() => setCourseToDelete(null)}
      />

    </div>
  );
};
