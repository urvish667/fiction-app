import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { getPrismaAdapter } from "@/lib/auth/db-adapter";
import { getUserByEmail, verifyPassword } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/auth/db-adapter";

// Main NextAuth configuration
export const authOptions: NextAuthOptions = {
  // Use Prisma adapter for database integration
  adapter: getPrismaAdapter(),
  
  // Configure session strategy
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Configure auth providers
  providers: [
    // Google OAuth provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified,
          provider: "google",
        }
      },
    }),
    
    // Facebook OAuth provider
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url,
          provider: "facebook",
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
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          image: user.image,
          isProfileComplete: user.isProfileComplete,
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
    // Process new users from OAuth providers
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") {
        return; // Skip for credentials login
      }
      
      try {
        console.log("OAuth SignIn Event - User:", user);
        console.log("OAuth SignIn Event - Account:", account);
        console.log("OAuth SignIn Event - Profile:", profile);
        
        // Find or create user account
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
    // Add custom user data to session
    async session({ session, token }) {
      // Update session with token data
      session.user = {
        ...session.user,
        id: (token.id as string) || token.sub!,
        name: token.name,
        email: token.email,
        image: token.picture,
        username: token.username,
        isProfileComplete: token.isProfileComplete,
        unreadNotifications: 0, // Default value for now
      };
      
      return session;
    },
    
    // Add custom user data to token
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.provider = user.provider || account?.provider;
        token.isProfileComplete = user.isProfileComplete;
      }
      
      // Always fetch latest user data
      const dbUser = await prisma.user.findUnique({
        where: { id: (token.id as string) || token.sub! },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          image: true,
          birthdate: true,
          pronoun: true,
          isProfileComplete: true,
        }
      });
      
      if (dbUser) {
        token.username = dbUser.username;
        token.isProfileComplete = !!(dbUser.username && dbUser.birthdate && dbUser.pronoun);
      }
      
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 