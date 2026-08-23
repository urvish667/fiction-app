"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MapPin, LinkIcon, Mail } from "lucide-react";
import { TwitterIcon, FacebookIcon, InstagramIcon } from "@/components/common/social-icons";
import { ImageService } from "@/lib/api/images";
import { ProfileActionButtons } from "./profile-action-buttons";
import type { UserProfile } from "../types/user-profile.types";

interface ProfileHeaderProps {
  user: UserProfile;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const authorData = {
    id: user.id,
    name: user.name || user.username,
    donationMethod: user.donationMethod as "PAYPAL" | "STRIPE" | "BMC" | "KOFI" | null,
    donationLink: user.donationLink || null,
  };

  return (
    <div className="mb-4 md:mb-8">
      {/* Banner Image */}
      <div className="relative h-32 sm:h-48 md:h-64 w-full rounded-lg overflow-hidden mb-8 sm:mb-12 md:mb-16">
        <img
          src={ImageService.getImageUrl(typeof user.bannerImage === "string" ? user.bannerImage : null) || "/placeholder.svg"}
          alt="Profile banner"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Avatar positioned to overlap the banner */}
      <div className="relative -mt-20 sm:-mt-28 md:-mt-36 ml-2 sm:ml-4 md:ml-8 flex items-end justify-between">
        <Avatar className="w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 border-2 sm:border-4 border-background shadow-lg">
          <AvatarImage src={ImageService.getImageUrl(user.image) || "/placeholder-user.jpg"} alt={user.name || user.username} />
          <AvatarFallback>{(user.name || user.username).charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex items-center space-x-2 pb-2 sm:pb-4 pr-2 sm:pr-4">
          <ProfileActionButtons
            username={user.username}
            isCurrentUser={user.isCurrentUser}
            author={authorData}
          />
        </div>
      </div>

      {/* Profile Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pl-2 sm:pl-4 md:pl-40">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold tracking-tight">
              {user.name || user.username}
            </h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">@{user.username}</p>

          <div className="flex flex-wrap gap-2 sm:gap-4 mt-4 text-xs sm:text-sm text-muted-foreground">
            {user.email && user.preferences?.privacySettings?.showEmail && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="break-all">{user.email}</span>
              </div>
            )}

            {user.location && user.preferences?.privacySettings?.showLocation && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{user.location}</span>
              </div>
            )}

            {user.website && (
              <div className="flex items-center gap-1">
                <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary break-all"
                >
                  {user.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}

            {user.joinedDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Joined {user.joinedDate}</span>
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="flex gap-2 mt-4">
            {user.socialLinks?.twitter && (
              <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                <Button size="icon" variant="ghost">
                  <TwitterIcon className="h-4 w-4" />
                  <span className="sr-only">Twitter</span>
                </Button>
              </a>
            )}

            {user.socialLinks?.facebook && (
              <a href={user.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                <Button size="icon" variant="ghost">
                  <FacebookIcon className="h-4 w-4" />
                  <span className="sr-only">Facebook</span>
                </Button>
              </a>
            )}

            {user.socialLinks?.instagram && (
              <a href={user.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                <Button size="icon" variant="ghost">
                  <InstagramIcon className="h-4 w-4" />
                  <span className="sr-only">Instagram</span>
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <div className="mt-4 pl-2 sm:pl-4 md:pl-40">
          <p className="text-sm md:text-base max-w-2xl leading-relaxed">{user.bio}</p>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 pl-2 sm:pl-4 md:pl-40 flex flex-wrap gap-4 sm:gap-6 text-sm">
        <div>
          <span className="font-bold">{user.storyCount ?? 0}</span> Stories
        </div>
        <Link href="#followers" className="hover:text-primary">
          <span className="font-bold">{user.followers || 0}</span> Followers
        </Link>
        <Link href="#following" className="hover:text-primary">
          <span className="font-bold">{user.following || 0}</span> Following
        </Link>
      </div>
    </div>
  );
}
