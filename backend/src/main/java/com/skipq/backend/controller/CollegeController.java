package com.skipq.backend.controller;

import com.skipq.backend.dto.college.CreateCollegeRequest;
import com.skipq.backend.dto.college.UpdateCollegeRequest;
import com.skipq.backend.dto.college.UpdateCollegeStatusRequest;
import com.skipq.backend.dto.college.CollegeResponse;
import com.skipq.backend.service.CollegeService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/colleges")
public class CollegeController {

    private final CollegeService collegeService;

    public CollegeController(CollegeService collegeService) {
        this.collegeService = collegeService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CollegeResponse createCollege(
            @Valid @RequestBody CreateCollegeRequest request) {

        return collegeService.createCollege(request);
    }

    @GetMapping
    public List<CollegeResponse> getAllColleges() {
        return collegeService.getAllColleges();
    }

    @GetMapping("/{id}")
    public CollegeResponse getCollegeById(@PathVariable Long id) {
        return collegeService.getCollegeById(id);
    }

    @GetMapping("/code/{code}")
    public CollegeResponse getCollegeByCode(@PathVariable String code) {
        return collegeService.getCollegeByCode(code);
    }

    @PutMapping("/{id}")
    public CollegeResponse updateCollege(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCollegeRequest request) {

        return collegeService.updateCollege(id, request);
    }

    @PatchMapping("/{id}/status")
    public CollegeResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCollegeStatusRequest request) {

        return collegeService.updateStatus(id, request);
    }
}
