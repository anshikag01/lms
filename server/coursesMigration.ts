import crypto from 'crypto';
import {
  NEW_INSTRUCTORS,
  NEW_CATEGORIES,
  NEW_18_COURSES,
  SEED_VIDEO_MAP
} from './seed18Courses';
import { DatabaseState, Course, Section, Lesson, Review, Enrollment } from './types';

export function migrateDatabase(state: DatabaseState): boolean {
  let modified = false;

  // 1. Ensure chat arrays exist
  if (!state.chatSessions) {
    state.chatSessions = [];
    modified = true;
  }
  if (!state.chatMessages) {
    state.chatMessages = [];
    modified = true;
  }

  // 2. Add any missing categories
  for (const cat of NEW_CATEGORIES) {
    if (!state.categories.some(c => c.id === cat.id || c.slug === cat.slug)) {
      state.categories.push(cat);
      modified = true;
    }
  }

  // 3. Add any missing instructors
  for (const inst of NEW_INSTRUCTORS) {
    if (!state.users.some(u => u.id === inst.user.id)) {
      state.users.push(inst.user);
      modified = true;
    }
    if (!state.profiles.some(p => p.id === inst.profile.id)) {
      state.profiles.push(inst.profile);
      modified = true;
    }
    if (!state.userRoles.some(r => r.userId === inst.role.userId)) {
      state.userRoles.push(inst.role);
      modified = true;
    }
  }

  // Sample student IDs for reviews and enrollments
  const studentIds = ['usr-stud-301', 'usr-stud-302', 'usr-stud-303'];

  // Sample realistic comments for reviews
  const reviewCommentsPool = [
    'Outstanding structured walkthrough! Concepts are explained simply with actionable real-world examples.',
    'Very well-paced. The exercises and video breakdowns gave me immediate clarity.',
    'Clear and practical from start to finish. I was able to apply these frameworks immediately.',
    'The instructor is knowledgeable and delivers the content in an engaging manner. Highly recommended!',
    'Great course for beginners. Breaks down intimidating concepts into bite-sized, digestible lessons.',
    'Practical insights with zero fluff. One of the best investments of my time this month.'
  ];

  // 4. Migrate the 18 new courses
  for (let cIdx = 0; cIdx < NEW_18_COURSES.length; cIdx++) {
    const bp = NEW_18_COURSES[cIdx];
    // Check if course already exists
    let existingCourse = state.courses.find(c => c.slug === bp.slug);
    if (!existingCourse) {
      const courseId = `crs-nonprog-${cIdx + 101}`;
      const newCourse: Course = {
        id: courseId,
        title: bp.title,
        slug: bp.slug,
        shortDescription: bp.shortDescription,
        description: bp.description,
        thumbnailUrl: bp.thumbnailUrl,
        categoryId: bp.categoryId,
        level: bp.level,
        price: bp.price,
        language: bp.language,
        whatYouWillLearn: bp.whatYouWillLearn,
        requirements: bp.requirements,
        status: 'published',
        instructorId: bp.instructorId,
        createdAt: new Date(Date.now() - (cIdx + 1) * 86400000).toISOString()
      };
      state.courses.push(newCourse);
      modified = true;

      // Create 3 sections x 4 lessons = 12 lessons
      const videos = SEED_VIDEO_MAP[bp.slug] || [];

      bp.sectionNames.forEach((secTitle, sIdx) => {
        const sectionId = `sec-${courseId}-${sIdx + 1}`;
        if (!state.sections.some(s => s.id === sectionId)) {
          state.sections.push({
            id: sectionId,
            courseId,
            title: secTitle,
            position: sIdx + 1
          });
        }

        const lessonTitles = bp.lessonTitles[sIdx] || [];
        lessonTitles.forEach((lesTitle, lIdx) => {
          const lessonNumber = sIdx * 4 + lIdx + 1;
          const lessonId = `les-${courseId}-${lessonNumber}`;
          const videoUrl = videos[lessonNumber - 1] || 'https://www.youtube.com/watch?v=IlU-zDU6aQ0';

          if (!state.lessons.some(l => l.id === lessonId)) {
            state.lessons.push({
              id: lessonId,
              sectionId,
              title: lesTitle,
              videoUrl,
              videoType: 'youtube',
              durationMinutes: 10 + ((lessonNumber * 3) % 15),
              position: lessonNumber,
              isFreePreview: lessonNumber === 1, // First lesson of every course is_free_preview = true
              resourcesUrl: 'https://learnhub.com/resources/starter-guide.pdf'
            });
          }
        });
      });

      // Add 3-4 reviews per course
      const numReviews = 3 + (cIdx % 2); // 3 or 4 reviews
      for (let rIdx = 0; rIdx < numReviews; rIdx++) {
        const studentId = studentIds[rIdx % studentIds.length];
        const rating = rIdx === 1 ? 4 : 5; // mix of 4 and 5 star ratings
        const comment = reviewCommentsPool[(cIdx + rIdx) % reviewCommentsPool.length];
        const reviewId = `rev-${courseId}-${rIdx + 1}`;

        if (!state.reviews.some(r => r.id === reviewId)) {
          state.reviews.push({
            id: reviewId,
            userId: studentId,
            courseId,
            rating,
            comment,
            createdAt: new Date(Date.now() - (rIdx + 2) * 86400000).toISOString()
          });
        }

        // Ensure review author has an enrollment
        const enrId = `enr-${courseId}-${studentId}`;
        if (!state.enrollments.some(e => e.userId === studentId && e.courseId === courseId)) {
          state.enrollments.push({
            id: enrId,
            userId: studentId,
            courseId,
            enrolledAt: new Date(Date.now() - (rIdx + 5) * 86400000).toISOString(),
            completedAt: rIdx === 0 ? new Date(Date.now() - 86400000).toISOString() : null,
            certificateId: rIdx === 0 ? `CERT-LH-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}` : null
          });
        }
      }
    }
  }

  return modified;
}
