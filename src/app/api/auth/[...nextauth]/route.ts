import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { getPrismaAdapter } from "@/lib/auth/db-adapter";
import { getUserByEmail, verifyPassword } from "@/lib/auth/auth-utils";

// Main NextAuth configuration
const handler = NextAuth({
  // Use Prisma adapter for database integration
  adapter: getPrismaAdapter(),
  
  // Configure session strategy
  session: {
    strategy: "jwt",
  },
  
  // Configure auth providers
  providers: [
    // Email/password credentials provider
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await getUserByEmail(credentials.email);
        
        if (!user || !user.password) {
          return null;
        }
        
        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.password
        );
        
        if (!isPasswordValid) {
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          image: user.image,
        };
      },
    }),
    
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
          username: null, // Will need to be set by user
          provider: "google",
        };
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
          username: null, // Will need to be set by user
          provider: "facebook",
        };
      },
    }),
  ],
  
  // Custom pages
  pages: {
    signIn: "/", // We'll handle sign-in in our modal
    error: "/", // Will handle errors in the modal
  },
  
  // Callbacks to customize auth behavior
  callbacks: {
    // Add custom user data to session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.username = token.username as string;
      }
      return session;
    },
    
    // Add custom user data to token
    async jwt({ token, user, account }) {
      if (user) {
        token.username = user.username;
        token.provider = account?.provider;
      }
      return token;
    },
  },
});

export { handler as GET, handler as POST }; 