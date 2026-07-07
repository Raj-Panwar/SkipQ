package com.skipq.backend.dto;

import com.skipq.backend.entity.Student;

/**
 * Returned by POST /api/students/login.
 * Contains only safe fields — the password hash is never included.
 */
public class LoginResponse {

    private Long id;
    private String fullName;
    private String email;
    private String collegeCode;
    private String phoneNumber;

    public LoginResponse() {}

    /** Convenience factory — builds from a Student entity. */
    public static LoginResponse from(Student student) {
        LoginResponse res = new LoginResponse();
        res.id          = student.getId();
        res.fullName    = student.getFullName();
        res.email       = student.getEmail();
        res.collegeCode = student.getCollege().getCode();
        res.phoneNumber = student.getPhoneNumber();
        return res;
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getCollegeCode() {
    return collegeCode;
}
    public String getPhoneNumber() { return phoneNumber; }
}
