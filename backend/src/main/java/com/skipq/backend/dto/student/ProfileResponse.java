package com.skipq.backend.dto.student;

import com.skipq.backend.entity.Student;

import java.time.LocalDateTime;

/**
 * Returned by GET /api/students/{id}.
 * Contains only safe, display-ready fields — the password hash is
 * never included.
 */
public class ProfileResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String collegeName;
    private String collegeCode;
    private LocalDateTime memberSince;

    public ProfileResponse() {
    }

    /** Convenience factory — builds from a Student entity. */
    public static ProfileResponse from(Student student) {
        ProfileResponse res = new ProfileResponse();
        res.id = student.getId();
        res.fullName = student.getFullName();
        res.email = student.getEmail();
        res.phoneNumber = student.getPhoneNumber();
        res.collegeName = student.getCollege().getName();
        res.collegeCode = student.getCollege().getCode();
        res.memberSince = student.getCreatedAt();
        return res;
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getCollegeName() { return collegeName; }
    public String getCollegeCode() { return collegeCode; }
    public LocalDateTime getMemberSince() { return memberSince; }
}