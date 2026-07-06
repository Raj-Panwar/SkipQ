package com.skipq.backend.service;

import com.skipq.backend.dto.college.*;
import com.skipq.backend.entity.College;
import com.skipq.backend.repository.CollegeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CollegeService {

    private final CollegeRepository collegeRepository;

    public CollegeService(CollegeRepository collegeRepository) {
        this.collegeRepository = collegeRepository;
    }

    public CollegeResponse createCollege(CreateCollegeRequest request) {

        String code = request.getCode().trim();

        if (collegeRepository.existsByCodeIgnoreCase(code)) {
            throw new IllegalArgumentException("College code already exists.");
        }
        College college = new College();

        college.setCode(code);

        

        college.setName(request.getName().trim());
        college.setDomain(trim(request.getDomain()));
        college.setCode(request.getCode());
        college.setLogoUrl(trim(request.getLogoUrl()));
        college.setContactEmail(trim(request.getContactEmail()));
        college.setContactPhone(trim(request.getContactPhone()));
        college.setAddress(trim(request.getAddress()));
        college.setCity(trim(request.getCity()));
        college.setState(trim(request.getState()));
        college.setCountry(trim(request.getCountry()));

        return toResponse(collegeRepository.save(college));
    }

    @Transactional(readOnly = true)
    public List<CollegeResponse> getAllColleges() {
        return collegeRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CollegeResponse getCollegeById(Long id) {
        College college = collegeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("College not found."));

        return toResponse(college);
    }

    @Transactional(readOnly = true)
    public CollegeResponse getCollegeByCode(String code) {

        College college = collegeRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new IllegalArgumentException("College not found."));

        return toResponse(college);
    }

    public CollegeResponse updateCollege(Long id, UpdateCollegeRequest request) {

        College college = collegeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("College not found."));

        college.setName(request.getName().trim());
        college.setDomain(trim(request.getDomain()));

        college.setLogoUrl(trim(request.getLogoUrl()));
        college.setContactEmail(trim(request.getContactEmail()));
        college.setContactPhone(trim(request.getContactPhone()));
        college.setAddress(trim(request.getAddress()));
        college.setCity(trim(request.getCity()));
        college.setState(trim(request.getState()));
        college.setCountry(trim(request.getCountry()));

        return toResponse(collegeRepository.save(college));
    }

    public CollegeResponse updateStatus(Long id, UpdateCollegeStatusRequest request) {

        College college = collegeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("College not found."));

        college.setActive(request.isActive());

        return toResponse(collegeRepository.save(college));
    }

    private CollegeResponse toResponse(College college) {

        CollegeResponse response = new CollegeResponse();

        response.setId(college.getId());
        response.setName(college.getName());
        response.setCode(college.getCode());
        response.setDomain(college.getDomain());
        response.setLogoUrl(college.getLogoUrl());
        response.setContactEmail(college.getContactEmail());
        response.setContactPhone(college.getContactPhone());
        response.setAddress(college.getAddress());
        response.setCity(college.getCity());
        response.setState(college.getState());
        response.setCountry(college.getCountry());
        response.setActive(college.isActive());
        response.setCreatedAt(college.getCreatedAt());
        response.setUpdatedAt(college.getUpdatedAt());

        return response;
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
