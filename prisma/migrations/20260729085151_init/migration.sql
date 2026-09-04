-- CreateTable
CREATE TABLE "profiles" (
    "user_id" TEXT NOT NULL,
    "name" TEXT,
    "level" TEXT NOT NULL DEFAULT 'intermediate',
    "preferred_style" TEXT NOT NULL DEFAULT 'professional',
    "learning_goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weekly_goal" INTEGER NOT NULL DEFAULT 100,
    "prefs" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "preferred_vocabulary" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preferred_vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correction_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "input_text" TEXT NOT NULL,
    "output_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "correction_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correction_items" (
    "id" TEXT NOT NULL,
    "history_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "find" TEXT NOT NULL,
    "suggest" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "expl" TEXT NOT NULL,
    "rule" TEXT NOT NULL,

    CONSTRAINT "correction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "pos" TEXT,
    "level" TEXT NOT NULL DEFAULT 'intermediate',
    "context" TEXT,
    "def" TEXT NOT NULL,
    "example" TEXT,
    "synonyms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "learned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phonetic" TEXT,
    "ease_factor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval_days" INTEGER NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "due_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tag" TEXT,

    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "preferred_vocabulary_user_id_term_key" ON "preferred_vocabulary"("user_id", "term");

-- CreateIndex
CREATE INDEX "correction_items_history_id_idx" ON "correction_items"("history_id");

-- CreateIndex
CREATE INDEX "flashcards_user_id_idx" ON "flashcards"("user_id");

-- CreateIndex
CREATE INDEX "flashcards_user_id_due_date_idx" ON "flashcards"("user_id", "due_date");

-- CreateIndex
CREATE INDEX "flashcards_user_id_tag_idx" ON "flashcards"("user_id", "tag");

-- CreateIndex
CREATE INDEX "quiz_attempts_user_id_idx" ON "quiz_attempts"("user_id");

-- AddForeignKey
ALTER TABLE "correction_items" ADD CONSTRAINT "correction_items_history_id_fkey" FOREIGN KEY ("history_id") REFERENCES "correction_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex (case-insensitive dedupe; mirrors supabase/migrations/0005_flashcard_unique_word.sql)
CREATE UNIQUE INDEX "flashcards_user_word_unique" ON "flashcards" ("user_id", lower(trim("word")));
