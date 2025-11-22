import { apiClient } from "@/lib/apiClient";
import { logError } from "@/lib/error-logger";

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

/**
 * Contact API service for interacting with the REST API endpoints
 */
export const ContactService = {
    /**
     * Submit contact form
     * @param contactData - Contact form data
     */
    async submitContactForm(contactData: ContactFormData): Promise<ApiResponse<void>> {
        try {
            const response = await apiClient.post<{
                success: boolean;
                message: string;
            }>("/contact", contactData);

            return {
                success: true,
                message: response.message || "Message sent successfully"
            };
        } catch (error: any) {
            logError(error.message || "Failed to submit contact form", {
                context: 'Submitting contact form',
                status: error.status,
                errorDetails: error
            });
            return {
                success: false,
                message: error.message || "Failed to send message. Please try again later."
            };
        }
    },
};
