import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";
import CredentialsProvider from "next-auth/providers/credentials";
import { getPrismaAdapter } from "@/lib/auth/db-adapter";
import { getUserByEmail, verifyPassword } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/auth/db-adapter";
import { defaultPreferences } from "@/types/user";
import { logger } from "@/lib/logger";
import { sanitizeText } from "@/lib/security/input-validation";

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

  // Cookie configuration - optimized for cross-domain compatibility in production
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax', // Use 'none' in production for cross-domain
        path: '/',
        secure: process.env.NODE_ENV === "production", // Secure in production, not in development
        domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined, // Use custom domain in production
      },
    },
    // Explicitly configure the callback cookie used for state
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined,
      },
    },
    // Configure the CSRF token cookie
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined,
      },
    },
    // Configure the state cookie specifically for OAuth flows
    state: {
      name: 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined,
        maxAge: 900, // 15 minutes, matching the state maxAge
      },
    },
  },

  // Configure auth providers
  providers: [
    // Google OAuth provider with simplified configuration
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // Use standard authorization configuration
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account",
        },
      },
      // Keep standard checks for Google as they typically work well
      checks: ["state"],
      profile(profile) {
        // Sanitize profile data from OAuth provider
        const sanitizedName = profile.name ? sanitizeText(profile.name.trim()) : null;
        const sanitizedEmail = profile.email ? sanitizeText(profile.email.trim().toLowerCase()) : null;

        // Return a user object with required fields
        return {
          id: profile.sub,
          name: sanitizedName,
          bannerImage: null,
          donationLink: null,
          donationMethod: null,
          donationsEnabled: false,
          email: sanitizedEmail,
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

    // X/Twitter OAuth provider with improved configuration
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID || "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
      version: "2.0", // Use OAuth 2.0 for better compatibility
      profile(profile) {
        // Twitter OAuth 1.0A returns user data directly in profile object
        // OAuth 2.0 returns user data in a 'data' object (fallback for compatibility)
        const userData = profile.data || profile;

        // Sanitize profile data from OAuth provider
        const sanitizedName = userData.name ? sanitizeText(userData.name.trim()) : null;
        const sanitizedEmail = userData.email ? sanitizeText(userData.email.trim().toLowerCase()) : null;

        // Return a user object with required fields
        return {
          id: userData.id_str || userData.id, // OAuth 1.0A uses id_str, OAuth 2.0 uses id
          name: sanitizedName,
          bannerImage: null,
          donationLink: null,
          donationMethod: null,
          donationsEnabled: false,
          email: sanitizedEmail,
          image: userData.profile_image_url_https || userData.profile_image_url,
          provider: "twitter",
          // Add required fields with default values
          emailVerified: null,
          username: userData.username || null,
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Sanitize email input before database lookup
        const sanitizedEmail = sanitizeText(credentials.email.trim().toLowerCase());

        const user = await getUserByEmail(sanitizedEmail);

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
      // Log the redirect attempt for debugging
      authLogger.debug('Redirect callback called', { url, baseUrl });

      try {
        // If the URL is already absolute and starts with the base URL, use it directly
        if (url.startsWith(baseUrl)) {
          return url;
        }

        // If the URL is already a relative URL starting with /, use it directly
        if (url.startsWith('/')) {
          return url;
        }

        // For other URLs, make them relative by adding a leading /
        return `/${url}`;
      } catch (error) {
        // If there's any error in the redirect logic, log it and redirect to home
        authLogger.error('Error in redirect callback', { error, url, baseUrl });
        return '/';
      }
    },
    // Process new users from OAuth providers - optimized to reduce DB load
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

        // For Twitter OAuth without email, we need to handle differently
        if (!user.email && account?.provider === 'twitter') {
          // For Twitter users without email, check by provider account ID
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId || '',
              },
            },
            include: { user: true }
          });

          if (existingAccount) {
            // User exists, update last login
            await prisma.user.update({
              where: { id: existingAccount.userId },
              data: { lastLogin: new Date() }
            });
            return true;
          }

          // Create new user without email for Twitter
          const sanitizedName = user.name ? sanitizeText(user.name.trim()) : user.name;
          const dbUser = await prisma.user.create({
            data: {
              email: `twitter_${account.providerAccountId}@temp.local`, // Temporary email
              name: sanitizedName,
              image: user.image,
              provider: account?.provider,
              emailVerified: null, // No email verification for Twitter without email
              isProfileComplete: false,
              accounts: {
                create: {
                  type: account?.type || '',
                  provider: account?.provider || '',
                  providerAccountId: account?.providerAccountId || '',
                  access_token: account?.access_token,
                  expires_at: account?.expires_at,
                  token_type: account?.token_type,
                  scope: account?.scope,
                  id_token: account?.id_token,
                  session_state: account?.session_state,
                },
              },
            },
          });

          authLogger.debug("Created Twitter user without email", { userId: dbUser.id });
          return true;
        }

        // For users with email (Google, Twitter with email)
        if (!user.email) {
          authLogger.error("No email provided for OAuth user", { provider: account?.provider });
          return false;
        }

        // Check if user exists before attempting upsert
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, lastLogin: true }
        });

        // If user exists and logged in recently, skip the update
        if (existingUser && existingUser.lastLogin) {
          const lastLoginTime = new Date(existingUser.lastLogin).getTime();
          const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

          if (lastLoginTime > oneWeekAgo) {
            // User logged in recently, skip the update to reduce DB load
            return true;
          }
        }

        // Sanitize user data before storing in database
        const sanitizedEmail = user.email ? sanitizeText(user.email.trim().toLowerCase()) : user.email;
        const sanitizedName = user.name ? sanitizeText(user.name.trim()) : user.name;

        // Only perform upsert if user doesn't exist or hasn't logged in recently
        const dbUser = await prisma.user.upsert({
          where: { email: sanitizedEmail },
          create: {
            email: sanitizedEmail,
            name: sanitizedName,
            image: user.image,
            provider: account?.provider,
            emailVerified: new Date(),
            isProfileComplete: false,
            accounts: {
              create: {
                type: account?.type || '',
                provider: account?.provider || '',
                providerAccountId: account?.providerAccountId || '',
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

        // Check if profile completion is needed for OAuth users
        const needsProfileCompletion = !dbUser.username || !dbUser.birthdate || !dbUser.pronoun || !dbUser.termsAccepted;
        if (needsProfileCompletion) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              isProfileComplete: false,
              // Ensure these fields are properly set for profile completion check
            },
          });

          // Mark user as needing profile completion
          // This will be picked up by the JWT callback and middleware
          user.needsProfileCompletion = true;
        }

      } catch (error) {
        authLogger.error("Error in signIn event", { error });
      }

      return true; // Always return true to allow sign in
    },

    // Add custom user data to session - optimized for performance
    async session({ session, token }) {
      // Ensure id is a string
      const userId = (token.id as string) || (token.sub as string);

      if (!userId) {
        throw new Error("User ID is missing in token");
      }

      // Fetch the unread notifications count from the database
      let unreadNotificationsCount = 0;
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { unreadNotifications: true }
        });

        if (user) {
          unreadNotificationsCount = user.unreadNotifications;
          authLogger.debug('Fetched unread notifications count', {
            userId,
            count: unreadNotificationsCount
          });
        }
      } catch (error) {
        authLogger.error('Error fetching unread notifications count', { error, userId });
      }

      // Create a new session object with only the standard fields
      const userSession = {
        id: userId,
        name: token.name,
        email: token.email,
        image: (token.image || token.picture) as string | null | undefined,
        bannerImage: token.bannerImage,
        username: token.username || (token.name ? String(token.name).split(' ')[0].toLowerCase() : 'user'),
        birthdate: token.birthdate,
        isProfileComplete: token.isProfileComplete || false,
        needsProfileCompletion: token.needsProfileCompletion || false,
        unreadNotifications: unreadNotificationsCount, // Use the fetched count
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

      // Create a properly typed session user object with additional properties
      const typedUserSession = userSession as typeof userSession & {
        provider?: string;
        marketingOptIn?: boolean;
      };

      // Add provider if available (defined in Session interface in next-auth.d.ts)
      if (token.provider) {
        typedUserSession.provider = token.provider as string;
      }

      // Add marketingOptIn if available
      if (typeof token.marketingOptIn !== 'undefined') {
        typedUserSession.marketingOptIn = !!token.marketingOptIn;
      }

      // Assign to session
      session.user = typedUserSession;

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
        if (user && 'needsProfileCompletion' in user && user.needsProfileCompletion) {
          token.needsProfileCompletion = true;
        }

        // Fetch the user from DB to ensure we have the database ID
        let dbUser;

        if (user.email) {
          // For users with email (Google, Twitter with email)
          dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: {
              id: true,
              name: true,
              username: true,
              provider: true,
              isProfileComplete: true,
              image: true,
              bannerImage: true,
              preferences: true,
              marketingOptIn: true,
              unreadNotifications: true,
              birthdate: true
            }
          });
        } else if (account?.provider === 'twitter') {
          // For Twitter users without email, find by account
          const userAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId || '',
              },
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  provider: true,
                  isProfileComplete: true,
                  image: true,
                  bannerImage: true,
                  preferences: true,
                  marketingOptIn: true,
                  unreadNotifications: true,
                  birthdate: true
                }
              }
            }
          });
          dbUser = userAccount?.user;
        }

        if (!dbUser) {
          // Should not happen if adapter/signIn works correctly, but handle defensively
          authLogger.error(`User not found in DB during initial sign-in`, {
            email: user.email,
            provider: account?.provider,
            providerAccountId: account?.providerAccountId
          });
          // Return the token as-is or throw an error depending on desired behavior
          return token;
        }

        // Store data from the DB user in the token
        token.id = dbUser.id; // Use the actual database ID
        token.name = dbUser.name;
        token.username = dbUser.username;
        token.provider = dbUser.provider || (account ? account.provider : undefined); // Keep provider logic
        token.isProfileComplete = dbUser.isProfileComplete;
        token.image = dbUser.image;
        token.bannerImage = dbUser.bannerImage;
        token.marketingOptIn = dbUser.marketingOptIn;
        token.unreadNotifications = dbUser.unreadNotifications;
        token.birthdate = dbUser.birthdate;
        token.lastUpdated = Date.now();

        // Set needsProfileCompletion flag for OAuth users without complete profiles
        if (!dbUser.isProfileComplete || !dbUser.username) {
          token.needsProfileCompletion = true;
        }

        authLogger.debug('Initial token created with unread notifications', {
          userId: dbUser.id,
          count: dbUser.unreadNotifications
        });

        // Add emailVerified status to token
        // For social logins, set emailVerified to current date if not already set
        if (account && account.provider && (account.provider === 'google' || account.provider === 'twitter')) {
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
              name: true,
              username: true,
              isProfileComplete: true,
              preferences: true,
              marketingOptIn: true,
              image: true,
              bannerImage: true,
              emailVerified: true,
              unreadNotifications: true,
              birthdate: true
            }
          });

          if (dbUser) {
            token.name = dbUser.name;
            token.username = dbUser.username;
            token.isProfileComplete = dbUser.isProfileComplete;
            token.marketingOptIn = dbUser.marketingOptIn;
            token.image = dbUser.image;
            token.bannerImage = dbUser.bannerImage;
            token.emailVerified = dbUser.emailVerified;
            token.unreadNotifications = dbUser.unreadNotifications;
            token.birthdate = dbUser.birthdate;
            token.lastUpdated = Date.now();

            // Update needsProfileCompletion flag based on current profile state
            if (!dbUser.isProfileComplete || !dbUser.username) {
              token.needsProfileCompletion = true;
            } else {
              token.needsProfileCompletion = false;
            }

            authLogger.debug('Updated token with unread notifications count', {
              userId: token.id,
              count: dbUser.unreadNotifications
            });

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

  // Event handlers
  events: {
    createUser({ user }) {
      authLogger.info("User created", {
        email: user.email,
        hasName: !!user.name,
        hasImage: !!user.image
      });
    },
    signIn({ user, account, isNewUser }) {
      authLogger.info("User signed in", {
        email: user.email,
        provider: account?.provider,
        isNewUser
      });
    },
    signOut({ token }) {
      authLogger.info("User signed out", {
        userId: token.sub
      });
    },
    // Handle account linking
    async linkAccount({ user, account }) {
      authLogger.info("Account linked", {
        userId: user.id,
        provider: account.provider,
        providerAccountId: account.providerAccountId
      });
    },
  },

  // Add debug mode in development for better error visibility
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
