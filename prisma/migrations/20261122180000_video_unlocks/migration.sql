-- CreateTable
CREATE TABLE "video_unlocks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "lagos_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_unlocks_user_id_lagos_date_question_id_key" ON "video_unlocks"("user_id", "lagos_date", "question_id");

-- AddForeignKey
ALTER TABLE "video_unlocks" ADD CONSTRAINT "video_unlocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_unlocks" ADD CONSTRAINT "video_unlocks_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

