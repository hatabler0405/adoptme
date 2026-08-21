package com.htabler0405.adoptme.dto;

public class UpdateUsernameRequest {
    private String currentPassword;
    private String newUsername;

    public String getCurrentPassword() { return currentPassword; }
    public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }

    public String getNewUsername() { return newUsername; }
    public void setNewUsername(String newUsername) { this.newUsername = newUsername; }
}