import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MahimaGhostPlayer } from "@/components/video";
import { formatDuration } from "@/components/video/MahimaVideoPlayer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Play, Lock, Clock, BookOpen, 
  Loader2, FileText, MessageCircle, Star, CheckCircle, Send, Library, ImageIcon, X,
  ChevronDown, ChevronUp, Download, Lightbulb, ListOrdered
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/contexts/AuthContext";
import { ArchiveBookList, type ArchiveBook } from "@/components/archive";
import { Textarea } from "@/components/ui/textarea";
import LessonActionBar from "@/components/video/LessonActionBar";
import { useLessonLikes } from "@/hooks/useLessonLikes";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { downloadFile } from "@/utils/fileUtils";
import Breadcrumbs from "@/components/course/Breadcrumbs";

// Type definitions
interface Lesson {
  id: string;
  title: string;
  video_url: string;
  is_locked: boolean | null;
  description: string | null;
  course_id: number | null;
  created_at: string | null;
  class_pdf_url: string | null;
  like_count: number | null;
}

/** Parse timestamps from description like "0:00:18 Topic name" */
function parseTimestamps(description: string | null | undefined): { time: string; label: string }[] {
  if (!description) return [];
  const regex = /(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)/g;
  const results: { time: string; label: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(description)) !== null) {
    results.push({ time: match[1], label: match[2].trim() });
  }
  return results;
}

