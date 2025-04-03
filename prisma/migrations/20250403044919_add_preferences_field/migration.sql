-- AlterTable
ALTER TABLE "User" ADD COLUMN     "preferences" JSONB DEFAULT '{"emailNotifications":{"newFollower":false,"newComment":false,"newLike":false,"newChapter":false,"marketing":false},"privacySettings":{"publicProfile":false,"showEmail":false,"showLocation":false,"allowMessages":false}}';
