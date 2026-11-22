-- Automatic YouTube solution videos for questions without a teacher video.
ALTER TABLE "questions" ADD COLUMN "auto_video_id" TEXT,
ADD COLUMN "auto_video_title" TEXT,
ADD COLUMN "auto_video_channel" TEXT,
ADD COLUMN "auto_video_at" TIMESTAMP(3),
ADD COLUMN "auto_video_blocked" BOOLEAN NOT NULL DEFAULT false;
