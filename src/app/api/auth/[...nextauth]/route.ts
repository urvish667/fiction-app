import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { getPrismaAdapter } from "@/lib/auth/db-adapter";
import { getUserByEmail, verifyPassword } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/auth/db-adapter";
import { defaultPreferences } from "@/types/user";

// Main NextAuth configuration
export const authOptions: NextAuthOptions = {
  // Use Prisma adapter for database integration
  adapter: getPrismaAdapter(),

  // Configure session strategy with longer duration to reduce auth requests
  session: {
    strategy: "jwt",
    maxAge: 60 * 24 * 60 * 60, // 60 days
    updateAge: 24 * 60 * 60, // 24 hours - only update session if older than this
  },

  // Configure auth providers
  providers: [
    // Google OAuth provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile, _tokens) {
        // Return a complete User object with all required fields
        return {
          id: profile.sub,
          name: profile.name,
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
          }
        }
      },
    }),

    // Facebook OAuth provider
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      profile(profile, _tokens) {
        // Return a complete User object with all required fields
        return {
          id: profile.id,
          name: profile.name,
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
          }
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
        };
      },
    }),
  ],

  // Custom pages
  pages: {
    signIn: "/", // We'll handle sign-in in our modal
    error: "/", // Will handle errors in the modal
  },

  // Events to handle special auth cases
  events: {
    // Process new users from OAuth providers - optimized to reduce DB load
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        return; // Skip for credentials login
      }

      try {
        // Reduce logging to minimize server load
        console.log(`OAuth SignIn: ${user.email} via ${account?.provider}`);

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

        console.log("DB User after upsert:", dbUser);

        // Check if profile completion is needed
        const needsProfileCompletion = !dbUser.username || !dbUser.birthdate || !dbUser.pronoun;
        if (needsProfileCompletion) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { isProfileComplete: false },
          });
        }

      } catch (error) {
        console.error("Error in signIn event:", error);
      }
    },

    async createUser({ user }) {
      console.log("Create User Event:", user);
    },
  },

  // Callbacks to customize auth behavior
  callbacks: {
    // Add custom user data to session - optimized for performance
    async session({ session, token }) {
      // Create a new session object with only the standard fields
      const userSession: any = {
        id: (token.id as string) || token.sub!,
        name: token.name,
        email: token.email,
        image: token.image || token.picture,
        bannerImage: token.bannerImage,
        username: token.username,
        isProfileComplete: token.isProfileComplete,
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
      // If this is a sign-in event, set the initial token data
      if (user) {
        // On sign-in, store all user data in the token to avoid future DB lookups
        token.id = user.id;
        token.username = user.username;
        token.provider = user.provider || account?.provider;
        token.isProfileComplete = user.isProfileComplete;
        token.image = user.image;
        token.bannerImage = user.bannerImage;
        token.lastUpdated = Date.now();

        // If user has preferences, store them in the token
        if ((user as any).preferences) {
          token.preferences = (user as any).preferences;
        }

        return token; // Return early to avoid DB query
      }

      // Always fetch from DB on update or if preferences are missing
      const shouldFetchUser =
        trigger === 'update' ||
        !token.preferences ||
        !token.lastUpdated ||
        Date.now() > (token.lastUpdated as number) + (60 * 60 * 1000); // 1 hour

      if (shouldFetchUser) {
        try {
          // Fetch user data including preferences
          const dbUser = await prisma.user.findUnique({
            where: { id: (token.id as string) || token.sub! },
            select: {
              username: true,
              isProfileComplete: true,
              preferences: true, // Always include preferences
              marketingOptIn: true,
              image: true,
              bannerImage: true,
              // Include other fields that might change frequently
            }
          });

          if (dbUser) {
            token.username = dbUser.username;
            token.isProfileComplete = dbUser.isProfileComplete;
            token.marketingOptIn = dbUser.marketingOptIn;
            token.image = dbUser.image;
            token.bannerImage = dbUser.bannerImage;
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
                console.log('JWT callback - updated preferences from DB');
              } catch (error) {
                console.error('Error parsing preferences in JWT callback:', error);
              }
            } else {
              // Set default preferences if none exist
              token.preferences = defaultPreferences;
            }
          }
        } catch (error) {
          console.error('Error refreshing token data:', error);
          // Continue with existing token data on error
        }
      }

      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };