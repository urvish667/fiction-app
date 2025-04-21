import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { getPrismaAdapter } from "@/lib/auth/db-adapter";
import { getUserByEmail, verifyPassword } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/auth/db-adapter";
import { defaultPreferences } from "@/types/user";
import { logger } from "@/lib/logger";

// Create a dedicated auth logger
const authLogger = logger.child('nextauth');

// Main NextAuth configuration
export const authOptions: NextAuthOptions = {
  // Use Prisma adapter for database integration
  adapter: getPrismaAdapter(),

  // Configure session strategy with secure settings
  session: {
    strategy: "jwt",
    maxAge: 14 * 24 * 60 * 60, // 14 days (reduced from 60 days for better security)
    updateAge: 24 * 60 * 60, // 24 hours - only update session if older than this
  },

  // JWT configuration
  jwt: {
    // Use secure JWT settings
    secret: process.env.NEXTAUTH_SECRET,
    // Set max age to match session
    maxAge: 14 * 24 * 60 * 60, // 14 days
  },

  // Cookie configuration
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  // Configure auth providers
  providers: [
    // Google OAuth provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile, _tokens) {
        // Return a user object with required fields
        // @ts-ignore - NextAuth types don't match our custom user model
        return {
          id: profile.sub,
          name: profile.name,
          bannerImage: null,
          donationLink: null,
          donationMethod: null,
          donationsEnabled: false,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified,
          provider: "google",
          // Add required fields with default values
          username: null,
          password: null,
          birthdate: null,
          bio: null,
          pronoun: null,
          location: null,
          website: null,
          socialLinks: null,
          language: "en",
          theme: "system",
          termsAccepted: false,
          marketingOptIn: false,
          isProfileComplete: false,
          unreadNotifications: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: null,
          preferences: {
            emailNotifications: {
              newFollower: false,
              newComment: false,
              newLike: false,
              newChapter: false,
            },
            privacySettings: {
              publicProfile: false,
              showEmail: false,
              showLocation: false,
              allowMessages: false,
            }
          },
          country: "US"
        }
      },
    }),

    // Facebook OAuth provider
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      profile(profile, _tokens) {
        // Return a user object with required fields
        // @ts-ignore - NextAuth types don't match our custom user model
        return {
          id: profile.id,
          name: profile.name,
          bannerImage: null,
          donationLink: null,
          donationMethod: null,
          donationsEnabled: false,
          email: profile.email,
          image: profile.picture?.data?.url,
          provider: "facebook",
          // Add required fields with default values
          emailVerified: null,
          username: null,
          password: null,
          birthdate: null,
          bio: null,
          pronoun: null,
          location: null,
          website: null,
          socialLinks: null,
          language: "en",
          theme: "system",
          termsAccepted: false,
          marketingOptIn: false,
          isProfileComplete: false,
          unreadNotifications: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: null,
          preferences: {
            emailNotifications: {
              newFollower: false,
              newComment: false,
              newLike: false,
              newChapter: false,
            },
            privacySettings: {
              publicProfile: false,
              showEmail: false,
              showLocation: false,
              allowMessages: false,
            }
          },
          country: "US"
        }
      },
    }),

    // Email/password credentials provider
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // @ts-ignore - NextAuth types don't match our custom user model
      async authorize(credentials, _req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await getUserByEmail(credentials.email);

        if (!user || !user.password) {
          throw new Error("No user found with this email");
        }

        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        // Get user preferences
        const preferences = user.preferences ?
          (typeof user.preferences === 'string' ?
            JSON.parse(user.preferences) :
            user.preferences) :
          {
            emailNotifications: {
              newFollower: false,
              newComment: false,
              newLike: false,
              newChapter: false,
            },
            privacySettings: {
              publicProfile: false,
              showEmail: false,
              showLocation: false,
              allowMessages: false,
            }
          };

        // Return a complete User object with all required fields
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          image: user.image,
          bannerImage: user.bannerImage || null,
          donationLink: user.donationLink || null,
          donationMethod: user.donationMethod || null,
          donationsEnabled: user.donationsEnabled || false,
          isProfileComplete: user.isProfileComplete,
          preferences: preferences,
          provider: "credentials",
          marketingOptIn: user.marketingOptIn || false,
          // Add other required fields
          emailVerified: user.emailVerified,
          password: user.password,
          birthdate: user.birthdate,
          bio: user.bio || null,
          pronoun: user.pronoun || null,
          location: user.location || null,
          website: user.website || null,
          socialLinks: user.socialLinks || null,
          language: user.language || "en",
          theme: user.theme || "system",
          termsAccepted: user.termsAccepted || false,
          unreadNotifications: user.unreadNotifications || 0,
          createdAt: user.createdAt || new Date(),
          updatedAt: user.updatedAt || new Date(),
          lastLogin: user.lastLogin || null,
          country: user.country || "US",
        };
      },
    }),
  ],

  // Custom pages
  pages: {
    signIn: "/login", // Use our dedicated login page
    error: "/login", // Handle errors in the login page
  },

  // Redirect to profile completion page if needed
  callbacks: {
    async redirect({ url, baseUrl }) {
      // If the user is not logged in, redirect to the requested URL
      if (url.startsWith(baseUrl)) return url;

      // If the URL is absolute, make it relative
      const relativeUrl = url.startsWith('/') ? url : `/${url}`;

      return relativeUrl;
    },
    // Process new users from OAuth providers - optimized to reduce DB load
    // @ts-ignore - NextAuth types don't match our implementation
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        return true; // Skip for credentials login
      }

      try {
        // Log OAuth sign-in with structured data
        authLogger.info(`OAuth SignIn via ${account?.provider}`, {
          email: user.email,
          provider: account?.provider
        });

        // Check if user exists before attempting upsert
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { id: true, lastLogin: true }
        });

        // If user exists and logged in recently, skip the update
        if (existingUser && existingUser.lastLogin) {
          const lastLoginTime = new Date(existingUser.lastLogin).getTime();
          const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

          if (lastLoginTime > oneWeekAgo) {
            // User logged in recently, skip the update to reduce DB load
            return;
          }
        }

        // Only perform upsert if user doesn't exist or hasn't logged in recently
        const dbUser = await prisma.user.upsert({
          where: { email: user.email! },
          create: {
            email: user.email!,
            name: user.name,
            image: user.image,
            provider: account?.provider,
            emailVerified: new Date(),
            isProfileComplete: false,
            accounts: {
              create: {
                type: account?.type!,
                provider: account?.provider!,
                providerAccountId: account?.providerAccountId!,
                access_token: account?.access_token,
                expires_at: account?.expires_at,
                token_type: account?.token_type,
                scope: account?.scope,
                id_token: account?.id_token,
                session_state: account?.session_state,
              },
            },
          },
          update: {
            name: user.name || undefined,
            image: user.image || undefined,
            emailVerified: new Date(),
            lastLogin: new Date(),
          },
        });

        authLogger.debug("DB User after upsert", { userId: dbUser.id });

        // Check if profile completion is needed
        const needsProfileCompletion = !dbUser.username || !dbUser.birthdate || !dbUser.pronoun;
        if (needsProfileCompletion) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { isProfileComplete: false },
          });

          // Set a flag to redirect to profile completion page
          (user as any).needsProfileCompletion = true;
        }

      } catch (error) {
        authLogger.error("Error in signIn event", { error });
      }

      return true; // Always return true to allow sign in
    },

    async createUser({ user }: { user: any }) {
      authLogger.info("User created", {
        email: user.email,
        hasName: !!user.name,
        hasImage: !!user.image
      });
    },

    // Add custom user data to session - optimized for performance
    async session({ session, token }) {
      // Create a new session object with only the standard fields
      const userSession: any = {
        id: token.id as string || token.sub,
        name: token.name,
        email: token.email,
        image: token.image || token.picture,
        bannerImage: token.bannerImage,
        username: token.username || (token.name ? String(token.name).split(' ')[0].toLowerCase() : 'user'),
        isProfileComplete: token.isProfileComplete || false,
        needsProfileCompletion: token.needsProfileCompletion || false,
        unreadNotifications: 0, // Default value for now
        // Add preferences if available
        preferences: token.preferences || {
          emailNotifications: {
            newFollower: false,
            newComment: false,
            newLike: false,
            newChapter: false,
          },
          privacySettings: {
            publicProfile: false,
            showEmail: false,
            showLocation: false,
            allowMessages: false,
          },
        }
      };

      // Add provider if available (defined in Session interface in next-auth.d.ts)
      if (token.provider) {
        userSession.provider = token.provider;
      }

      // Add marketingOptIn if available
      if (typeof token.marketingOptIn !== 'undefined') {
        userSession.marketingOptIn = token.marketingOptIn;
      }

      // Assign to session
      session.user = userSession;

      return session;
    },

    // Add custom user data to token
    async jwt({ token, user, account, trigger }) {
      authLogger.debug('JWT callback started', {
        hasUser: !!user,
        trigger,
        tokenId: token.id || token.sub
      });

      // If this is a sign-in event, set the initial token data
      if (user) {
        // Check if user needs profile completion (set in signIn event)
        if ((user as any).needsProfileCompletion) {
          token.needsProfileCompletion = true;
        }
        // Fetch the user from DB to ensure we have the database ID
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: {
            id: true,
            username: true,
            provider: true,
            isProfileComplete: true,
            image: true,
            bannerImage: true,
            preferences: true,
            marketingOptIn: true
          }
        });

        if (!dbUser) {
          // Should not happen if adapter/signIn works correctly, but handle defensively
          authLogger.error(`User not found in DB during initial sign-in`, { email: user.email });
          // Return the token as-is or throw an error depending on desired behavior
          return token;
        }

        // Store data from the DB user in the token
        token.id = dbUser.id; // Use the actual database ID
        token.username = dbUser.username;
        token.provider = dbUser.provider || account?.provider; // Keep provider logic
        token.isProfileComplete = dbUser.isProfileComplete;
        token.image = dbUser.image;
        token.bannerImage = dbUser.bannerImage;
        token.marketingOptIn = dbUser.marketingOptIn;
        token.lastUpdated = Date.now();

        // Add emailVerified status to token
        // For social logins, set emailVerified to current date if not already set
        if (account?.provider && (account.provider === 'google' || account.provider === 'facebook')) {
          token.emailVerified = new Date();
        } else if (user.emailVerified) {
          token.emailVerified = user.emailVerified;
        }

        // Process preferences if they exist
        if (dbUser.preferences) {
          try {
            token.preferences = typeof dbUser.preferences === 'string'
              ? JSON.parse(dbUser.preferences)
              : dbUser.preferences;
          } catch (error) {
            authLogger.error('Error parsing preferences in JWT (initial sign-in)', { error });
            token.preferences = defaultPreferences; // Fallback to defaults
          }
        } else {
          token.preferences = defaultPreferences;
        }

        authLogger.debug(`Initial token created`, { userId: token.id });
        return token; // Return the populated token
      }

      // If it's not the initial sign-in, check if user data needs refreshing
      const shouldFetchUser =
        trigger === 'update' ||
        !token.preferences || // Fetch if preferences are missing
        !token.lastUpdated || // Fetch if lastUpdated is missing
        Date.now() > (token.lastUpdated as number) + (60 * 60 * 1000); // Re-fetch every 1 hour

      if (shouldFetchUser && token.id) { // Only fetch if we have a valid token.id (DB ID)
        authLogger.debug(`Refreshing token data`, { userId: token.id });
        try {
          // Fetch user data using the reliable database ID from the token
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string }, // Use ONLY token.id
            select: {
              username: true,
              isProfileComplete: true,
              preferences: true,
              marketingOptIn: true,
              image: true,
              bannerImage: true,
              emailVerified: true,
            }
          });

          if (dbUser) {
            token.username = dbUser.username;
            token.isProfileComplete = dbUser.isProfileComplete;
            token.marketingOptIn = dbUser.marketingOptIn;
            token.image = dbUser.image;
            token.bannerImage = dbUser.bannerImage;
            token.emailVerified = dbUser.emailVerified;
            token.lastUpdated = Date.now();

            // Process preferences if they exist
            if (dbUser.preferences) {
              try {
                const prefsData = typeof dbUser.preferences === 'string'
                  ? JSON.parse(dbUser.preferences)
                  : dbUser.preferences;

                token.preferences = {
                  ...defaultPreferences,
                  ...prefsData
                };
                authLogger.debug('Updated preferences from DB', { userId: token.id });
              } catch (error) {
                authLogger.error('Error parsing preferences in JWT callback', { error, userId: token.id });
              }
            } else {
              // Set default preferences if none exist
              token.preferences = defaultPreferences;
            }
          }
        } catch (error) {
          authLogger.error('Error refreshing token data', { error, userId: token.id });
          // Continue with existing token data on error
        }
      }

      authLogger.debug('JWT callback completed', { userId: token.id || token.sub });
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };