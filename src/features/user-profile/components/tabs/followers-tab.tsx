"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { ImageService } from "@/lib/api/images";
import type { FollowUserItem } from "../../types/user-profile.types";

interface FollowersTabProps {
  followers: FollowUserItem[];
  following: FollowUserItem[];
  followersLoading: boolean;
  followingLoading: boolean;
}

export function FollowersTab({
  followers,
  following,
  followersLoading,
  followingLoading,
}: FollowersTabProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="grid grid-cols-1 gap-8">
        {/* Followers Section */}
        <div id="followers">
          <h3 className="text-xl font-semibold mb-4">Followers</h3>
          {followersLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : followers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {followers.map((follower) => (
                <Card key={follower.id}>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <Avatar className="h-16 w-16 mb-2">
                      <AvatarImage
                        src={ImageService.getImageUrl(follower.image) || "/placeholder-user.jpg"}
                        alt={follower.name || follower.username}
                      />
                      <AvatarFallback>{(follower.name || follower.username || "U").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Link href={`/user/${follower.username}`} className="font-medium hover:text-primary">
                      {follower.name || follower.username}
                    </Link>
                    <p className="text-xs text-muted-foreground">@{follower.username}</p>
                    {follower.bio && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{follower.bio}</p>
                    )}
                    <Button size="sm" variant="outline" className="mt-2 w-full" asChild>
                      <Link href={`/user/${follower.username}`}>View Profile</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">No followers yet</h3>
              <p className="text-muted-foreground">This user doesn&apos;t have any followers yet.</p>
            </div>
          )}
        </div>

        {/* Following Section */}
        <div id="following">
          <h3 className="text-xl font-semibold mb-4">Following</h3>
          {followingLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : following.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {following.map((follow) => (
                <Card key={follow.id}>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <Avatar className="h-16 w-16 mb-2">
                      <AvatarImage
                        src={ImageService.getImageUrl(follow.image) || "/placeholder-user.jpg"}
                        alt={follow.name || follow.username}
                      />
                      <AvatarFallback>{(follow.name || follow.username || "U").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Link href={`/user/${follow.username}`} className="font-medium hover:text-primary">
                      {follow.name || follow.username}
                    </Link>
                    <p className="text-xs text-muted-foreground">@{follow.username}</p>
                    {follow.bio && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{follow.bio}</p>
                    )}
                    <Button size="sm" variant="outline" className="mt-2 w-full" asChild>
                      <Link href={`/user/${follow.username}`}>View Profile</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Not following anyone</h3>
              <p className="text-muted-foreground">This user isn&apos;t following anyone yet.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
