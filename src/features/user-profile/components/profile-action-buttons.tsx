"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Share2, Check, Loader2, Users } from "lucide-react";
import { StoryService } from "@/lib/api/story";
import { UserService } from "@/lib/api/user";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { logError } from "@/lib/error-logger";
import { useProfileCompletionHandler } from "@/lib/profile-completion-handler";
import { SupportButton } from "@/features/story";

interface ProfileActionButtonsProps {
  username: string;
  isCurrentUser: boolean;
  author: {
    id: string;
    name: string;
    donationMethod: "PAYPAL" | "STRIPE" | "BMC" | "KOFI" | null;
    donationLink: string | null;
  };
}

export function ProfileActionButtons({
  username,
  isCurrentUser: isCurrentUserByProp,
  author,
}: ProfileActionButtonsProps) {
  const { user: currentUser, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { handleApiError } = useProfileCompletionHandler();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [isForumEnabled, setIsForumEnabled] = useState(false);
  const [forumLoading, setForumLoading] = useState(true);

  const isCurrentUser = currentUser?.username === username || isCurrentUserByProp;

  useEffect(() => {
    if (!isAuthenticated || isCurrentUser) return;

    let isCancelled = false;

    const checkFollowStatus = async () => {
      try {
        const response = await StoryService.isFollowingUser(username);
        if (isCancelled) return;
        setIsFollowing(response.success && Boolean(response.data));
      } catch (err) {
        if (isCancelled) return;
        logError(err, { context: "Error checking follow status", username });
      }
    };

    checkFollowStatus();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, username, isCurrentUser]);

  useEffect(() => {
    let isCancelled = false;

    const checkForumSetting = async () => {
      try {
        const response = await UserService.getUserProfile(username);
        if (isCancelled) return;
        if (response.success && response.data) {
          setIsForumEnabled(response.data.preferences?.privacySettings?.forum === true);
        }
      } catch (err) {
        if (isCancelled) return;
        logError(err, { context: "Error checking forum setting", username });
      } finally {
        if (!isCancelled) {
          setForumLoading(false);
        }
      }
    };

    checkForumSetting();

    return () => {
      isCancelled = true;
    };
  }, [username]);

  const handleFollow = async () => {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=/user/${username}`);
      return;
    }

    setFollowLoading(true);

    try {
      if (isFollowing) {
        await StoryService.unfollowUser(username);
        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You are no longer following @${username}`,
        });
        return;
      }

      await StoryService.followUser(username);
      setIsFollowing(true);
      toast({
        title: "Following",
        description: `You are now following @${username}`,
      });
    } catch (err: any) {
      if (handleApiError(err, `/user/${username}`)) {
        return;
      }

      logError(err, { context: "Error updating follow status", username });
      toast({
        title: "Error",
        description: err.message || "Failed to update follow status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = async () => {
    setShareLoading(true);

    try {
      const profileUrl = typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);

      toast({
        title: "Link Copied",
        description: "Profile link copied to clipboard",
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logError(err, { context: "Error sharing profile", username });
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Support Button - Icon only on mobile, full button on larger screens */}
      {!isCurrentUser && author.donationMethod && author.donationLink && (
        <>
          <div className="md:hidden">
            <SupportButton
              authorId={author.id}
              authorName={author.name}
              authorUsername={username}
              donationMethod={author.donationMethod}
              donationLink={author.donationLink}
              iconOnly={true}
            />
          </div>
          <div className="hidden md:block">
            <SupportButton
              authorId={author.id}
              authorName={author.name}
              authorUsername={username}
              donationMethod={author.donationMethod}
              donationLink={author.donationLink}
              iconOnly={false}
            />
          </div>
        </>
      )}

      {/* Don't show follow button for own profile */}
      {!isCurrentUser && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isFollowing ? "default" : "outline"}
                size="icon"
                className="rounded-full h-10 w-10"
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isFollowing ? (
                  <UserCheck className="h-5 w-5" />
                ) : (
                  <UserPlus className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFollowing ? "Unfollow" : "Follow"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10"
              onClick={handleShare}
              disabled={shareLoading}
            >
              {shareLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : copied ? (
                <Check className="h-5 w-5" />
              ) : (
                <Share2 className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share Profile</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Forum Button - Only show if forum is enabled */}
      {!forumLoading && isForumEnabled && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/user/${username}/forum`}>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-10 w-10"
                >
                  <Users className="h-5 w-5" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Forum</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export default ProfileActionButtons;
