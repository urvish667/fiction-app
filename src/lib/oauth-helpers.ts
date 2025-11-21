// Helper function for OAuth success handling
export const handleOAuthSuccess = async (
    googleAuth: (idToken?: string, accessToken?: string) => Promise<any>,
    token: string,
    callbackUrl: string,
    setErrors: (errors: any) => void,
    setIsSubmitting: (isSubmitting: boolean) => void
) => {
    try {
        const user = await googleAuth(undefined, token)

        // Redirect to profile completion if needed
        if (user && !user.isProfileComplete) {
            window.location.href = '/complete-profile'
        } else {
            window.location.href = callbackUrl
        }
    } catch (error: any) {
        console.error('[OAuth] Authentication failed:', error)
        setErrors({ login: error.message || "Error signing in with Google. Please try again." })
        setIsSubmitting(false)
    }
}
