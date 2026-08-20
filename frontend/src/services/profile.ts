import { fetchApi } from "./api";
import { UserProfile, UserProfileUpdatePayload } from "../types";

export const profileService = {
  async getProfile(): Promise<UserProfile> {
    return fetchApi<UserProfile>("/profile");
  },

  async updateProfile(payload: UserProfileUpdatePayload): Promise<UserProfile> {
    return fetchApi<UserProfile>("/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};
