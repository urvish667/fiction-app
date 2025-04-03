-- AlterTable
ALTER TABLE "User" ALTER COLUMN "preferences" SET DEFAULT '{"emailNotifications":{"newFollower":false,"newComment":false,"newLike":false,"newChapter":false},"privacySettings":{"publicProfile":false,"showEmail":false,"showLocation":false,"allowMessages":false}}';
