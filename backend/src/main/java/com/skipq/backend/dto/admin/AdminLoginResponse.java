package com.skipq.backend.dto.admin;

public class AdminLoginResponse {

    private Long id;
    private String fullName;
    private String email;
    private String collegeCode;
    private String token;

    public AdminLoginResponse(Long id, String fullName, String email, String collegeCode) {
        this(id, fullName, email, collegeCode, null);
    }

    public AdminLoginResponse(Long id, String fullName, String email, String collegeCode, String token) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.collegeCode = collegeCode;
        this.token = token;
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getCollegeCode() { return collegeCode; }
    public String getToken() { return token; }
}