const LessonView = () => {
  const { courseId: paramCourseId } = useParams();
  const [searchParams] = useSearchParams();
  const queryCourseId = searchParams.get("courseId");
  const courseId = paramCourseId || queryCourseId;
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();

  // State
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [archiveBooks, setArchiveBooks] = useState<ArchiveBook[]>([]);
  const [descExpanded, setDescExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [playlistOpen, setPlaylistOpen] = useState(false);

  // Refs
  const tabsRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { comments, loading: commentsLoading, createComment, fetchComments } = useComments(currentLesson?.id || undefined);
  const { likeCount, hasLiked, toggleLike, loading: likesLoading } = useLessonLikes(currentLesson?.id || undefined);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const progressSavedRef = useRef<string | null>(null);

  const { isAdmin, isTeacher } = useAuth();
  const isAdminOrTeacher = isAdmin || isTeacher;

  // --- Progress tracking ---
  useEffect(() => {
    if (!user || !courseId) return;
    supabase.from('user_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('course_id', Number(courseId))
      .eq('completed', true)
      .then(({ data }) => {
        if (data) setCompletedLessonIds(new Set(data.map(r => r.lesson_id)));
      });
  }, [user, courseId]);

  useEffect(() => { progressSavedRef.current = null; }, [currentLesson?.id]);

  const handleVideoTimeUpdate = useCallback(async (currentTime: number, duration: number) => {
    if (!user || !currentLesson || !courseId || duration <= 0) return;
    const progress = currentTime / duration;
    if (progress >= 0.8 && progressSavedRef.current !== currentLesson.id) {
      progressSavedRef.current = currentLesson.id;
      try {
        await supabase.from('user_progress').upsert({
          user_id: user.id,
          lesson_id: currentLesson.id,
          course_id: Number(courseId),
          completed: true,
          watched_seconds: Math.floor(currentTime),
          last_watched_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' });
        setCompletedLessonIds(prev => new Set([...prev, currentLesson.id]));
      } catch (err) {
        console.error('Progress save error:', err);
      }
    }
  }, [user, currentLesson, courseId]);

  // --- Notes ---
  useEffect(() => {
    if (currentLesson?.id) {
      const savedNote = localStorage.getItem(`lesson_note_${currentLesson.id}`);
      setNoteContent(savedNote || "");
    }
  }, [currentLesson?.id]);

  useEffect(() => {
    if (currentLesson?.id && noteContent) {
      const timer = setTimeout(() => {
        localStorage.setItem(`lesson_note_${currentLesson.id}`, noteContent);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [noteContent, currentLesson?.id]);

  // --- Archive books ---
  useEffect(() => {
    if (currentLesson?.id) {
      const savedBooks = localStorage.getItem(`lesson_archive_books_${currentLesson.id}`);
      if (savedBooks) {
        try { setArchiveBooks(JSON.parse(savedBooks)); } catch { setArchiveBooks([]); }
      } else { setArchiveBooks([]); }
    }
  }, [currentLesson?.id]);

  const handleAddArchiveBook = (book: Omit<ArchiveBook, 'id'>) => {
    if (!currentLesson?.id) return;
    const newBook: ArchiveBook = { ...book, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    const updatedBooks = [...archiveBooks, newBook];
    setArchiveBooks(updatedBooks);
    localStorage.setItem(`lesson_archive_books_${currentLesson.id}`, JSON.stringify(updatedBooks));
    toast.success("Book added!");
  };

  const handleRemoveArchiveBook = (bookId: string) => {
    if (!currentLesson?.id) return;
    const updatedBooks = archiveBooks.filter(b => b.id !== bookId);
    setArchiveBooks(updatedBooks);
    localStorage.setItem(`lesson_archive_books_${currentLesson.id}`, JSON.stringify(updatedBooks));
    toast.success("Book removed");
  };

  // --- Data fetching ---
  useEffect(() => {
    const initPage = async () => {
      if (!courseId) return;
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: enrollment } = await supabase
            .from('enrollments').select('*')
            .eq('user_id', user.id).eq('course_id', Number(courseId)).eq('status', 'active').maybeSingle();
          if (enrollment) setHasPurchased(true);
        }
        const { data: courseData, error: courseError } = await supabase
          .from('courses').select('*').eq('id', Number(courseId)).single();
        if (courseError) throw courseError;
        setCourse(courseData);
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons').select('*').eq('course_id', Number(courseId)).order('created_at', { ascending: true });
        if (lessonError) throw lessonError;
        setLessons(lessonData || []);
        if (lessonData && lessonData.length > 0) setCurrentLesson(lessonData[0]);
      } catch (error) {
        console.error("Error loading lessons:", error);
        toast.error("Could not load course content");
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [courseId]);

  useEffect(() => {
    if (currentLesson?.id) fetchComments();
  }, [currentLesson?.id, fetchComments]);

  // --- Logic ---
  const canAccessLesson = (lesson: Lesson) => !lesson.is_locked || hasPurchased;

  const handleLessonClick = (lesson: Lesson) => {
    if (canAccessLesson(lesson)) {
      setCurrentLesson(lesson);
      setPlaylistOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error("Course locked! Please buy to watch.");
      navigate(`/buy-course?id=${courseId}`);
    }
  };

  const scrollToTabs = (tab: string) => {
    setActiveTab(tab);
    setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  // --- Comments ---
  const handlePostComment = async () => {
    if (!newComment.trim() && !commentImage) { toast.error("Please enter a comment or attach an image"); return; }
    if (!user) { toast.error("Please login to comment"); return; }
    if (!currentLesson?.id) return;
    setIsPostingComment(true);
    let imageUrl: string | undefined;
    if (commentImage) {
      setUploadingImage(true);
      try {
        const filePath = `${user.id}/${Date.now()}_${commentImage.name}`;
        const { error: uploadError } = await supabase.storage.from("comment-images").upload(filePath, commentImage);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("comment-images").getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      } catch { toast.error("Failed to upload image"); setIsPostingComment(false); setUploadingImage(false); return; }
      setUploadingImage(false);
    }
    const success = await createComment(
      { lessonId: currentLesson.id, message: newComment.trim() || "📷 Image", imageUrl },
      profile?.fullName || user.email || 'Anonymous'
    );
    if (success) { setNewComment(""); setCommentImage(null); setCommentImagePreview(null); }
    setIsPostingComment(false);
  };

  const handleCommentImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setCommentImage(file);
    setCommentImagePreview(URL.createObjectURL(file));
  };

  const removeCommentImage = () => {
    setCommentImage(null);
    if (commentImagePreview) URL.revokeObjectURL(commentImagePreview);
    setCommentImagePreview(null);
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleDownloadPdf = async () => {
    if (!currentLesson?.class_pdf_url) return;
    try {
      await downloadFile(currentLesson.class_pdf_url, `${currentLesson.title}.pdf`);
      toast.success("Download started");
    } catch { toast.error("Download failed"); }
  };

  // Parsed data
  const timestamps = parseTimestamps(currentLesson?.description);
  const lessonDate = currentLesson?.created_at ? new Date(currentLesson.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const completedCount = completedLessonIds.size;
  const progressPercentage = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  // Breadcrumbs
  const breadcrumbSegments = [
    { label: "All Classes", href: "/dashboard" },
    ...(course ? [{ label: course.title, href: `/courses/${courseId}` }] : []),
    ...(currentLesson ? [{ label: currentLesson.title }] : []),
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) return <div className="p-10 text-center text-foreground">Course not found</div>;

  // --- Playlist Item Renderer ---
  const renderPlaylistItem = (lesson: Lesson, index: number) => {
    const isActive = currentLesson?.id === lesson.id;
    const isLocked = !canAccessLesson(lesson);
    const isCompleted = completedLessonIds.has(lesson.id);
    return (
      <div
        key={lesson.id}
        className={cn(
          "flex items-start gap-3 p-3 cursor-pointer border-l-2 transition-all hover:bg-accent/50",
          isActive ? "bg-primary/5 border-primary" : "border-transparent",
          isLocked && "opacity-60"
        )}
        onClick={() => handleLessonClick(lesson)}
      >
        <div className="mt-1">
          {isActive ? (
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center animate-pulse">
              <Play className="h-3 w-3 text-primary-foreground fill-primary-foreground" />
            </div>
          ) : isLocked ? (
            <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
          ) : isCompleted ? (
            <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-white fill-white" />
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center text-xs font-medium text-muted-foreground">
              {index + 1}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn("text-sm font-medium mb-0.5 line-clamp-2", isActive ? "text-primary" : "text-foreground")}>
            {lesson.title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isCompleted && <span className="text-green-600 font-medium">✓ Completed</span>}
            {isLocked && <span className="flex items-center gap-0.5"><Lock className="h-3 w-3" />Locked</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      
      {/* --- STICKY HEADER --- */}
      <header className="bg-card border-b border-border h-14 flex items-center px-3 lg:px-6 sticky top-0 z-30">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2 flex-shrink-0">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-foreground line-clamp-1">{currentLesson?.title || course.title}</h1>
          <p className="text-xs text-muted-foreground">{lessonDate}</p>
        </div>
        {!hasPurchased && (
          <Button size="sm" className="ml-2 flex-shrink-0" onClick={() => navigate(`/buy-course?id=${courseId}`)}>
            Buy Now
          </Button>
        )}
      </header>

      {/* Breadcrumbs */}
      <Breadcrumbs segments={breadcrumbSegments} />

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        
        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            
            {/* VIDEO PLAYER */}
            <div className="lg:m-4 lg:rounded-2xl overflow-hidden shadow-lg relative group">
              {currentLesson && currentLesson.video_url ? (
                <MahimaGhostPlayer
                  videoUrl={currentLesson.video_url}
                  title={currentLesson.title}
                  subtitle={lessonDate}
                  lessonId={currentLesson.id}
                  onReady={() => console.log('Video ready')}
                  onDurationReady={(dur) => setVideoDuration(dur)}
                  onTimeUpdate={handleVideoTimeUpdate}
                />
              ) : (
                <div className="aspect-video bg-black flex items-center justify-center">
                  <p className="text-white/50">Select a lesson to watch</p>
                </div>
              )}

              {/* Locked Overlay */}
              {currentLesson && !canAccessLesson(currentLesson) && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 text-center p-6">
                  <div className="bg-white/10 p-4 rounded-full mb-4">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Content Locked</h2>
                  <p className="text-gray-300 mb-6 max-w-md">
                    Unlock instant access to all {lessons.length} lessons.
                  </p>
                  <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-bold px-8"
                    onClick={() => navigate(`/buy-course?id=${courseId}`)}>
                    Unlock Full Course
                  </Button>
                </div>
              )}
            </div>

            {/* ACTION BAR — Pill Buttons */}
            {currentLesson && (
              <LessonActionBar
                likeCount={likeCount}
                hasLiked={hasLiked}
                onLike={toggleLike}
                onComments={() => scrollToTabs("doubts")}
                onDoubts={() => scrollToTabs("doubts")}
                likesLoading={likesLoading}
              />
            )}

            {/* --- LESSON INFO SECTION --- */}
            <div className="px-4 py-3 border-b border-border bg-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-foreground line-clamp-2">
                    {currentLesson?.title || "Course Introduction"}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{course.grade ? `Class ${course.grade}` : course.title}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {videoDuration > 0 ? formatDuration(videoDuration) : '—'}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Star className="h-3 w-3 text-primary fill-primary" />
                      4.8
                    </span>
                  </div>
                </div>
              </div>

              {/* Description with Read More */}
              {currentLesson?.description && (
                <div className="mt-3">
                  <p className={cn("text-sm text-muted-foreground leading-relaxed", !descExpanded && "line-clamp-3")}>
                    {currentLesson.description}
                  </p>
                  <button
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="text-primary text-xs font-medium mt-1 flex items-center gap-0.5"
                  >
                    {descExpanded ? <>Show less <ChevronUp className="h-3 w-3" /></> : <>Read More <ChevronDown className="h-3 w-3" /></>}
                  </button>
                </div>
              )}
            </div>

            {/* --- CLASS PDF DOWNLOAD --- */}
            {currentLesson?.class_pdf_url && (
              <div className="px-4 py-3 border-b border-border bg-card">
                <button
                  onClick={handleDownloadPdf}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-foreground">Class PDF</p>
                    <p className="text-xs text-muted-foreground">Download lecture notes</p>
                  </div>
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* --- SMART NOTES CARD --- */}
            <div className="px-4 py-3 border-b border-border bg-card">
              <div className="flex gap-3">
                <button
                  onClick={() => scrollToTabs("notes")}
                  className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-accent/50 border border-border hover:bg-accent transition-colors"
                >
                  <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">Smart Notes</p>
                    <p className="text-xs text-muted-foreground">Take & review notes</p>
                  </div>
                </button>
                <button
                  onClick={() => scrollToTabs("doubts")}
                  className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-accent/50 border border-border hover:bg-accent transition-colors"
                >
                  <MessageCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">Ask Doubt</p>
                    <p className="text-xs text-muted-foreground">Discuss with class</p>
                  </div>
                </button>
              </div>
            </div>

            {/* --- TOPICS COVERED --- */}
            {timestamps.length > 0 && (
              <div className="px-4 py-3 border-b border-border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <ListOrdered className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Topics Covered</h3>
                </div>
                <div className="space-y-2">
                  {timestamps.map((ts, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                      <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded flex-shrink-0">
                        {ts.time}
                      </span>
                      <span className="text-sm text-foreground">{ts.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- TABS (Overview / Resources / Notes / Discussion) --- */}
            <div ref={tabsRef} className="px-4 pt-4 pb-10 bg-card">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="resources" className="gap-1">
                    <Library className="h-3 w-3" />
                    Resources
                  </TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="doubts">Discussion</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="bg-card p-4 rounded-xl border border-border">
                  <h3 className="font-semibold text-base mb-3 text-foreground">About this lesson</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentLesson?.description || "In this lesson, we will cover the fundamental concepts needed to master this topic."}
                  </p>
                  <div className="mt-4 flex items-center gap-3 p-3 bg-primary/5 text-primary rounded-lg border border-primary/20">
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    <div className="text-sm font-medium">You will learn: Basic definitions, Real-world examples, and Problem solving.</div>
                  </div>
                </TabsContent>

                <TabsContent value="resources" className="bg-card p-4 rounded-xl border border-border">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Library className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-base text-foreground">Reference Books</h3>
                      {archiveBooks.length > 0 && (
                        <Badge variant="secondary" className="ml-2">{archiveBooks.length}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Access reference books and study materials from Archive.org.
                    </p>
                    <ArchiveBookList
                      books={archiveBooks}
                      isAdmin={isAdminOrTeacher}
                      onAddBook={handleAddArchiveBook}
                      onRemoveBook={handleRemoveArchiveBook}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="notes" className="bg-card p-4 rounded-xl border border-border">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-base text-foreground">Your Notes</h3>
                    </div>
                    <Textarea
                      placeholder="Start typing your notes here... They are auto-saved!"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="min-h-[250px] font-mono text-sm resize-none"
                    />
                    <p className="text-xs text-muted-foreground">✓ Notes are auto-saved locally.</p>
                  </div>
                </TabsContent>

                <TabsContent value="doubts" className="bg-card p-4 rounded-xl border border-border">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-base flex items-center gap-2 text-foreground">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      Discussion ({comments.length})
                    </h3>

                    {user ? (
                      <div className="flex gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                          {(profile?.fullName || user.email)?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 space-y-2">
                          <Textarea
                            placeholder="Post a comment or question..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[70px] resize-none"
                          />
                          {commentImagePreview && (
                            <div className="relative inline-block">
                              <img src={commentImagePreview} alt="Preview" className="max-w-xs max-h-32 rounded-lg border border-border" />
                              <button onClick={removeCommentImage} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <label className="cursor-pointer flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                              <ImageIcon className="h-4 w-4" />
                              <span>Attach Image</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handleCommentImageSelect} />
                            </label>
                            <Button onClick={handlePostComment} disabled={isPostingComment || uploadingImage || (!newComment.trim() && !commentImage)} size="sm" className="gap-2">
                              {isPostingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                              {uploadingImage ? 'Uploading...' : 'Post'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-accent/30 rounded-lg">
                        <p className="text-muted-foreground text-sm">Please login to post comments</p>
                        <Button variant="link" onClick={() => navigate('/login')}>Login now</Button>
                      </div>
                    )}

                    <div className="space-y-3">
                      {commentsLoading ? (
                        <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
                      ) : comments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>No comments yet. Be the first!</p>
                        </div>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3 p-3 bg-accent/30 rounded-lg">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                              {comment.userName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-medium text-foreground text-sm">{comment.userName}</span>
                                <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
                              </div>
                              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{comment.message}</p>
                              {comment.imageUrl && (
                                <img src={comment.imageUrl} alt="Comment attachment"
                                  className="mt-2 max-w-xs rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(comment.imageUrl!, '_blank')} />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* --- MOBILE PLAYLIST DRAWER --- */}
            {isMobile && (
              <div className="px-4 pb-6">
                <Drawer open={playlistOpen} onOpenChange={setPlaylistOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="outline" className="w-full gap-2">
                      <BookOpen className="h-4 w-4" />
                      Course Content ({lessons.length} lessons)
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[70vh]">
                    <DrawerHeader>
                      <DrawerTitle>Course Content</DrawerTitle>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>{progressPercentage}% Completed</span>
                        <span>{completedCount}/{lessons.length}</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2 mt-2" />
                    </DrawerHeader>
                    <ScrollArea className="flex-1 max-h-[50vh]">
                      <div className="divide-y divide-border">
                        {lessons.map((lesson, index) => renderPlaylistItem(lesson, index))}
                      </div>
                    </ScrollArea>
                  </DrawerContent>
                </Drawer>
              </div>
            )}
          </div>
        </main>

        {/* --- DESKTOP SIDEBAR PLAYLIST --- */}
        {!isMobile && (
          <aside className="w-96 bg-card border-l border-border flex flex-col h-auto">
            <div className="p-4 border-b border-border">
              <h3 className="font-bold text-foreground mb-2">Course Content</h3>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{progressPercentage}% Completed</span>
                <span>{completedCount}/{lessons.length}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            <ScrollArea className="flex-1">
              <div className="divide-y divide-border">
                {lessons.map((lesson, index) => renderPlaylistItem(lesson, index))}
              </div>
            </ScrollArea>
          </aside>
        )}
      </div>
    </div>
  );
};

export default LessonView;
