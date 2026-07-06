package com.skipq.backend.dto.college;

public class UpdateCollegeStatusRequest {

    private boolean active;

    public UpdateCollegeStatusRequest() {
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}