# Prop drilling reduction plan

## 1. QuizSection — drop courseId/moduleId props
- `sections/QuizSection.tsx`: Remove `courseId`, `moduleId` from `Props`. Use `course.id`, `module.id` inline.
- `pages/QuizPage.tsx`: Remove `courseId={course.id} moduleId={module.id}` from `<QuizSection>` call.

## 2. ClozeQuizSection — same pattern
- `sections/ClozeQuizSection.tsx`: Remove `courseId`, `moduleId` from `Props`. Use `course.id`, `module.id` inline.
- `pages/ClozeQuizPage.tsx`: Remove `courseId={course.id} moduleId={module.id}` from `<ClozeQuizSection>` call.

## 3. QuizCompletionView — compute percentage internally
- `components/quiz/QuizCompletionView.tsx`: Remove `percentage` from `Props`. Compute `percentage = total > 0 ? Math.round((score / total) * 100) : 0` inside component.
- Update 3 callers: `QuizSection`, `ClozeQuizSection`, `CumulativeQuizSection` — remove `percentage={...}` prop.

## 4. HighlightItem — drop contentRef/sections props
- `components/studyTools/HighlightItem.tsx`: Remove `contentRef`, `sections` from `Props`. Import `useLessonViewStore`, read from store.

## 5. NoteItem — drop sections prop
- `components/studyTools/NoteItem.tsx`: Remove `sections` from `Props`. Import `useLessonViewStore`, read from store.

## 6. NotesHighlightsTab — update JSX
- Remove `contentRef`, `sections` from `<HighlightItem>` call.
- Remove `sections` from `<NoteItem>` call.
