import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/services/api';

interface UserProfile {
    name: string;
    email: string;
    profileImage: string;
}

export const useUserProfile = () => {
    const [userProfile, setUserProfile] = useState<UserProfile>({
        name: "",
        email: "",
        profileImage: ""
    });
    const [isLoading, setIsLoading] = useState(false);

    const loadUserProfile = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setUserProfile({ name: "", email: "", profileImage: "" });
            return;
        }

        // First try to get from localStorage
        const storedName = localStorage.getItem("user_name") || "";
        const storedEmail = localStorage.getItem("user_email") || "";
        const storedImage = localStorage.getItem("user_profile_image") || "";

        setUserProfile({
            name: storedName,
            email: storedEmail,
            profileImage: storedImage
        });

        // If no stored data, fetch from API
        if (!storedName || !storedEmail) {
            try {
                setIsLoading(true);
                const response = await getCurrentUser();
                const profile = response.data as any;

                const updatedProfile = {
                    name: profile?.name || "",
                    email: profile?.email || "",
                    profileImage: profile?.profile_image_url || ""
                };

                // Update localStorage
                localStorage.setItem("user_name", updatedProfile.name);
                localStorage.setItem("user_email", updatedProfile.email);
                localStorage.setItem("user_profile_image", updatedProfile.profileImage);

                setUserProfile(updatedProfile);
            } catch (error) {
                console.error("Failed to fetch user profile:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const updateUserProfile = (profile: Partial<UserProfile>) => {
        setUserProfile(prev => ({ ...prev, ...profile }));
        
        // Update localStorage
        if (profile.name !== undefined) {
            localStorage.setItem("user_name", profile.name);
        }
        if (profile.email !== undefined) {
            localStorage.setItem("user_email", profile.email);
        }
        if (profile.profileImage !== undefined) {
            localStorage.setItem("user_profile_image", profile.profileImage);
        }
    };

    const clearUserProfile = () => {
        setUserProfile({ name: "", email: "", profileImage: "" });
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_profile_image");
    };

    return {
        userProfile,
        isLoading,
        loadUserProfile,
        updateUserProfile,
        clearUserProfile
    };
};