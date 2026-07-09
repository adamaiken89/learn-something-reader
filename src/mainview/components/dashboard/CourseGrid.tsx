import CourseCard from './CourseCard';
import { useCourseStore } from '../../stores/courseStore';

export default function CourseGrid() {
  const courses = useCourseStore((s) => s.courses);
  if (courses.length === 0) return null;
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
